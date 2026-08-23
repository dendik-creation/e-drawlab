import Phaser from 'phaser'
import type { UiContext } from '../desainSkema/uiKit'
import type { Box3 } from './casingModel'

/**
 * Small orbit-camera renderer for the CAD Casing 3D preview. The Figma frame
 * only exports one static flat "Depan" pose (plain 2D vector paths), but the
 * feature asks for a real interactive model — drag to orbit, snap to a
 * camera preset, reshape live from the sliders — so this reprojects the
 * casing's boxes every repaint instead of drawing exported art.
 *
 * World space: X = length (right), Y = width/depth (into the screen at the
 * Depan pose), Z = height (up) — matching the mm axes `casingModel.ts`
 * builds its boxes in. Rotation is yaw around world Z, then pitch around the
 * yaw-rotated X axis (a standard orbit camera), then an orthographic drop of
 * the depth axis. No real lighting/shadow model — like `jalurPcb/simulasiStep.ts`'s
 * blur and inset-shadow stand-ins, faces get a fixed per-direction shade
 * lookup instead of a lit renderer.
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Camera {
  /** Degrees, tilt around the yaw-rotated X axis. Clamped to ±85° by `attachOrbitDrag`. */
  pitch: number
  /** Degrees, rotation around world Z. */
  yaw: number
}

export const CAMERA_PRESETS: Record<'depan' | 'atas' | 'samping' | 'isometrik', Camera> = {
  depan: { pitch: 0, yaw: 0 },
  samping: { pitch: 0, yaw: 90 },
  atas: { pitch: 90, yaw: 0 },
  isometrik: { pitch: 35.264, yaw: 45 },
}

interface Rotated {
  x2: number
  /** Depth into the screen — larger is farther from the camera. */
  y2: number
  z2: number
}

function rotate(v: Vec3, camera: Camera): Rotated {
  const yaw = Phaser.Math.DegToRad(camera.yaw)
  const pitch = Phaser.Math.DegToRad(camera.pitch)
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const x1 = v.x * cosY - v.y * sinY
  const y1 = v.x * sinY + v.y * cosY
  const z1 = v.z

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const y2 = y1 * cosP - z1 * sinP
  const z2 = y1 * sinP + z1 * cosP

  return { x2: x1, y2, z2 }
}

export interface ScreenPoint {
  x: number
  y: number
}

export function project(v: Vec3, camera: Camera, scale: number, origin: ScreenPoint): ScreenPoint & { depth: number } {
  const r = rotate(v, camera)
  return { x: origin.x + r.x2 * scale, y: origin.y - r.z2 * scale, depth: r.y2 }
}

/** Half-extent corner offsets, one per axis sign combination. */
const CORNER_SIGNS: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
]

function corners(box: Box3): Vec3[] {
  const hx = box.size.x / 2
  const hy = box.size.y / 2
  const hz = box.size.z / 2
  return CORNER_SIGNS.map(([sx, sy, sz]) => ({
    x: box.center.x + sx * hx,
    y: box.center.y + sy * hy,
    z: box.center.z + sz * hz,
  }))
}

/** Face as indices into the 8-corner array (see `CORNER_SIGNS`) plus its outward normal, world-space. */
const FACES: { indices: [number, number, number, number]; normal: Vec3 }[] = [
  { indices: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 } }, // +X
  { indices: [3, 0, 4, 7], normal: { x: -1, y: 0, z: 0 } }, // -X
  { indices: [2, 3, 7, 6], normal: { x: 0, y: 1, z: 0 } }, // +Y
  { indices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 } }, // -Y
  { indices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 } }, // +Z
  { indices: [3, 2, 1, 0], normal: { x: 0, y: 0, z: -1 } }, // -Z
]

/** Fixed world-space "sun", so a face's shade stays put as the camera orbits around it. */
const LIGHT: Vec3 = normalize({ x: -0.35, y: -0.45, z: 0.82 })

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

const FACE_SHADE = new Map(FACES.map((face) => [face.normal, Phaser.Math.Clamp(dot(face.normal, LIGHT), 0.35, 1)]))

function shadeColor(base: number, brightness: number) {
  const r = (base >> 16) & 0xff
  const g = (base >> 8) & 0xff
  const b = base & 0xff
  return (Phaser.Math.Clamp(Math.round(r * brightness), 0, 255) << 16) | (Phaser.Math.Clamp(Math.round(g * brightness), 0, 255) << 8) | Phaser.Math.Clamp(Math.round(b * brightness), 0, 255)
}

export interface SolidBoxStyle {
  fill: number
  fillAlpha?: number
  stroke?: number
  strokeAlpha?: number
}

/**
 * Draws one axis-aligned box as 6 shaded, back-face-culled, depth-sorted
 * quads. Callers draw boxes back-to-front themselves (see `simulasiStep.ts`)
 * — this only sorts the *faces* of a single box, not across boxes.
 */
export function drawSolidBox(gfx: Phaser.GameObjects.Graphics, box: Box3, camera: Camera, scale: number, origin: ScreenPoint, style: SolidBoxStyle) {
  const pts = corners(box)
  const rotated = pts.map((p) => rotate(p, camera))
  const projected = pts.map((p) => project(p, camera, scale, origin))

  const visible = FACES.map((face) => {
    const normalDepth = rotate(face.normal, camera).y2
    const avgDepth = face.indices.reduce((sum, i) => sum + rotated[i].y2, 0) / 4
    return { face, avgDepth, frontFacing: normalDepth < -1e-6 }
  }).filter((entry) => entry.frontFacing)

  visible.sort((a, b) => b.avgDepth - a.avgDepth)

  const fillAlpha = style.fillAlpha ?? 1
  const strokeAlpha = style.strokeAlpha ?? 1
  const stroke = style.stroke ?? style.fill

  visible.forEach(({ face }) => {
    const shade = FACE_SHADE.get(face.normal) ?? 1
    // fillPoints/strokePoints require actual Vector2 instances, not just {x,y}-shaped objects.
    const points = face.indices.map((i) => new Phaser.Math.Vector2(projected[i].x, projected[i].y))
    gfx
      .fillStyle(shadeColor(style.fill, shade), fillAlpha)
      .fillPoints(points, true)
      .lineStyle(1, stroke, strokeAlpha)
      .strokePoints(points, true)
  })
}

/** 12 edges, one per pair of corners differing on exactly one axis. */
const EDGES: [number, number][] = (() => {
  const list: [number, number][] = []
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const diff = CORNER_SIGNS[i].reduce((count, v, axis) => count + (v === CORNER_SIGNS[j][axis] ? 0 : 1), 0)
      if (diff === 1) list.push([i, j])
    }
  }
  return list
})()

export interface WireBoxStyle {
  color: number
  alpha?: number
  lineWidth?: number
  dashed?: boolean
}

/** Edges-only box — used for the casing shell and the inner void, both of which stay unfilled so the solids inside read through them. */
export function drawWireBox(gfx: Phaser.GameObjects.Graphics, box: Box3, camera: Camera, scale: number, origin: ScreenPoint, style: WireBoxStyle) {
  const projected = corners(box).map((p) => project(p, camera, scale, origin))
  const alpha = style.alpha ?? 1
  const lineWidth = style.lineWidth ?? 1.5

  gfx.lineStyle(lineWidth, style.color, alpha)
  EDGES.forEach(([a, b]) => {
    if (style.dashed) dashedLine(gfx, projected[a], projected[b])
    else gfx.lineBetween(projected[a].x, projected[a].y, projected[b].x, projected[b].y)
  })
}

/** Phaser Graphics has no native dashed stroke — steps along the segment drawing short on/off runs. Exported for the legend's dashed swatch. */
export function dashedLine(gfx: Phaser.GameObjects.Graphics, from: ScreenPoint, to: ScreenPoint, dashLen = 5, gapLen = 4) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length < 0.001) return
  const stepLen = dashLen + gapLen
  const steps = Math.ceil(length / stepLen)
  const ux = dx / length
  const uy = dy / length

  for (let i = 0; i < steps; i++) {
    const start = i * stepLen
    const end = Math.min(start + dashLen, length)
    gfx.lineBetween(from.x + ux * start, from.y + uy * start, from.x + ux * end, from.y + uy * end)
  }
}

/** Bounding extents (at scale=1, before `origin`) of a box's projected corners — feeds the viewport's auto-fit scale. */
export function projectedExtent(box: Box3, camera: Camera) {
  const projected = corners(box).map((p) => project(p, camera, 1, { x: 0, y: 0 }))
  const xs = projected.map((p) => p.x)
  const ys = projected.map((p) => p.y)
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
}

const AXIS_TIPS: { key: 'x' | 'y' | 'z'; vec: Vec3; color: number }[] = [
  { key: 'x', vec: { x: 1, y: 0, z: 0 }, color: 0xdc2626 },
  { key: 'y', vec: { x: 0, y: 1, z: 0 }, color: 0x15803d },
  { key: 'z', vec: { x: 0, y: 0, z: 1 }, color: 0x1d4ed8 },
]

/**
 * Small X/Y/Z gizmo (Figma's bottom-left orientation marker). Returns each
 * tip's screen position so the caller can park a label there.
 *
 * Sits on the viewport's own cream backdrop, where thin colored lines alone
 * washed out — so this draws a soft backing plate first, and outlines each
 * arrow in a white halo before the color, the same contrast trick print
 * cartography uses for a compass rose over a busy map.
 */
export function drawAxisGizmo(gfx: Phaser.GameObjects.Graphics, camera: Camera, origin: ScreenPoint, armLength: number) {
  const originPt = project({ x: 0, y: 0, z: 0 }, camera, armLength, origin)
  const tips: Record<'x' | 'y' | 'z', ScreenPoint> = { x: originPt, y: originPt, z: originPt }

  gfx
    .fillStyle(0xffffff, 0.88)
    .fillCircle(originPt.x, originPt.y, armLength * 0.92)
    .lineStyle(1, 0x0c6179, 0.18)
    .strokeCircle(originPt.x, originPt.y, armLength * 0.92)

  AXIS_TIPS.forEach(({ key, vec, color }) => {
    const tip = project(vec, camera, armLength, origin)
    tips[key] = tip
    gfx
      .lineStyle(4, 0xffffff, 0.95)
      .lineBetween(originPt.x, originPt.y, tip.x, tip.y)
      .lineStyle(2.2, color, 1)
      .lineBetween(originPt.x, originPt.y, tip.x, tip.y)
      .fillStyle(color, 1)
      .fillCircle(tip.x, tip.y, 2.6)
  })

  gfx.fillStyle(0x0c6179, 1).fillCircle(originPt.x, originPt.y, 2.6)

  return { origin: originPt, tips }
}

/** Adjusts `target` by ±360° so it lands on the shortest arc from `current` — keeps a preset snap from spinning the long way round. */
export function shortestEquivalentAngle(current: number, target: number) {
  const delta = ((((target - current) % 360) + 540) % 360) - 180
  return current + delta
}

const DRAG_SENSITIVITY = 0.35
const PITCH_LIMIT = 85

/**
 * Pointerdown-drag-to-orbit on a Zone, following `SimSlider`'s own input
 * shape: scene-level pointermove/pointerup (so the drag survives leaving the
 * zone), `worldX/worldY` (the stage is DPR-zoomed, so only world coordinates
 * are unscaled), and an `ctx.isLocked()` guard. `onDragStart` fires once per
 * drag, before the first `onChange` — the caller uses it to clear whichever
 * camera-preset pill is highlighted.
 */
export function attachOrbitDrag(
  ctx: UiContext,
  zone: Phaser.GameObjects.Zone,
  camera: Camera,
  onChange: () => void,
  onDragStart: () => void,
) {
  const scene = ctx.scene
  let dragging = false
  let lastX = 0
  let lastY = 0
  // `onChange` repaints the whole 3D box scene (six shaded faces, two dashed
  // wire boxes, the gizmo) — real work, not a couple of Graphics fills. A raw
  // touchmove stream fires far faster than the display can show it, so
  // calling this on every event ran that repaint several times more often
  // than any frame could render, which is what read as stutter while
  // orbiting. `camera.yaw`/`pitch` still update immediately on every move —
  // only the (expensive) repaint is collapsed to once per rendered frame.
  let repaintRafId = 0

  const scheduleRepaint = () => {
    if (repaintRafId) return
    repaintRafId = requestAnimationFrame(() => {
      repaintRafId = 0
      onChange()
    })
  }

  zone.setInteractive({ useHandCursor: true })
  zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (ctx.isLocked()) return
    dragging = true
    lastX = pointer.worldX
    lastY = pointer.worldY
    onDragStart()
  })

  const onPointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!dragging || !pointer.isDown) return
    const dx = pointer.worldX - lastX
    const dy = pointer.worldY - lastY
    lastX = pointer.worldX
    lastY = pointer.worldY

    camera.yaw += dx * DRAG_SENSITIVITY
    camera.pitch = Phaser.Math.Clamp(camera.pitch - dy * DRAG_SENSITIVITY, -PITCH_LIMIT, PITCH_LIMIT)
    scheduleRepaint()
  }
  scene.input.on('pointermove', onPointerMove)

  const onPointerUp = () => {
    dragging = false
  }
  scene.input.on('pointerup', onPointerUp)
  scene.input.on('pointerupoutside', onPointerUp)

  return {
    destroy() {
      scene.input.off('pointermove', onPointerMove)
      scene.input.off('pointerup', onPointerUp)
      scene.input.off('pointerupoutside', onPointerUp)
      dragging = false
      if (repaintRafId) {
        cancelAnimationFrame(repaintRafId)
        repaintRafId = 0
      }
    },
  }
}
