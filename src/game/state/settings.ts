import { createStore } from './store'

/**
 * Persisted learner preferences.
 *
 * Per Data-Architecture §Data classes these are a separate data class from
 * progress: tiny, synchronous, and they deliberately SURVIVE `[DESAIN ULANG]`.
 * ADR-004 pins them to `localStorage` even though progress will use IndexedDB —
 * so the reset that wipes a run must never touch this key.
 */
export interface Settings {
  schemaVersion: number
  /**
   * Master mute. Mandatory control (REQ-UX-006): three students share a machine
   * in a room full of other groups, so muting has to silence every layer, not
   * just the music.
   */
  muted: boolean
  /** Per-layer trims, multiplied onto each track's authored volume. */
  musicVolume: number
  sfxVolume: number
  ambienceVolume: number
  /** Honoured by the bubble transitions and the Home logo idle loop. */
  reducedMotion: boolean
}

export const SETTINGS_CHANGED_EVENT = 'settings-changed'

const STORAGE_KEY = 'edrawlab:preferences'
const SCHEMA_VERSION = 1

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

const DEFAULTS: Settings = {
  schemaVersion: SCHEMA_VERSION,
  muted: false,
  musicVolume: 1,
  sfxVolume: 1,
  ambienceVolume: 1,
  reducedMotion: prefersReducedMotion(),
}

/**
 * Hardened `file://` contexts and private browsing can throw on any access, so
 * storage is probed once and the app falls back to in-memory preferences that
 * simply do not survive a reload.
 */
function probeStorage(): Storage | null {
  try {
    const probe = `${STORAGE_KEY}:probe`
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

const storage = probeStorage()

function clamp01(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback
}

function load(): Settings {
  const raw = storage?.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULTS }

  try {
    const stored = JSON.parse(raw) as Partial<Settings>

    // Preferences are cheap to rebuild, so an unknown schema is discarded
    // rather than migrated — unlike the progress record, which must migrate.
    if (stored.schemaVersion !== SCHEMA_VERSION) return { ...DEFAULTS }

    return {
      schemaVersion: SCHEMA_VERSION,
      muted: stored.muted ?? DEFAULTS.muted,
      musicVolume: clamp01(stored.musicVolume, DEFAULTS.musicVolume),
      sfxVolume: clamp01(stored.sfxVolume, DEFAULTS.sfxVolume),
      ambienceVolume: clamp01(stored.ambienceVolume, DEFAULTS.ambienceVolume),
      reducedMotion: stored.reducedMotion ?? DEFAULTS.reducedMotion,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function persist(state: Settings) {
  state.musicVolume = clamp01(state.musicVolume, DEFAULTS.musicVolume)
  state.sfxVolume = clamp01(state.sfxVolume, DEFAULTS.sfxVolume)
  state.ambienceVolume = clamp01(state.ambienceVolume, DEFAULTS.ambienceVolume)

  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota or a locked-down origin: keep running with in-memory preferences.
  }
}

export const settings = createStore<Settings>(load(), {
  event: SETTINGS_CHANGED_EVENT,
  onChange: persist,
})

export function toggleMute() {
  settings.set({ muted: !settings.get().muted })
}

/** Restores factory preferences. NOT part of `[DESAIN ULANG]`, which keeps them. */
export function resetPreferences() {
  settings.set({ ...DEFAULTS, reducedMotion: prefersReducedMotion() })
}
