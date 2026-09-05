/**
 * Web Audio backend for `AudioDirector`, replacing Phaser's sound manager.
 *
 * Two deliberate departures from how Phaser handled the same files:
 *
 * 1. **Loops stream, they are not decoded.** Phaser decodes every registered
 *    track into an AudioBuffer — `work_theme.webm` alone is 4.8 MB of Opus,
 *    which lands as well over 100 MB of PCM on the heap of whatever phone is
 *    playing it. The loops here run through an `<audio>` element instead, so
 *    they cost their download and nothing more. One-shots stay decoded:
 *    they are tiny and need to fire without a scheduling delay.
 * 2. **Fades run on the audio thread.** `GainNode.linearRampToValueAtTime`
 *    is scheduled once and interpolated by the audio thread, so a crossfade
 *    costs zero main-thread work — where the Phaser implementation stepped
 *    every fade by hand on the game's per-frame STEP event.
 *
 * Everything degrades rather than throws: a browser that refuses
 * `AudioContext`, a `file://` origin that cannot `fetch`, a codec it cannot
 * decode — each leaves the app running silently instead of failing.
 */

export interface LoopHandle {
  readonly key: string
  /** Current volume, so the director can fade from wherever a running loop actually is. */
  readonly volume: number
  /** Ramps to `volume` over `durationMs` (0 = immediate). */
  rampTo(volume: number, durationMs: number): void
  stop(): void
}

/** A stoppable decoded one-shot, used by voice lines that must not outlive their scene. */
export interface OneShotHandle {
  /** Decoded duration, including when playback is muted or unavailable. */
  readonly durationMs: number
  stop(): void
}

/** Fades shorter than this are treated as instant — a ramp that brief is inaudible and just costs scheduling. */
const MIN_RAMP_MS = 16

type AudioContextCtor = typeof AudioContext

function contextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  return window.AudioContext ?? (window as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ?? null
}

class Loop implements LoopHandle {
  readonly key: string
  private element: HTMLAudioElement
  private gain: GainNode | null
  private ctx: AudioContext | null
  private current: number
  private stopped = false
  /** Only used on the no-Web-Audio fallback path, where a ramp has to be stepped in JS. */
  private timer = 0

  constructor(key: string, element: HTMLAudioElement, ctx: AudioContext | null, gain: GainNode | null, volume: number) {
    this.key = key
    this.element = element
    this.ctx = ctx
    this.gain = gain
    this.current = volume

    if (gain) {
      gain.gain.value = volume
      element.volume = 1
    } else {
      element.volume = volume
    }

    // Autoplay can still be refused even after an unlock gesture (a policy
    // change mid-session, a background tab). Nothing to recover here — the
    // next profile change tries again.
    void element.play().catch(() => {})
  }

  get volume() {
    return this.current
  }

  rampTo(volume: number, durationMs: number) {
    if (this.stopped) return
    window.clearInterval(this.timer)

    if (this.gain && this.ctx) {
      const now = this.ctx.currentTime
      // cancelAndHold is not on Safari; cancelScheduledValues + an explicit
      // setValueAtTime at the *current* value is the portable equivalent, and
      // is what keeps a duck interrupting a crossfade from jumping.
      this.gain.gain.cancelScheduledValues(now)
      this.gain.gain.setValueAtTime(this.gain.gain.value, now)
      this.gain.gain.linearRampToValueAtTime(volume, now + Math.max(durationMs, MIN_RAMP_MS) / 1000)
      this.current = volume
      return
    }

    if (durationMs < MIN_RAMP_MS) {
      this.current = volume
      this.element.volume = volume
      return
    }

    const from = this.current
    const started = performance.now()
    this.timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / durationMs)
      this.current = from + (volume - from) * progress
      this.element.volume = Math.min(1, Math.max(0, this.current))
      if (progress >= 1) window.clearInterval(this.timer)
    }, 40)
  }

  stop() {
    this.stopped = true
    window.clearInterval(this.timer)
    this.element.pause()
    this.element.src = ''
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private buffers = new Map<string, AudioBuffer>()
  private pending = new Map<string, Promise<AudioBuffer | null>>()
  private unlockBound = false
  private unlocked = false

  get isUnlocked() {
    return this.unlocked
  }

  /**
   * Browsers hold a fresh AudioContext suspended until a user gesture. This
   * binds the resume to the first one and reports it through `onUnlocked` —
   * the director holds the requested profile until then, which is why music
   * starts on the splash's first tap rather than on load.
   */
  bindUnlock(onUnlocked: () => void) {
    if (this.unlockBound) return
    this.unlockBound = true

    const events = ['pointerdown', 'touchend', 'keydown'] as const
    const unlock = () => {
      const ctx = this.ensureContext()
      const finish = () => {
        if (this.unlocked) return
        this.unlocked = true
        events.forEach((event) => window.removeEventListener(event, unlock))
        onUnlocked()
      }

      if (!ctx) {
        // No Web Audio at all: `<audio>` playback still works, and it is
        // equally gated on this gesture, so treat it as unlocked.
        finish()
        return
      }
      void ctx.resume().then(finish).catch(finish)
    }

    events.forEach((event) => window.addEventListener(event, unlock, { passive: true }))
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    const Ctor = contextCtor()
    if (!Ctor) return null

    try {
      this.ctx = new Ctor()
    } catch {
      this.ctx = null
    }
    return this.ctx
  }

  /**
   * Decodes a one-shot, trying each encoding in preference order — the same
   * "first one this browser can actually play" rule Phaser's loader applied,
   * except decode failure (not just a missing file) also falls through.
   * Resolves to null when nothing works; callers treat that as "not produced
   * yet" and stay silent.
   */
  load(key: string, urls: string[]): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(key)
    if (cached) return Promise.resolve(cached)

    const inFlight = this.pending.get(key)
    if (inFlight) return inFlight

    const task = this.decodeFirst(urls).then((buffer) => {
      if (buffer) this.buffers.set(key, buffer)
      this.pending.delete(key)
      return buffer
    })

    this.pending.set(key, task)
    return task
  }

  private async decodeFirst(urls: string[]): Promise<AudioBuffer | null> {
    const ctx = this.ensureContext()
    if (!ctx) return null

    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        const bytes = await response.arrayBuffer()
        return await ctx.decodeAudioData(bytes)
      } catch {
        // Wrong codec for this browser, or an origin that cannot fetch
        // (`file://`). Try the next encoding.
      }
    }
    return null
  }

  has(key: string) {
    return this.buffers.has(key)
  }

  /** Fires a decoded one-shot. Returns its length in ms, or 0 when it is not loaded. */
  playOneShot(key: string, volume: number): number {
    return this.playOneShotHandle(key, volume).durationMs
  }

  /** Fires a decoded one-shot and returns a handle for callers that need to cancel it. */
  playOneShotHandle(key: string, volume: number): OneShotHandle {
    const ctx = this.ensureContext()
    const buffer = this.buffers.get(key)
    const durationMs = buffer ? buffer.duration * 1000 : 0
    if (!ctx || !buffer || volume <= 0) return { durationMs, stop: () => {} }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    gain.gain.value = volume
    source.buffer = buffer
    source.connect(gain).connect(ctx.destination)
    source.start()

    let stopped = false
    return {
      durationMs,
      stop: () => {
        if (stopped) return
        stopped = true
        try {
          source.stop()
        } catch {
          // The source may already have ended naturally.
        }
        source.disconnect()
        gain.disconnect()
      },
    }
  }

  /**
   * Starts a streaming loop at `volume`. `urls` is the same preference-ordered
   * list `load` takes; the element picks the first it can play by itself
   * through `<source>` children — no decode, no probing.
   */
  createLoop(key: string, urls: string[], volume: number): LoopHandle | null {
    if (urls.length === 0) return null

    const element = document.createElement('audio')
    element.loop = true
    element.preload = 'auto'
    element.crossOrigin = 'anonymous'
    urls.forEach((url) => {
      const source = document.createElement('source')
      source.src = url
      element.appendChild(source)
    })

    const ctx = this.ensureContext()
    let gain: GainNode | null = null
    if (ctx) {
      try {
        gain = ctx.createGain()
        ctx.createMediaElementSource(element).connect(gain).connect(ctx.destination)
      } catch {
        // Some engines refuse a MediaElementSource on a `file://` document.
        // The element still plays; its own `volume` becomes the fade target.
        gain = null
      }
    }

    return new Loop(key, element, ctx, gain, volume)
  }
}

export const engine = new AudioEngine()
