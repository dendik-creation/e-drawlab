/**
 * Content-as-data for Langkah 2's three "kertas kerja" simulations (ADR-003).
 * Values are the authoritative C1/C2/C3 circuits from
 * docs/02_Learning_Design/Learning-Modules/Stage-1-Schematic-Standards.md,
 * laid out to match the reference schematics in the E-DrawLab Figma file
 * (node 33:168, "Step 2.1 - Daftar Kertas Kerja").
 */

export type ComponentKind = 'battery' | 'resistor' | 'led'
export type Orientation = 'horizontal' | 'vertical'
export type Side = 'left' | 'right' | 'top' | 'bottom'

export interface Point {
  x: number
  y: number
}

/** A place on the sheet where exactly one component belongs. */
export interface CircuitSlot {
  id: string
  kind: ComponentKind
  x: number
  y: number
  orientation: Orientation
  /** Half the symbol's connection span — where wires attach on its left/right (or top/bottom when vertical). */
  extent: number
  /** Label drawn above the symbol, e.g. component name ("LED1") or battery's "BAT". */
  nameLabel?: string
  /** Label drawn below/beside the symbol, e.g. "220Ω" or "5V". */
  valueLabel?: string
}

/** A palette entry the learner can drag onto the sheet. Distractors never match a slot. */
export interface PaletteItem {
  id: string
  kind: ComponentKind | 'distractor'
  texture: string
  label: string
}

/** One straight wire segment. An end is either a fixed point or a side of a component slot. */
export interface WireEnd {
  slot?: string
  side?: Side
  point?: Point
}

export interface WireDef {
  id: string
  from: WireEnd
  to: WireEnd
}

export interface JunctionDot {
  x: number
  y: number
}

export interface CircuitLevel {
  id: 'level-1' | 'level-2' | 'level-3'
  levelNumber: 1 | 2 | 3
  /** Short heading shown above the work sheet, e.g. "Rangkaian Dasar LED". */
  title: string
  /** Etiket drawing title, e.g. "RANGKAIAN DASAR LED" (etiket shows "{levelNumber}: {etiketName}"). */
  etiketName: string
  palette: PaletteItem[]
  slots: CircuitSlot[]
  wires: WireDef[]
  junctions: JunctionDot[]
}

// Shared sheet geometry. Absolute design-space coordinates (the work sheet's
// grid box), so slot/wire coordinates below are plain design-space numbers.
export const SHEET_X = 496
// Bottom edge stays put (276 + 584 === the old 250 + 610); the extra 26px
// just opens up breathing room between the panel's title and the sheet.
export const SHEET_Y = 276
export const SHEET_WIDTH = 1307
export const SHEET_HEIGHT = 584

const LEFT_X = SHEET_X + 110
const RIGHT_X = SHEET_X + SHEET_WIDTH - 110
const TOP_RAIL_Y = SHEET_Y + 90
const BOTTOM_RAIL_Y = SHEET_Y + SHEET_HEIGHT - 90
const BATTERY_Y = (TOP_RAIL_Y + BOTTOM_RAIL_Y) / 2
const BATTERY_HALF_HEIGHT = 45

function seriesLevel(
  id: CircuitLevel['id'],
  levelNumber: 1 | 2 | 3,
  title: string,
  etiketName: string,
  resistorValue: string,
  ledSlots: { id: string; nameLabel: string }[],
  distractor: PaletteItem,
): CircuitLevel {
  const columns = 1 + ledSlots.length // resistor + N leds, spread across the top rail
  const span = RIGHT_X - LEFT_X
  const colX = (index: number) => LEFT_X + (span * (index + 1)) / (columns + 1)

  const battery: CircuitSlot = {
    id: 'battery',
    kind: 'battery',
    x: LEFT_X,
    y: BATTERY_Y,
    orientation: 'vertical',
    extent: BATTERY_HALF_HEIGHT,
    nameLabel: 'BAT',
    valueLabel: '5V',
  }
  const resistor: CircuitSlot = {
    id: 'r1',
    kind: 'resistor',
    x: colX(0),
    y: TOP_RAIL_Y,
    orientation: 'horizontal',
    extent: 60,
    nameLabel: 'R1',
    valueLabel: resistorValue,
  }
  const leds: CircuitSlot[] = ledSlots.map((led, i) => ({
    id: led.id,
    kind: 'led',
    x: colX(i + 1),
    y: TOP_RAIL_Y,
    orientation: 'horizontal',
    extent: 48,
    nameLabel: led.nameLabel,
    valueLabel: '1.5V/20mA',
  }))
  const slots = [battery, resistor, ...leds]

  const topChain: CircuitSlot[] = [resistor, ...leds]
  const wires: WireDef[] = [
    { id: 'bat-top', from: { slot: 'battery', side: 'top' }, to: { point: { x: LEFT_X, y: TOP_RAIL_Y } } },
    { id: 'rail-in', from: { point: { x: LEFT_X, y: TOP_RAIL_Y } }, to: { slot: resistor.id, side: 'left' } },
    ...topChain.slice(0, -1).map((slot, i) => ({
      id: `chain-${i}`,
      from: { slot: slot.id, side: 'right' as Side },
      to: { slot: topChain[i + 1].id, side: 'left' as Side },
    })),
    {
      id: 'rail-out',
      from: { slot: topChain[topChain.length - 1].id, side: 'right' },
      to: { point: { x: RIGHT_X, y: TOP_RAIL_Y } },
    },
    { id: 'right-drop', from: { point: { x: RIGHT_X, y: TOP_RAIL_Y } }, to: { point: { x: RIGHT_X, y: BOTTOM_RAIL_Y } } },
    { id: 'bottom-rail', from: { point: { x: RIGHT_X, y: BOTTOM_RAIL_Y } }, to: { point: { x: LEFT_X, y: BOTTOM_RAIL_Y } } },
    { id: 'bat-bottom', from: { point: { x: LEFT_X, y: BOTTOM_RAIL_Y } }, to: { slot: 'battery', side: 'bottom' } },
  ]

  const palette: PaletteItem[] = [
    { id: 'battery', kind: 'battery', texture: 'elec-battery', label: 'Baterai' },
    { id: 'r1', kind: 'resistor', texture: 'elec-resistor', label: 'Resistor' },
    ...leds.map((led) => ({ id: led.id, kind: 'led' as const, texture: 'elec-led', label: led.nameLabel ?? 'LED' })),
    distractor,
  ]

  return { id, levelNumber, title, etiketName, palette, slots, wires, junctions: [] }
}

const LEVEL_1 = seriesLevel(
  'level-1',
  1,
  'Rangkaian Dasar LED',
  'RANGKAIAN DASAR LED',
  '220Ω',
  [{ id: 'led1', nameLabel: 'LED' }],
  { id: 'distractor-capacitor', kind: 'distractor', texture: 'elec-capacitor', label: 'Kapasitor' },
)

const LEVEL_2 = seriesLevel(
  'level-2',
  2,
  'Rangkaian 2 LED Seri',
  'RANGKAIAN 2 LED SERI',
  '100Ω',
  [
    { id: 'led1', nameLabel: 'LED1' },
    { id: 'led2', nameLabel: 'LED2' },
  ],
  { id: 'distractor-diode', kind: 'distractor', texture: 'elec-diode', label: 'Dioda' },
)

const LEVEL_3: CircuitLevel = (() => {
  const branch1X = LEFT_X + (RIGHT_X - LEFT_X) * 0.45
  // 0.7, not further right — LED2's drop-target ghost needs clearance from
  // the etiket zone pinned to the sheet's bottom-right corner.
  const branch2X = LEFT_X + (RIGHT_X - LEFT_X) * 0.7
  const branchTopY = SHEET_Y + 40
  const branchBottomY = SHEET_Y + SHEET_HEIGHT - 40
  const rY = branchTopY + 100
  const ledY = branchBottomY - 100

  const battery: CircuitSlot = {
    id: 'battery',
    kind: 'battery',
    x: LEFT_X,
    y: BATTERY_Y,
    orientation: 'vertical',
    extent: BATTERY_HALF_HEIGHT,
    nameLabel: 'BAT',
    valueLabel: '5V',
  }
  const r1: CircuitSlot = {
    id: 'r1',
    kind: 'resistor',
    x: branch1X,
    y: rY,
    orientation: 'vertical',
    extent: 45,
    nameLabel: 'R1',
    valueLabel: '220Ω',
  }
  const r2: CircuitSlot = { ...r1, id: 'r2', x: branch2X, nameLabel: 'R2' }
  const led1: CircuitSlot = {
    id: 'led1',
    kind: 'led',
    x: branch1X,
    y: ledY,
    orientation: 'vertical',
    extent: 48,
    nameLabel: 'LED1',
    valueLabel: '1.5V/20mA',
  }
  const led2: CircuitSlot = { ...led1, id: 'led2', x: branch2X, nameLabel: 'LED2' }

  const wires: WireDef[] = [
    { id: 'bat-top', from: { slot: 'battery', side: 'top' }, to: { point: { x: LEFT_X, y: branchTopY } } },
    { id: 'top-rail-1', from: { point: { x: LEFT_X, y: branchTopY } }, to: { point: { x: branch1X, y: branchTopY } } },
    { id: 'top-rail-2', from: { point: { x: branch1X, y: branchTopY } }, to: { point: { x: branch2X, y: branchTopY } } },
    { id: 'r1-drop-in', from: { point: { x: branch1X, y: branchTopY } }, to: { slot: 'r1', side: 'top' } },
    { id: 'r1-to-led1', from: { slot: 'r1', side: 'bottom' }, to: { slot: 'led1', side: 'top' } },
    { id: 'led1-drop-out', from: { slot: 'led1', side: 'bottom' }, to: { point: { x: branch1X, y: branchBottomY } } },
    { id: 'r2-drop-in', from: { point: { x: branch2X, y: branchTopY } }, to: { slot: 'r2', side: 'top' } },
    { id: 'r2-to-led2', from: { slot: 'r2', side: 'bottom' }, to: { slot: 'led2', side: 'top' } },
    { id: 'led2-drop-out', from: { slot: 'led2', side: 'bottom' }, to: { point: { x: branch2X, y: branchBottomY } } },
    { id: 'bottom-rail-2', from: { point: { x: branch2X, y: branchBottomY } }, to: { point: { x: branch1X, y: branchBottomY } } },
    { id: 'bottom-rail-1', from: { point: { x: branch1X, y: branchBottomY } }, to: { point: { x: LEFT_X, y: branchBottomY } } },
    { id: 'bat-bottom', from: { point: { x: LEFT_X, y: branchBottomY } }, to: { slot: 'battery', side: 'bottom' } },
  ]

  const palette: PaletteItem[] = [
    { id: 'battery', kind: 'battery', texture: 'elec-battery', label: 'Baterai' },
    { id: 'r1', kind: 'resistor', texture: 'elec-resistor', label: 'Resistor R1' },
    { id: 'r2', kind: 'resistor', texture: 'elec-resistor', label: 'Resistor R2' },
    { id: 'led1', kind: 'led', texture: 'elec-led', label: 'LED1' },
    { id: 'led2', kind: 'led', texture: 'elec-led', label: 'LED2' },
    { id: 'distractor-capacitor', kind: 'distractor', texture: 'elec-capacitor', label: 'Kapasitor' },
  ]

  return {
    id: 'level-3',
    levelNumber: 3,
    title: 'Rangkaian 2 LED Paralel',
    etiketName: 'RANGKAIAN 2 LED PARALEL',
    palette,
    slots: [battery, r1, r2, led1, led2],
    wires,
    junctions: [
      { x: branch1X, y: branchTopY },
      { x: branch1X, y: branchBottomY },
    ],
  }
})()

export const CIRCUIT_LEVELS: CircuitLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3]

export function circuitLevelById(id: CircuitLevel['id']): CircuitLevel {
  const level = CIRCUIT_LEVELS.find((candidate) => candidate.id === id)
  if (!level) throw new Error(`Unknown circuit level: ${id}`)
  return level
}

/** A wire endpoint's fixed design-space point — slot geometry is known regardless of fill state. */
export function resolveWireEnd(end: WireEnd, slots: CircuitSlot[]): Point {
  if (end.point) return end.point

  const slot = slots.find((candidate) => candidate.id === end.slot)
  if (!slot || !end.side) throw new Error('Malformed wire endpoint')

  switch (end.side) {
    case 'left':
      return { x: slot.x - slot.extent, y: slot.y }
    case 'right':
      return { x: slot.x + slot.extent, y: slot.y }
    case 'top':
      return { x: slot.x, y: slot.y - slot.extent }
    case 'bottom':
      return { x: slot.x, y: slot.y + slot.extent }
  }
}

/**
 * A wire touching a component only draws once that component is correctly
 * placed — "ketika ada komponen yang terhubung, animasikan trail line ke
 * target komponen". A wire touching no component (a pure corner/rail) has
 * nothing to react to, so it draws once the whole circuit is complete,
 * closing the loop as the finishing flourish.
 */
export function isWireReady(wire: WireDef, filledSlots: ReadonlySet<string>, allSlotIds: string[]): boolean {
  const refs = [wire.from.slot, wire.to.slot].filter((id): id is string => Boolean(id))
  if (refs.length === 0) return allSlotIds.every((id) => filledSlots.has(id))
  return refs.every((id) => filledSlots.has(id))
}
