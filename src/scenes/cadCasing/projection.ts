import type { Box3 } from '../../domain/cadCasing/casingModel'

/**
 * Orbit-camera projection for the CAD Casing preview.
 *
 * Pure geometry, no renderer: this is `domain/cadCasing/box3d.ts`'s maths with
 * the Phaser drawing calls lifted out, so the same projection now feeds SVG
 * polygons instead of a Graphics object rebuilt on every repaint.
 *
 * World space: X = length (right), Y = width/depth (into the screen at the
 * Depan pose), Z = height (up) — matching the mm axes `casingModel.ts` builds
 * its boxes in. Rotation is yaw around world Z, then pitch around the
 * yaw-rotated X axis, then an orthographic drop of the depth axis. No real
 * lighting model — faces get a fixed per-direction shade lookup.
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Camera {
  /** Degrees, tilt around the yaw-rotated X axis. Clamped to ±85° while dragging. */
  pitch: number
  /** Degrees, rotation around world Z. */
  yaw: number
}

export type CameraKey = 'atas' | 'samping' | 'depan' | 'isometrik'

export const CAMERA_PRESETS: Record<CameraKey, Camera> = {
  depan: { pitch: 0, yaw: 0 },
  samping: { pitch: 0, yaw: 90 },
  atas: { pitch: 90, yaw: 0 },
  isometrik: { pitch: 35.264, yaw: 45 },
}

export interface ScreenPoint {
  x: number
  y: number
}

const DEG = Math.PI / 180

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

interface Rotated {
  x2: number
  /** Depth into the screen — larger is farther from the camera. */
  y2: number
  z2: number
}

function rotate(v: Vec3, camera: Camera): Rotated {
  const yaw = camera.yaw * DEG
  const pitch = camera.pitch * DEG
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const x1 = v.x * cosY - v.y * sinY
  const y1 = v.x * sinY + v.y * cosY
  const z1 = v.z

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)

  return { x2: x1, y2: y1 * cosP - z1 * sinP, z2: y1 * sinP + z1 * cosP }
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

/** Face as indices into the 8-corner array plus its outward normal, world-space. */
const FACES: { indices: [number, number, number, number]; normal: Vec3 }[] = [
  { indices: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 } },
  { indices: [3, 0, 4, 7], normal: { x: -1, y: 0, z: 0 } },
  { indices: [2, 3, 7, 6], normal: { x: 0, y: 1, z: 0 } },
  { indices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 } },
  { indices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 } },
  { indices: [3, 2, 1, 0], normal: { x: 0, y: 0, z: -1 } },
]

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

/** Fixed world-space "sun", so a face's shade stays put as the camera orbits around it. */
const LIGHT = normalize({ x: -0.35, y: -0.45, z: 0.82 })
const FACE_SHADE = FACES.map((face) => clamp(dot(face.normal, LIGHT), 0.35, 1))

/** Scales a `#rrggbb` colour by a brightness factor. */
export function shadeColor(hex: string, brightness: number) {
  const value = parseInt(hex.slice(1), 16)
  const channel = (shift: number) => clamp(Math.round(((value >> shift) & 0xff) * brightness), 0, 255)
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}

export interface ProjectedFace {
  /** SVG `points` attribute for the quad. */
  points: string
  /** Average depth, for back-to-front sorting. */
  depth: number
  shade: number
}

/**
 * One box as its visible faces, back-face-culled and depth-sorted.
 *
 * Callers still order whole boxes back-to-front themselves — this only sorts
 * the faces of a single box, exactly as the canvas version did.
 */
export function solidBoxFaces(box: Box3, camera: Camera, scale: number, origin: ScreenPoint): ProjectedFace[] {
  const pts = corners(box)
  const rotated = pts.map((p) => rotate(p, camera))
  const projected = pts.map((p) => project(p, camera, scale, origin))

  return FACES.map((face, faceIndex) => {
    const normalDepth = rotate(face.normal, camera).y2
    const depth = face.indices.reduce((sum, i) => sum + rotated[i].y2, 0) / 4
    return {
      points: face.indices.map((i) => `${projected[i].x.toFixed(2)},${projected[i].y.toFixed(2)}`).join(' '),
      depth,
      shade: FACE_SHADE[faceIndex],
      frontFacing: normalDepth < -1e-6,
    }
  })
    .filter((entry) => entry.frontFacing)
    .sort((a, b) => b.depth - a.depth)
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

export interface ProjectedEdge {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Edges-only box — the casing shell and the inner void stay unfilled so the solids inside read through them. */
export function wireBoxEdges(box: Box3, camera: Camera, scale: number, origin: ScreenPoint): ProjectedEdge[] {
  const projected = corners(box).map((p) => project(p, camera, scale, origin))
  return EDGES.map(([a, b]) => ({ x1: projected[a].x, y1: projected[a].y, x2: projected[b].x, y2: projected[b].y }))
}

/** Bounding extents (at scale=1, before `origin`) of a box's projected corners — feeds the viewport's auto-fit scale. */
export function projectedExtent(box: Box3, camera: Camera) {
  const projected = corners(box).map((p) => project(p, camera, 1, { x: 0, y: 0 }))
  const xs = projected.map((p) => p.x)
  const ys = projected.map((p) => p.y)
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
}

/** Projected centre of a box, so the viewport can re-anchor the model rather than the world origin. */
export function projectedCenter(box: Box3, camera: Camera, scale: number, origin: ScreenPoint) {
  return project(box.center, camera, scale, origin)
}

export const AXIS_TIPS: { key: 'x' | 'y' | 'z'; vec: Vec3; color: string }[] = [
  { key: 'x', vec: { x: 1, y: 0, z: 0 }, color: '#dc2626' },
  { key: 'y', vec: { x: 0, y: 1, z: 0 }, color: '#15803d' },
  { key: 'z', vec: { x: 0, y: 0, z: 1 }, color: '#1d4ed8' },
]

/**
 * Shortest signed angle from `current` to `target`, so a camera-preset tween
 * takes the near way round instead of unwinding several turns.
 */
export function shortestEquivalentAngle(current: number, target: number) {
  let delta = (target - current) % 360
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return current + delta
}

export const PITCH_LIMIT = 85

export function clampPitch(pitch: number) {
  return clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT)
}
