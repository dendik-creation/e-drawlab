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
 * Ceiling applied on top of whatever the GPU reports, so a desktop or
 * high-end GPU that advertises 8192/16384 doesn't get asked to fill an
 * enormous backing store for zero visible benefit — no display shows more
 * detail than a ~4x supersample of the design resolution.
 */
const MAX_TEXTURE_SIZE_CEILING = 8192

/**
 * Conservative floor used when the probe itself is unavailable (no WebGL at
 * all). 4096 is the de facto minimum every WebGL-capable device — including
 * the low-end/older Android hardware this app targets — has supported for
 * years, well above the WebGL spec's own minimum of 1024.
 */
const MAX_TEXTURE_SIZE_FALLBACK = 4096

/**
 * Exceeding the GPU's real MAX_TEXTURE_SIZE doesn't throw or resize
 * gracefully — Chromium/ANGLE silently clamps the canvas's actual drawing
 * buffer to the limit while Phaser keeps rendering and hit-testing against
 * the *requested* (larger) size. The result: content is drawn into a
 * narrower buffer than the camera projects for, then CSS-stretched back out
 * to full width — a squashed, off-centre picture — and every pointer event
 * is still tested against the untouched, too-large logical coordinates, so
 * taps land on the wrong thing or nothing at all. This is exactly what made
 * the app unusable on low-end/older Android GPUs, which commonly cap out at
 * 2048–4096: a probe context here is what lets `DPR` stay a true supersample
 * factor instead of silently exceeding what the hardware can actually back.
 */
function detectMaxTextureSize(): number {
  try {
    const probe = document.createElement('canvas')
    const gl = (probe.getContext('webgl2') ||
      probe.getContext('webgl') ||
      probe.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return MAX_TEXTURE_SIZE_FALLBACK

    const size = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    gl.getExtension('WEBGL_lose_context')?.loseContext()

    return size > 0 ? Math.min(size, MAX_TEXTURE_SIZE_CEILING) : MAX_TEXTURE_SIZE_FALLBACK
  } catch {
    return MAX_TEXTURE_SIZE_FALLBACK
  }
}

const MAX_TEXTURE_SIZE = detectMaxTextureSize()

/**
 * Phaser 4's ScaleManager has no `resolution`/DPI option — the canvas backing
 * store is always exactly `width`x`height`, then CSS-stretched to fill the
 * viewport (via ENVELOP), which upscales and blurs on HiDPI screens. We
 * supersample instead: render to a canvas `DPR` times bigger than the design
 * resolution, and every scene compensates with `cameras.main.setZoom(DPR)` so
 * game-object coordinates stay in the 1920x1080 design space.
 *
 * A `let`, not a `const`: the safe factor depends on the *stage*, which
 * grows with the viewport's aspect ratio (see `measureStage` below) and can
 * change after a rotation. `updateDPR` recomputes it against the current
 * stage; every importer sees the update immediately since ES module
 * bindings are live references, not snapshots taken at import time.
 */
export let DPR = Math.min(window.devicePixelRatio || 1, 2)

/**
 * Recomputes `DPR` so `stageWidth * DPR` / `stageHeight * DPR` never exceeds
 * the GPU's real texture ceiling — shrinking the supersample factor first
 * (never below 1x) rather than leaving the canvas to be silently clamped.
 * Call after every `stage` change, before that stage size is used to build
 * or resize the canvas.
 */
export function updateDPR(stageWidth: number, stageHeight: number) {
  const uncapped = Math.min(window.devicePixelRatio || 1, 2)
  const maxDim = Math.max(stageWidth, stageHeight)
  DPR = Math.min(uncapped, Math.max(1, MAX_TEXTURE_SIZE / maxDim))
}

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
