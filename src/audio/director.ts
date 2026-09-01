import { settings, SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { EventBus } from '../state/eventBus'
import { AUDIO_ASSETS, AUDIO_PROFILES, SFX, resolveAudioUrls } from './manifest'
import type { AudioLayer, AudioProfileKey, MusicKey, AmbienceKey, SfxKey } from './manifest'
import { engine, type LoopHandle } from './engine'

const CROSSFADE_DURATION = 900
/** Ducking the same track between contexts should feel like a level change, not a cut. */
const DUCK_DURATION = 600

interface LayerTarget {
  key: string
  volume: number
}

/**
 * Owns every sound in the app: the three layers from Feature-Audio-System (SFX,
 * music, ambience), the per-scene profile they follow, and the autoplay unlock.
 *
 * Deliberately outside any scene — music has to survive a scene change, which
 * is the whole point of ducking rather than restarting. Scenes only declare
 * intent (`setProfile`, `play`); they never touch a sound object.
 *
 * The public surface here is unchanged from the Phaser-backed version, so the
 * BGM flow (profiles, crossfade, ducking, mute-as-a-fade, the missing-asset
 * warnings) behaves identically while the renderer migrates underneath it.
 * What changed is what it talks to: `engine.ts` (Web Audio), not
 * `game.sound`.
 */
class AudioDirector {
  private profile: AudioProfileKey = 'silent'
  private music: LoopHandle | null = null
  private ambience: LoopHandle | null = null
  private warned = new Set<string>()
  private attached = false
  private settingsBound = false

  /**
   * Starts the audio system. Takes no game object any more — the parameter is
   * kept so Phaser scenes still calling `audio.attach(game)` during the
   * migration compile unchanged.
   */
  attach(_game?: unknown) {
    if (this.attached) return
    this.attached = true

    if (!this.settingsBound) {
      this.settingsBound = true
      EventBus.on(SETTINGS_CHANGED_EVENT, this.applySettings, this)
    }

    engine.bindUnlock(() => {
      session.set({ audioUnlocked: true })
      // The profile a scene asked for while still locked is applied now —
      // this is the moment the splash's first tap turns into music.
      this.applyProfile(0)
    })

    // SFX ship with the shell: tiny, and needed the instant anything is
    // touched. Loops are not preloaded here — they stream on demand.
    void this.preload(['sfx'])
  }

  detach() {
    this.attached = false
    this.music?.stop()
    this.ambience?.stop()
    this.music = null
    this.ambience = null
    this.profile = 'silent'
  }

  /**
   * Decodes every registered one-shot of the given layers. Missing files are
   * skipped: the register is the plan, `assets/sounds/` is what has actually
   * been produced, and the app must run either way.
   *
   * `onProgress` reports 0..1 so a loading screen can ride it.
   */
  async preload(layers: AudioLayer[] = ['sfx'], onProgress?: (progress: number) => void) {
    const keys = Object.entries(AUDIO_ASSETS)
      .filter(([, asset]) => layers.includes(asset.layer))
      .map(([key]) => key)

    let done = 0
    await Promise.all(
      keys.map(async (key) => {
        const urls = resolveAudioUrls(key)
        if (urls.length === 0) this.warnMissing(key, AUDIO_ASSETS[key].file)
        else await engine.load(key, urls)

        done += 1
        onProgress?.(done / keys.length)
      }),
    )
  }

  /**
   * Transitional shim for Phaser scenes that queued audio onto a scene
   * loader. The loader is gone; this just kicks off the same preload and
   * returns immediately. Delete with the last Phaser scene.
   */
  queue(_scene: unknown, layers: AudioLayer[] = ['sfx', 'music', 'ambience']) {
    void this.preload(layers.filter((layer) => layer === 'sfx'))
  }

  /** Switches scene context. Re-declaring the current profile is a no-op. */
  setProfile(profile: AudioProfileKey) {
    if (this.profile === profile) return
    this.profile = profile
    this.applyProfile(CROSSFADE_DURATION)
  }

  get currentProfile() {
    return this.profile
  }

  /**
   * What the two loop layers are actually playing right now. Only consumed by
   * the `?probe=1` test hook (`src/probe.ts`): loop elements are deliberately
   * never appended to the document, so there is no other way for the harness
   * to assert that a profile change really started a track.
   */
  get debugState() {
    return {
      profile: this.profile,
      unlocked: engine.isUnlocked,
      music: this.music ? { key: this.music.key, volume: +this.music.volume.toFixed(3) } : null,
      ambience: this.ambience ? { key: this.ambience.key, volume: +this.ambience.volume.toFixed(3) } : null,
    }
  }

  /** Fires a one-shot. Silently does nothing when the file has not been produced yet. */
  play(key: SfxKey, config: { volume?: number } = {}) {
    if (!engine.isUnlocked) return
    if (!engine.has(key)) {
      this.warnMissing(key, SFX[key].file)
      return
    }

    engine.playOneShot(key, (config.volume ?? 1) * settings.get().sfxVolume * this.muteFactor())
  }

  /**
   * Fires a one-shot voice line and reports back its length in milliseconds,
   * for a caller that needs to choreograph something else (a lip-sync loop,
   * ducking the music) against it — `play()`'s fire-and-forget shape has no
   * way to report that. `onComplete` always fires, even when the file hasn't
   * been produced yet (0ms), so a caller's cleanup doesn't need its own
   * missing-asset branch.
   */
  playVoiceLine(key: SfxKey, onComplete?: () => void): number {
    if (!engine.isUnlocked || !engine.has(key)) {
      if (!engine.has(key)) this.warnMissing(key, SFX[key].file)
      onComplete?.()
      return 0
    }

    const durationMs = engine.playOneShot(key, settings.get().sfxVolume * this.muteFactor())
    if (durationMs > 0) window.setTimeout(() => onComplete?.(), durationMs)
    else onComplete?.()

    return durationMs
  }

  /**
   * Temporarily scales the current profile's music beneath its authored
   * volume — for a voice line that needs the BGM out of its way rather than
   * a scene switch's full crossfade. `restoreMusic()` re-reads the profile's
   * authored volume rather than dividing back out, so it stays correct even
   * if settings changed while ducked.
   */
  duckMusic(factor: number, duration = DUCK_DURATION) {
    this.music?.rampTo(this.musicTargetVolume() * factor, duration)
  }

  restoreMusic(duration = DUCK_DURATION) {
    this.music?.rampTo(this.musicTargetVolume(), duration)
  }

  private musicTargetVolume(): number {
    const target = AUDIO_PROFILES[this.profile] as { music?: { key: MusicKey; volume: number } }
    if (!target.music) return 0
    return target.music.volume * settings.get().musicVolume * this.muteFactor()
  }

  /**
   * 0 when muted, 1 otherwise. Folded into every volume calculation rather
   * than muting a track outright — a hard flag snaps every layer silent in
   * one frame, which is what made the toggle feel like a cut. Routing mute
   * through the same ramps as any other volume change keeps it a fade.
   */
  private muteFactor() {
    return settings.get().muted ? 0 : 1
  }

  private applySettings() {
    // Layer trims (and mute) changed: re-target the running loops without
    // restarting them — this is what turns muting into a fade instead of a cut.
    const target = this.profileTargets()
    if (this.music && target.music) this.music.rampTo(target.music.volume, DUCK_DURATION)
    if (this.ambience && target.ambience) this.ambience.rampTo(target.ambience.volume, DUCK_DURATION)
  }

  /** The current profile's two layers with every trim already folded in. */
  private profileTargets(): { music?: LayerTarget; ambience?: LayerTarget } {
    const profile = AUDIO_PROFILES[this.profile] as {
      music?: { key: MusicKey; volume: number }
      ambience?: { key: AmbienceKey; volume: number }
    }
    const trims = settings.get()
    const mute = this.muteFactor()

    return {
      music: profile.music && { key: profile.music.key, volume: profile.music.volume * trims.musicVolume * mute },
      ambience: profile.ambience && {
        key: profile.ambience.key,
        volume: profile.ambience.volume * trims.ambienceVolume * mute,
      },
    }
  }

  private applyProfile(crossfade: number) {
    if (!engine.isUnlocked) return

    const target = this.profileTargets()
    this.music = this.transition(this.music, target.music, crossfade)
    this.ambience = this.transition(this.ambience, target.ambience, crossfade)
  }

  /**
   * Moves one layer to its next track. When the next track is the one already
   * playing, the volume is ridden instead — that is what makes menu → stage 1
   * a duck rather than a restart.
   */
  private transition(current: LoopHandle | null, next: LayerTarget | undefined, crossfade: number): LoopHandle | null {
    if (!next) {
      this.fadeOut(current, crossfade)
      return null
    }

    if (current && current.key === next.key) {
      current.rampTo(next.volume, crossfade > 0 ? DUCK_DURATION : 0)
      return current
    }

    this.fadeOut(current, crossfade)

    const urls = resolveAudioUrls(next.key)
    if (urls.length === 0) {
      this.warnMissing(next.key, AUDIO_ASSETS[next.key].file)
      return null
    }

    const loop = engine.createLoop(next.key, urls, crossfade > 0 ? 0 : next.volume)
    if (crossfade > 0) loop?.rampTo(next.volume, crossfade)

    return loop
  }

  private fadeOut(loop: LoopHandle | null, duration: number) {
    if (!loop) return
    if (duration <= 0) {
      loop.stop()
      return
    }

    loop.rampTo(0, duration)
    window.setTimeout(() => loop.stop(), duration)
  }

  private warnMissing(key: string, file: string) {
    if (this.warned.has(key)) return
    this.warned.add(key)
    console.warn(`[audio] "${key}" is not produced yet — expected assets/sounds/${file}`)
  }
}

export const audio = new AudioDirector()
