import { createStore } from './store'

/**
 * Home menu "sudah dipelajari" badges — a lightweight localStorage flag per
 * menu action, keyed by whatever string the caller passes (Home's
 * `HomeMenuAction` values today; not imported directly so this module stays
 * scene-agnostic).
 *
 * This is deliberately NOT the ADR-004 progress/score/answers record — that
 * one is a separate data class slated for IndexedDB. This is just the
 * "have they reached evaluasi at least once" checkmark Home draws in a
 * menu button's corner, so localStorage is enough for it.
 */
export interface MenuBadges {
  schemaVersion: number
  /** Menu action -> reached-evaluasi flag. */
  completed: Record<string, boolean>
  /** Menu action -> available-to-open flag. The first learning level starts available. */
  unlocked: Record<string, boolean>
}

export const MENU_BADGES_CHANGED_EVENT = 'menu-badges-changed'

const STORAGE_KEY = 'edrawlab:menu-badges'
const SCHEMA_VERSION = 2

/** The learning path on Home. `keluar` intentionally stays outside this sequence. */
const LEARNING_MENU_SEQUENCE = ['desain-skema', 'jalur-pcb', 'cad-casing', 'evaluasi-akhir'] as const

const DEFAULTS: MenuBadges = {
  schemaVersion: SCHEMA_VERSION,
  completed: {},
  unlocked: { [LEARNING_MENU_SEQUENCE[0]]: true },
}

/** Same probe-then-fall-back pattern as settings.ts: hardened contexts can throw on any storage access. */
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

function completedFrom(stored: Partial<MenuBadges>): Record<string, boolean> {
  return Object.fromEntries(Object.entries(stored.completed ?? {}).filter(([, value]) => value === true))
}

/**
 * Migration for the old completed-only record. A learner's furthest completed
 * level proves the path was already reached before locking existed, so retain
 * access to every level up to the following one instead of re-locking it.
 */
function unlockedFromCompleted(completed: Record<string, boolean>): Record<string, boolean> {
  const furthestCompleted = LEARNING_MENU_SEQUENCE.reduce(
    (furthest, action, index) => (completed[action] ? index : furthest),
    -1,
  )
  const unlockedThrough = Math.min(furthestCompleted + 1, LEARNING_MENU_SEQUENCE.length - 1)

  return Object.fromEntries(LEARNING_MENU_SEQUENCE.slice(0, unlockedThrough + 1).map((action) => [action, true]))
}

function load(): MenuBadges {
  const raw = storage?.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULTS, completed: {}, unlocked: { ...DEFAULTS.unlocked } }

  try {
    const stored = JSON.parse(raw) as Partial<MenuBadges>
    if (stored.schemaVersion !== 1 && stored.schemaVersion !== SCHEMA_VERSION) {
      return { ...DEFAULTS, completed: {}, unlocked: { ...DEFAULTS.unlocked } }
    }

    const completed = completedFrom(stored)
    const unlocked = {
      ...unlockedFromCompleted(completed),
      // Keep an unlock already stored by version 2. This makes persistence
      // resilient if an earlier write was interrupted between two updates.
      ...Object.fromEntries(Object.entries(stored.unlocked ?? {}).filter(([, value]) => value === true)),
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      completed,
      unlocked,
    }
  } catch {
    return { ...DEFAULTS, completed: {}, unlocked: { ...DEFAULTS.unlocked } }
  }
}

function persist(state: MenuBadges) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota or a locked-down origin: keep running with in-memory badges.
  }
}

export const menuBadges = createStore<MenuBadges>(load(), {
  event: MENU_BADGES_CHANGED_EVENT,
  onChange: persist,
})

/** Marks a menu as "sudah dipelajari" and opens the next learning level. */
export function markMenuCompleted(action: string) {
  const current = menuBadges.get()
  const levelIndex = LEARNING_MENU_SEQUENCE.indexOf(action as (typeof LEARNING_MENU_SEQUENCE)[number])

  // A level can only advance the path after it has itself been opened.
  if (levelIndex >= 0 && !current.unlocked[action]) return

  const nextAction = levelIndex >= 0 ? LEARNING_MENU_SEQUENCE[levelIndex + 1] : undefined
  const completed = current.completed[action] ? current.completed : { ...current.completed, [action]: true }
  const unlocked = nextAction && !current.unlocked[nextAction]
    ? { ...current.unlocked, [nextAction]: true }
    : current.unlocked

  if (completed === current.completed && unlocked === current.unlocked) return
  menuBadges.set({ completed, unlocked })
}

export function isMenuCompleted(action: string): boolean {
  return !!menuBadges.get().completed[action]
}

/** `keluar` and any non-learning action are always available. */
export function isMenuUnlocked(action: string): boolean {
  return !LEARNING_MENU_SEQUENCE.includes(action as (typeof LEARNING_MENU_SEQUENCE)[number]) || !!menuBadges.get().unlocked[action]
}
