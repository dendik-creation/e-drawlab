/**
 * Pure calculation layer for the Jalur PCB simulator (Langkah 2). No Phaser,
 * no display objects — the panel in `simulasiStep.ts` renders whatever this
 * returns, so the teaching formula can be checked (and changed) on its own.
 *
 * The rule set is the simplified one the learning material teaches, not a
 * real IPC-2221 trace-width calculation:
 *
 *   I (A)          = P (W) / V
 *   Base width (mm) = I × CURRENT_MULTIPLIER
 *   Recommended     = max(Base width × copper factor, MIN_RECOMMENDED_WIDTH)
 */

export type PowerUnit = 'mW' | 'W'
export type CopperThickness = '0.5' | '1' | '2'
export type TraceStatus = 'ok' | 'warning' | 'danger'

/** Faktor pengali from Langkah 1's "Lebar Jalur (mm) = Arus (A) × Faktor Pengali". */
export const CURRENT_MULTIPLIER = 2

/** Manufacturability floor: a recommendation never drops below 1 mm, however small the current. */
export const MIN_RECOMMENDED_WIDTH = 1

export const COPPER_FACTOR: Record<CopperThickness, number> = {
  '0.5': 1.5,
  '1': 1,
  '2': 0.75,
}

export const COPPER_LABEL: Record<CopperThickness, string> = {
  '0.5': '0.5 oz (Tipis)',
  '1': '1 oz (Standar)',
  '2': '2 oz (Tebal)',
}

/** Copper band height in the cross-section preview, in px — 2/4/7 straight from the Figma segmented control. */
export const COPPER_BAND_HEIGHT: Record<CopperThickness, number> = {
  '0.5': 2,
  '1': 4,
  '2': 7,
}

export interface SliderRange {
  min: number
  max: number
  step: number
}

/**
 * The power slider swaps range with the unit toggle. Both ranges cover the
 * same physical span (0.1 W = 100 mW, 100 W = 100000 mW), so toggling never
 * clamps a value that was legal a moment ago.
 */
export const POWER_RANGE: Record<PowerUnit, SliderRange> = {
  mW: { min: 100, max: 100000, step: 100 },
  W: { min: 0.1, max: 100, step: 0.1 },
}

export const VOLTAGE_RANGE: SliderRange = { min: 1, max: 48, step: 1 }
export const WIDTH_RANGE: SliderRange = { min: 0.1, max: 10, step: 0.05 }

export interface SimulatorInput {
  power: number
  unit: PowerUnit
  voltage: number
  copper: CopperThickness
  actualWidth: number
}

export interface SimulatorResult {
  /** Power normalised to watts, whichever unit the slider is showing. */
  watts: number
  current: number
  /** I × CURRENT_MULTIPLIER, before the copper correction. */
  baseWidth: number
  /** Base × copper factor, before the 1 mm floor — what `clamped` is decided from. */
  rawRecommended: number
  recommendedWidth: number
  /** True when the floor actually lifted the recommendation (drives the "batas minimum" badge). */
  clamped: boolean
  ratio: number
  status: TraceStatus
}

export function toWatts(power: number, unit: PowerUnit) {
  return unit === 'mW' ? power / 1000 : power
}

/** Converts a slider reading between units, preserving the real power it represents. */
export function convertPower(power: number, from: PowerUnit, to: PowerUnit) {
  if (from === to) return power
  const watts = toWatts(power, from)
  const converted = to === 'mW' ? watts * 1000 : watts
  return clampToRange(converted, POWER_RANGE[to])
}

export function clampToRange(value: number, range: SliderRange) {
  const stepped = Math.round((value - range.min) / range.step) * range.step + range.min
  return Math.min(range.max, Math.max(range.min, roundToStep(stepped, range.step)))
}

/** Kills the float dust `min + n * step` accumulates, so 0.1-step sliders read "5.35" and not "5.3500000000000005". */
function roundToStep(value: number, step: number) {
  const decimals = decimalsFor(step)
  return Number(value.toFixed(decimals))
}

export function decimalsFor(step: number) {
  if (Number.isInteger(step)) return 0
  return String(step).split('.')[1]?.length ?? 0
}

export function evaluate(input: SimulatorInput): SimulatorResult {
  const watts = toWatts(input.power, input.unit)
  const current = watts / input.voltage
  const baseWidth = current * CURRENT_MULTIPLIER
  const rawRecommended = baseWidth * COPPER_FACTOR[input.copper]
  const recommendedWidth = Math.max(rawRecommended, MIN_RECOMMENDED_WIDTH)
  const ratio = input.actualWidth / recommendedWidth

  return {
    watts,
    current,
    baseWidth,
    rawRecommended,
    recommendedWidth,
    clamped: rawRecommended < MIN_RECOMMENDED_WIDTH,
    ratio,
    status: statusFor(ratio),
  }
}

export function statusFor(ratio: number): TraceStatus {
  if (ratio >= 1) return 'ok'
  if (ratio >= 0.8) return 'warning'
  return 'danger'
}

// ---------------------------------------------------------------------
// Display formatting — every number the panel prints goes through here so
// the cards, the formula subtexts and the trace label never disagree.
// ---------------------------------------------------------------------

/** Trailing-zero-free factor, matching Figma's "Faktor koreksi: ×0.75" / "×1.5". */
export function formatFactor(factor: number) {
  return String(Number(factor.toFixed(2)))
}

export function formatPower(power: number, unit: PowerUnit) {
  return unit === 'mW' ? String(Math.round(power)) : String(Number(power.toFixed(1)))
}

/** `I = ...` line under "Arus Terhitung". Shows the /1000 normalisation step only in mW mode. */
export function currentFormula(input: SimulatorInput) {
  const power = formatPower(input.power, input.unit)
  return input.unit === 'mW'
    ? `I = (P / 1000) / V = ${power}mW / 1000 / ${input.voltage}V`
    : `I = P / V = ${power}W / ${input.voltage}V`
}

/** `Lebar = ...` line under the recommended width. */
export function widthFormula(input: SimulatorInput, result: SimulatorResult) {
  const factor = formatFactor(COPPER_FACTOR[input.copper])
  return `Lebar = I × ${CURRENT_MULTIPLIER} × ${factor} = ${result.baseWidth.toFixed(3)}mm × ${factor}`
}
