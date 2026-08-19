import Phaser from 'phaser'

/**
 * Design frame and stage geometry.
 *
 * Deliberately its own module rather than part of `main`: `main` imports every
 * scene to build the scene list, so anything a scene imports back from `main`
 * closes a cycle. Scene modules evaluate first, and a top-level constant
 * derived from `main`'s exports then reads them inside the temporal dead zone
 * ("Cannot access 'DESIGN_WIDTH' before initialization"). Nothing here imports
 * a scene, so the cycle cannot form.
 */

/** Design-space resolution every scene's coordinates are authored in. */
export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1080

/**
 * Phaser 4's ScaleManager has no `resolution`/DPI option — the canvas backing
 * store is always exactly `width`x`height`, then CSS-stretched to fill the
 * viewport (via ENVELOP), which upscales and blurs on HiDPI screens. We
 * supersample instead: render to a canvas `DPR` times bigger than the design
 * resolution, and every scene compensates with `cameras.main.setZoom(DPR)` so
 * game-object coordinates stay in the 1920x1080 design space.
 */
export const DPR = Math.min(window.devicePixelRatio || 1, 2)

/**
 * The stage is the design-space area actually covered by the canvas. FIT alone
 * would letterbox any viewport that isn't 16:9, leaving bars the artwork can
 * never reach — so the canvas is built at the *viewport's* aspect ratio instead,
 * and FIT then fills it edge to edge with no bars at all.
 *
 * It only ever grows past 1920x1080, never shrinks below it, so the design frame
 * stays a centered safe area: layout keeps using design coordinates and nothing
 * is ever cropped.
 */
export const stage = { width: DESIGN_WIDTH, height: DESIGN_HEIGHT }

/** Emitted with the new `stage` whenever the viewport aspect ratio changes. */
export const STAGE_RESIZE_EVENT = 'stage-resize'

export function measureStage() {
  const viewportWidth = window.innerWidth || DESIGN_WIDTH
  const viewportHeight = window.innerHeight || DESIGN_HEIGHT
  const aspect = viewportWidth / viewportHeight

  return {
    width: Math.max(DESIGN_WIDTH, Math.round(DESIGN_HEIGHT * aspect)),
    height: Math.max(DESIGN_HEIGHT, Math.round(DESIGN_WIDTH / aspect)),
  }
}

/** Centres the 1920x1080 design frame in the (possibly larger) stage. */
export function applyStageCamera(scene: Phaser.Scene) {
  scene.cameras.main.setZoom(DPR).centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2)
}

/** The stage's edges in design-space coordinates. Equals the design frame at exactly 16:9. */
export function stageBounds() {
  return {
    left: DESIGN_WIDTH / 2 - stage.width / 2,
    right: DESIGN_WIDTH / 2 + stage.width / 2,
    top: DESIGN_HEIGHT / 2 - stage.height / 2,
    bottom: DESIGN_HEIGHT / 2 + stage.height / 2,
  }
}

/**
 * How much larger the stage is than the design frame — which is exactly how
 * much a cover-fitted background grows by.
 *
 * Foreground elements must scale and anchor by this too. Leaving them pinned to
 * the design frame while the artwork stretches to the stage is what made the
 * UI look shrunken and centre-floating on a 2.2:1 phone: the background had
 * grown a quarter larger around it, and the HUD had stopped short of the corner.
 */
export function stageOverscan() {
  return Math.max(stage.width / DESIGN_WIDTH, stage.height / DESIGN_HEIGHT)
}
