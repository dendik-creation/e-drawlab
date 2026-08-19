import Phaser from 'phaser'
import { settings, SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { EventBus } from '../EventBus'
import {
  AMBIENCE,
  AUDIO_ASSETS,
  AUDIO_PROFILES,
  MUSIC,
  SFX,
  resolveAudioUrls,
} from './manifest'
import type { AudioLayer, AudioProfileKey, SfxKey } from './manifest'

/** `game.sound.add()` is typed as BaseSound, which has no volume. The concrete backends do. */
type ManagedSound =
  | Phaser.Sound.WebAudioSound
  | Phaser.Sound.HTML5AudioSound
  | Phaser.Sound.NoAudioSound

interface Fade {
  sound: ManagedSound
  from: number
  to: number
  elapsed: number
  duration: number
  stopWhenDone: boolean
}

const CROSSFADE_DURATION = 900
/** Ducking the same track between contexts should feel like a level change, not a cut. */
const DUCK_DURATION = 600

/**
 * Owns every sound in the app: the three layers from Feature-Audio-System (SFX,
 * music, ambience), the per-scene profile they follow, and the autoplay unlock.
 *
 * It is deliberately game-global rather than scene-owned — music has to survive
 * a scene change, which is the whole point of ducking rather than restarting.
 * Scenes only ever declare intent (`setProfile`, `play`); they never touch a
 * Sound object.
 */
class AudioDirector {
  private game: Phaser.Game | null = null
  private profile: AudioProfileKey = 'silent'
  private music: ManagedSound | null = null
  private ambience: ManagedSound | null = null
  private fades: Fade[] = []
  private warned = new Set<string>()

  attach(game: Phaser.Game) {
    this.game = game

    game.events.on(Phaser.Core.Events.STEP, this.step, this)
    EventBus.on(SETTINGS_CHANGED_EVENT, this.applySettings, this)

    // Browsers block audio until a user gesture, so the profile requested during
    // boot is held and started the moment Phaser reports the unlock.
    if (game.sound.locked) {
      game.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        session.set({ audioUnlocked: true })
        this.applyProfile(0)
      })
    } else {
      session.set({ audioUnlocked: true })
    }
  }

  detach() {
    const game = this.game
    if (!game) return

    game.events.off(Phaser.Core.Events.STEP, this.step, this)
    EventBus.off(SETTINGS_CHANGED_EVENT, this.applySettings, this)
    this.fades = []
    this.music = null
    this.ambience = null
    this.profile = 'silent'
    this.game = null
  }

  /**
   * Queues every registered file of the given layers onto a scene's loader.
   * Missing files are skipped: the register is the plan, `assets/sounds/` is
   * what has actually been produced, and the app must run either way.
   */
  queue(scene: Phaser.Scene, layers: AudioLayer[] = ['sfx', 'music', 'ambience']) {
    Object.entries(AUDIO_ASSETS).forEach(([key, asset]) => {
      if (!layers.includes(asset.layer)) return
      if (scene.cache.audio.exists(key)) return

      // Every available encoding is handed over; Phaser keeps the first one the
      // browser can actually decode.
      const urls = resolveAudioUrls(key)
      if (urls.length === 0) {
        this.warnMissing(key, asset.file)
        return
      }
      scene.load.audio(key, urls)
    })
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

  /** Fires a one-shot. Silently does nothing when the file has not been produced yet. */
  play(key: SfxKey, config: Phaser.Types.Sound.SoundConfig = {}) {
    const game = this.game
    if (!game || game.sound.locked) return
    if (!game.cache.audio.exists(key)) {
      this.warnMissing(key, SFX[key].file)
      return
    }

    game.sound.play(key, { ...config, volume: (config.volume ?? 1) * settings.get().sfxVolume * this.muteFactor() })
  }

  /**
   * 0 when muted, 1 otherwise. Folded into every volume calculation instead
   * of Phaser's `sound.mute` — that flag snaps every track silent/audible in
   * one frame, which is what made the toggle feel like a hard cut. Routing
   * mute through the existing fade machinery (fadeTo/transition) makes it
   * ride down and back up like any other volume change.
   */
  private muteFactor() {
    return settings.get().muted ? 0 : 1
  }

  private applySettings() {
    const game = this.game
    if (!game) return

    // Layer trims (and mute) changed: re-target the running loops without
    // restarting them — this is what turns muting into a fade instead of a cut.
    const target = AUDIO_PROFILES[this.profile] as {
      music?: { key: keyof typeof MUSIC; volume: number }
      ambience?: { key: keyof typeof AMBIENCE; volume: number }
    }
    if (this.music && target.music) {
      this.fadeTo(this.music, target.music.volume * settings.get().musicVolume * this.muteFactor(), DUCK_DURATION, false)
    }
    if (this.ambience && target.ambience) {
      this.fadeTo(
        this.ambience,
        target.ambience.volume * settings.get().ambienceVolume * this.muteFactor(),
        DUCK_DURATION,
        false,
      )
    }
  }

  private applyProfile(crossfade: number) {
    const game = this.game
    if (!game || game.sound.locked) return

    const target = AUDIO_PROFILES[this.profile] as {
      music?: { key: keyof typeof MUSIC; volume: number }
      ambience?: { key: keyof typeof AMBIENCE; volume: number }
    }
    const trims = settings.get()
    const mute = this.muteFactor()

    this.music = this.transition(
      this.music,
      target.music && { key: target.music.key, volume: target.music.volume * trims.musicVolume * mute },
      crossfade,
    )
    this.ambience = this.transition(
      this.ambience,
      target.ambience && {
        key: target.ambience.key,
        volume: target.ambience.volume * trims.ambienceVolume * mute,
      },
      crossfade,
    )
  }

  /**
   * Moves one layer to its next track. When the next track is the one already
   * playing, the volume is ridden instead — that is what makes menu → stage 1
   * a duck rather than a restart.
   */
  private transition(
    current: ManagedSound | null,
    next: { key: string; volume: number } | undefined,
    crossfade: number,
  ): ManagedSound | null {
    const game = this.game
    if (!game) return null

    if (!next) {
      if (current) this.fadeTo(current, 0, crossfade, true)
      return null
    }

    if (current && current.key === next.key) {
      this.fadeTo(current, next.volume, crossfade > 0 ? DUCK_DURATION : 0, false)
      return current
    }

    if (current) this.fadeTo(current, 0, crossfade, true)

    if (!game.cache.audio.exists(next.key)) {
      this.warnMissing(next.key, AUDIO_ASSETS[next.key].file)
      return null
    }

    const sound = game.sound.add(next.key, {
      loop: true,
      volume: crossfade > 0 ? 0 : next.volume,
    }) as ManagedSound

    sound.play()
    if (crossfade > 0) this.fadeTo(sound, next.volume, crossfade, false)

    return sound
  }

  private fadeTo(sound: ManagedSound, to: number, duration: number, stopWhenDone: boolean) {
    this.fades = this.fades.filter((fade) => fade.sound !== sound)

    if (duration <= 0) {
      sound.setVolume(to)
      if (stopWhenDone) this.release(sound)
      return
    }

    this.fades.push({ sound, from: sound.volume, to, elapsed: 0, duration, stopWhenDone })
  }

  private step(_time: number, delta: number) {
    if (this.fades.length === 0) return

    this.fades = this.fades.filter((fade) => {
      fade.elapsed += delta
      const progress = Math.min(1, fade.elapsed / fade.duration)

      fade.sound.setVolume(fade.from + (fade.to - fade.from) * progress)
      if (progress < 1) return true

      if (fade.stopWhenDone) this.release(fade.sound)
      return false
    })
  }

  private release(sound: ManagedSound) {
    sound.stop()
    this.game?.sound.remove(sound)
  }

  private warnMissing(key: string, file: string) {
    if (this.warned.has(key)) return
    this.warned.add(key)
    console.warn(`[audio] "${key}" is not produced yet — expected assets/sounds/${file}`)
  }
}

export const audio = new AudioDirector()
