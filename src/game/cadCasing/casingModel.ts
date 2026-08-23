/**
 * Pure calculation layer for the CAD Casing simulator (Langkah 2). No Phaser,
 * no display objects — mirrors `jalurPcb/traceModel.ts`'s shape, kept as its
 * own copy per journey rather than shared (see `simulasiStep.ts`'s note).
 *
 * The sizing rule is exactly what `materiStep.ts`'s FormulaBand teaches:
 *
 *   Dimensi X/Y Casing = Dimensi PCB + 2 × Celah Samping + 2 × Tebal Dinding
 *   Tinggi Z Casing    = Tinggi Pilar + Tebal PCB + Tinggi Komponen Tertinggi + Celah Bebas Atas
 */

export interface SliderRange {
  min: number
  max: number
  step: number
}

export function clampToRange(value: number, range: SliderRange) {
  const stepped = Math.round((value - range.min) / range.step) * range.step + range.min
  return Math.min(range.max, Math.max(range.min, roundToStep(stepped, range.step)))
}

/** Kills the float dust `min + n * step` accumulates, so 0.1-step sliders read "2.9" and not "2.9000000000000004". */
function roundToStep(value: number, step: number) {
  const decimals = decimalsFor(step)
  return Number(value.toFixed(decimals))
}

export function decimalsFor(step: number) {
  if (Number.isInteger(step)) return 0
  return String(step).split('.')[1]?.length ?? 0
}

export interface CasingInput {
  /** Panjang PCB (X), mm. */
  pcbLength: number
  /** Lebar PCB (Y), mm. */
  pcbWidth: number
  /** Tebal Papan PCB (Z), mm. */
  pcbThickness: number
  /** Celah Samping — clearance between the PCB edge and the inner wall, mm. */
  sideClearance: number
  /** Tebal Dinding — casing wall thickness, mm. */
  wallThickness: number
  /** Tinggi Komponen — tallest component above the PCB, mm. */
  componentHeight: number
  /** Tinggi Pilar — standoff height under the PCB, mm. */
  pillarHeight: number
  /** Celah Bebas Atas — clearance above the tallest component, mm. */
  topClearance: number
}

export const RANGES: Record<keyof CasingInput, SliderRange> = {
  pcbLength: { min: 50, max: 200, step: 1 },
  pcbWidth: { min: 30, max: 150, step: 1 },
  pcbThickness: { min: 0.8, max: 3.2, step: 0.1 },
  sideClearance: { min: 2, max: 30, step: 1 },
  wallThickness: { min: 1, max: 15, step: 1 },
  componentHeight: { min: 5, max: 60, step: 1 },
  pillarHeight: { min: 2, max: 30, step: 1 },
  topClearance: { min: 2, max: 25, step: 1 },
}

export const DEFAULT_INPUT: CasingInput = {
  pcbLength: 135,
  pcbWidth: 81,
  pcbThickness: 2.9,
  sideClearance: 15,
  wallThickness: 8,
  componentHeight: 40,
  pillarHeight: 15,
  topClearance: 10,
}

export interface CasingDimensions {
  x: number
  y: number
  z: number
}

export function computeCasing(input: CasingInput): CasingDimensions {
  return {
    x: input.pcbLength + 2 * input.sideClearance + 2 * input.wallThickness,
    y: input.pcbWidth + 2 * input.sideClearance + 2 * input.wallThickness,
    z: input.pillarHeight + input.pcbThickness + input.componentHeight + input.topClearance,
  }
}

/** An axis-aligned box in mm, `center` + full `size` (not half-extents). */
export interface Box3 {
  center: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
}

export interface CasingScene {
  casing: Box3
  void: Box3
  pcb: Box3
  component: Box3
  pillars: Box3[]
}

/**
 * Every box in one shared, centered mm space: z=0 is the casing's floor
 * (outer wall's bottom), the PCB sits on top of the pillars, and the
 * component sits centered on the PCB. Casing is centered on X/Y at 0.
 */
export function buildScene(input: CasingInput): CasingScene {
  const dims = computeCasing(input)
  const floorZ = 0
  const pcbZ = floorZ + input.wallThickness + input.pillarHeight
  const componentZ = pcbZ + input.pcbThickness

  const casing: Box3 = {
    center: { x: 0, y: 0, z: floorZ + dims.z / 2 },
    size: { x: dims.x, y: dims.y, z: dims.z },
  }

  const voidSize = {
    x: Math.max(dims.x - 2 * input.wallThickness, 1),
    y: Math.max(dims.y - 2 * input.wallThickness, 1),
    z: Math.max(dims.z - input.wallThickness, 1),
  }
  const voidBox: Box3 = {
    center: { x: 0, y: 0, z: floorZ + input.wallThickness + voidSize.z / 2 },
    size: voidSize,
  }

  const pillarFootprint = Math.min(input.wallThickness * 1.4, input.pcbLength * 0.08, input.pcbWidth * 0.08, 6)
  const pillarInsetX = input.pcbLength / 2 - pillarFootprint
  const pillarInsetY = input.pcbWidth / 2 - pillarFootprint
  const pillars: Box3[] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].map(([sx, sy]) => ({
    center: { x: sx * pillarInsetX, y: sy * pillarInsetY, z: floorZ + input.wallThickness + input.pillarHeight / 2 },
    size: { x: pillarFootprint, y: pillarFootprint, z: input.pillarHeight },
  }))

  const pcb: Box3 = {
    center: { x: 0, y: 0, z: pcbZ + input.pcbThickness / 2 },
    size: { x: input.pcbLength, y: input.pcbWidth, z: input.pcbThickness },
  }

  const componentFootprintX = Math.max(input.pcbLength * 0.3, 10)
  const componentFootprintY = Math.max(input.pcbWidth * 0.3, 10)
  const component: Box3 = {
    center: { x: 0, y: 0, z: componentZ + input.componentHeight / 2 },
    size: { x: componentFootprintX, y: componentFootprintY, z: input.componentHeight },
  }

  return { casing, void: voidBox, pcb, component, pillars }
}
