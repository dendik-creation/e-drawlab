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
}

export const MENU_BADGES_CHANGED_EVENT = 'menu-badges-changed'

const STORAGE_KEY = 'edrawlab:menu-badges'
const SCHEMA_VERSION = 1

const DEFAULTS: MenuBadges = {
  schemaVersion: SCHEMA_VERSION,
  completed: {},
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

function load(): MenuBadges {
  const raw = storage?.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULTS, completed: {} }

  try {
    const stored = JSON.parse(raw) as Partial<MenuBadges>
    if (stored.schemaVersion !== SCHEMA_VERSION) return { ...DEFAULTS, completed: {} }

    return {
      schemaVersion: SCHEMA_VERSION,
      completed: { ...stored.completed },
    }
  } catch {
    return { ...DEFAULTS, completed: {} }
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

/** Marks a menu as "sudah dipelajari". Idempotent — re-marking an already-completed menu is a no-op. */
export function markMenuCompleted(action: string) {
  if (menuBadges.get().completed[action]) return
  menuBadges.set({ completed: { ...menuBadges.get().completed, [action]: true } })
}

export function isMenuCompleted(action: string): boolean {
  return !!menuBadges.get().completed[action]
}
