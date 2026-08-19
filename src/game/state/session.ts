import { createStore } from './store'

/**
 * Session-lifetime shell state — Application-Architecture §State ownership lists
 * these as owned by the shell and never persisted. Progress, score and answers
 * are a different data class entirely and belong to a `progress/` module backed
 * by IndexedDB (ADR-004); nothing here should grow into that.
 */
export interface SessionState {
  /** Key of the scene currently on screen. */
  currentScene: string
  /**
   * True once the browser has let audio through. Autoplay is blocked until a
   * user gesture (Feature-Audio-System §Engineering constraints), so music and
   * ambience start at the first click, never on load.
   */
  audioUnlocked: boolean
  /**
   * The viewport is taller than it is wide. The product is landscape-first
   * (ADR-009), so scenes gate their primary action on this rather than trying
   * to reflow a layout authored at 16:9.
   */
  portrait: boolean
  /** A modal/overlay is up; scenes should suspend their own input and timers. */
  paused: boolean
  /** Persistent "Langkah N dari M" indicator (REQ-F-018). Null outside the stages. */
  step: { current: number; total: number } | null
}

export const SESSION_CHANGED_EVENT = 'session-changed'

export const session = createStore<SessionState>(
  {
    currentScene: 'Boot',
    audioUnlocked: false,
    portrait: window.innerHeight > window.innerWidth,
    paused: false,
    step: null,
  },
  { event: SESSION_CHANGED_EVENT },
)
