import { createStore } from './store'

/**
 * Home menu "sudah dipelajari" badges and learning-path unlocks for the
 * current browser session. They deliberately reset when the app reloads.
 */
export interface MenuBadges {
  /** Menu action -> reached-evaluasi flag. */
  completed: Record<string, boolean>
  /** Menu action -> available-to-open flag. The first learning level starts available. */
  unlocked: Record<string, boolean>
}

export const MENU_BADGES_CHANGED_EVENT = 'menu-badges-changed'

/** The learning path on Home. `keluar` intentionally stays outside this sequence. */
const LEARNING_MENU_SEQUENCE = ['desain-skema', 'jalur-pcb', 'cad-casing', 'evaluasi-akhir'] as const

const INITIAL_STATE: MenuBadges = {
  completed: {},
  unlocked: { [LEARNING_MENU_SEQUENCE[0]]: true },
}

export const menuBadges = createStore<MenuBadges>(INITIAL_STATE, {
  event: MENU_BADGES_CHANGED_EVENT,
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
