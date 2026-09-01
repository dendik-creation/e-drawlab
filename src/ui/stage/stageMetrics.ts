import { createStore } from '../../game/state/store'
import { LANDSCAPE_ONLY_EXEMPT_SCENES, session } from '../../game/state/session'

/**
 * Geometry for the DOM stage — the replacement for the Phaser ScaleManager +
 * supersampled camera in `game/stage.ts`.
 *
 * That whole arrangement (canvas built at `stage.width * DPR`, FIT-scaled to
 * the viewport, camera zoomed back by DPR) reduces to a single number:
 *
 *   scale = min(viewportWidth / 1920, viewportHeight / 1080)
 *
 * so every Figma-authored coordinate keeps its meaning under a plain CSS
 * `transform: scale(...)`, with no supersampling to pay for. Text stays sharp
 * because the browser rasterises glyphs at the composited scale, which is the
 * one thing a canvas renderer cannot do.
 */

/** Design-space resolution every scene's coordinates are authored in. */
export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1080

export interface StageMetrics {
  /** Design-space area actually covered by the viewport. Never smaller than the design frame. */
  width: number
  height: number
  /** Design px -> CSS px. */
  scale: number
}

export const STAGE_METRICS_CHANGED_EVENT = 'stage-metrics-changed'

/**
 * The stage only ever grows past 1920x1080, never shrinks below it, so the
 * design frame stays a centred safe area: layout keeps using design
 * coordinates and nothing is ever cropped. Backgrounds bleed into the extra
 * width/height; corner-anchored chrome uses `stageBounds`.
 */
export function measureStage(viewportWidth: number, viewportHeight: number): StageMetrics {
  const width = viewportWidth || DESIGN_WIDTH
  const height = viewportHeight || DESIGN_HEIGHT
  const aspect = width / height

  return {
    width: Math.max(DESIGN_WIDTH, Math.round(DESIGN_HEIGHT * aspect)),
    height: Math.max(DESIGN_HEIGHT, Math.round(DESIGN_WIDTH / aspect)),
    scale: Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT),
  }
}

export const stageMetrics = createStore<StageMetrics>(
  measureStage(window.innerWidth, window.innerHeight),
  { event: STAGE_METRICS_CHANGED_EVENT },
)

/** The stage's edges in design-space coordinates. Equals the design frame at exactly 16:9. */
export function stageBounds(metrics: StageMetrics = stageMetrics.get()) {
  return {
    left: DESIGN_WIDTH / 2 - metrics.width / 2,
    right: DESIGN_WIDTH / 2 + metrics.width / 2,
    top: DESIGN_HEIGHT / 2 - metrics.height / 2,
    bottom: DESIGN_HEIGHT / 2 + metrics.height / 2,
  }
}

/**
 * How much larger the stage is than the design frame — exactly how much a
 * cover-fitted background grows by. Foreground art that must stay glued to
 * that background (Home's mascot on its workbench) scales by this too.
 */
export function stageOverscan(metrics: StageMetrics = stageMetrics.get()) {
  return Math.max(metrics.width / DESIGN_WIDTH, metrics.height / DESIGN_HEIGHT)
}

/**
 * A rotation is not one event: mobile browsers fire `orientationchange` and
 * `resize` while `innerWidth`/`innerHeight` still report the old box, and some
 * settle again once the browser chrome finishes animating. Measuring once, on
 * the event, locks in the wrong aspect ratio.
 */
const ORIENTATION_SETTLE_DELAY = 350

let frame = 0
let timer = 0

function syncStage() {
  const portrait = window.innerHeight > window.innerWidth
  session.set({ portrait })

  // Home and every scene after it are landscape-only (ADR-009): the stage
  // must never actually reshape to portrait, even while OrientationGuard's
  // overlay is covering it — a merely-hidden portrait stage would still be
  // portrait underneath. Freeze at the last landscape geometry instead.
  // Splash is the one scene reachable while portrait (it gates entry itself),
  // so there is always a landscape stage already in place to freeze.
  if (portrait && !LANDSCAPE_ONLY_EXEMPT_SCENES.has(session.get().currentScene)) return

  stageMetrics.set(measureStage(window.innerWidth, window.innerHeight))
}

function scheduleSync() {
  window.cancelAnimationFrame(frame)
  window.clearTimeout(timer)

  // Next frame catches the common case; the delayed pass catches viewports
  // that are still animating. `syncStage` is idempotent, so running twice is
  // free.
  frame = window.requestAnimationFrame(() => {
    syncStage()
    timer = window.setTimeout(syncStage, ORIENTATION_SETTLE_DELAY)
  })
}

/** Binds the viewport listeners. Returns the matching unbind. */
export function observeViewport() {
  syncStage()
  window.addEventListener('resize', scheduleSync)
  window.addEventListener('orientationchange', scheduleSync)
  window.visualViewport?.addEventListener('resize', scheduleSync)

  return () => {
    window.cancelAnimationFrame(frame)
    window.clearTimeout(timer)
    window.removeEventListener('resize', scheduleSync)
    window.removeEventListener('orientationchange', scheduleSync)
    window.visualViewport?.removeEventListener('resize', scheduleSync)
  }
}
