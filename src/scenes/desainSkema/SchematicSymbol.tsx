import type { CircuitSlot } from '../../game/desainSkema/circuits'

/**
 * IEC/ANSI-flavoured schematic symbols, as SVG.
 *
 * Same geometry the canvas build drew with Graphics paths
 * (`game/desainSkema/schematicSymbols.ts`) — every symbol is authored
 * horizontally, centred on its own origin, and a vertical slot is achieved by
 * rotating the group rather than by a second drawing path.
 *
 * As SVG these are static elements the browser rasterises once, instead of
 * vertex data rebuilt whenever anything else on the sheet changed.
 */

const WIRE_COLOR = '#1fae6b'
const RESISTOR_COLOR = '#d23c3c'
const LED_BODY_COLOR = '#f5b731'
const LED_EDGE_COLOR = '#8a5a00'
const BATTERY_COLOR = '#d23c3c'
const JUNCTION_COLOR = '#1fae6b'

function Resistor({ halfWidth }: { halfWidth: number }) {
  const legLength = halfWidth * 0.3
  const zigzagWidth = halfWidth - legLength
  const zigzagHalfHeight = 14
  const teeth = 6

  const points: string[] = [`${-halfWidth},0`, `${-zigzagWidth},0`]
  for (let i = 0; i < teeth; i++) {
    const x = -zigzagWidth + (zigzagWidth * 2 * (i + 1)) / (teeth + 1)
    points.push(`${x},${i % 2 === 0 ? -zigzagHalfHeight : zigzagHalfHeight}`)
  }
  points.push(`${zigzagWidth},0`, `${halfWidth},0`)

  return <polyline points={points.join(' ')} fill="none" stroke={RESISTOR_COLOR} strokeWidth={4} />
}

/** Diode/LED: a filled triangle pointing right into a flat cathode bar, plus two emission arrows. */
function Led({ halfWidth }: { halfWidth: number }) {
  const triangleHalf = halfWidth * 0.45
  const barX = triangleHalf
  const barHalfHeight = 16

  return (
    <g>
      <line x1={-halfWidth} y1={0} x2={-triangleHalf} y2={0} stroke={LED_EDGE_COLOR} strokeWidth={4} />
      <line x1={barX} y1={0} x2={halfWidth} y2={0} stroke={LED_EDGE_COLOR} strokeWidth={4} />
      <polygon
        points={`${-triangleHalf},${-barHalfHeight} ${-triangleHalf},${barHalfHeight} ${barX},0`}
        fill={LED_BODY_COLOR}
        stroke={LED_EDGE_COLOR}
        strokeWidth={3}
      />
      <line x1={barX} y1={-barHalfHeight} x2={barX} y2={barHalfHeight} stroke={LED_EDGE_COLOR} strokeWidth={3} />
      {[-10, 8].map((offsetX) => {
        const startY = -barHalfHeight - 6
        const endX = offsetX + 14
        const endY = startY - 14
        return (
          <g key={offsetX} stroke={LED_EDGE_COLOR} strokeWidth={2.5} fill="none">
            <line x1={offsetX} y1={startY} x2={endX} y2={endY} />
            <line x1={endX} y1={endY} x2={endX - 6} y2={endY + 2} />
            <line x1={endX} y1={endY} x2={endX - 2} y2={endY + 6} />
          </g>
        )
      })}
    </g>
  )
}

/** Battery cell: a long thin "+" plate and a short thick "−" plate. Always drawn vertical. */
function Battery({ halfHeight }: { halfHeight: number }) {
  const plateGap = 10
  const longPlateWidth = 34
  const shortPlateWidth = 20

  return (
    <g stroke={BATTERY_COLOR} strokeLinecap="butt">
      <line x1={0} y1={-halfHeight} x2={0} y2={-plateGap} strokeWidth={4} />
      <line x1={-longPlateWidth / 2} y1={-plateGap} x2={longPlateWidth / 2} y2={-plateGap} strokeWidth={5} />
      <line x1={-shortPlateWidth / 2} y1={plateGap} x2={shortPlateWidth / 2} y2={plateGap} strokeWidth={9} />
      <line x1={0} y1={plateGap} x2={0} y2={halfHeight} strokeWidth={4} />
    </g>
  )
}

/**
 * One placed component, positioned and rotated on the sheet.
 *
 * A vertical resistor or LED rotates 90°, which also flips the diode to point
 * down-rail — the correct anode-to-cathode direction for level 3's
 * top-to-bottom branches. The battery is drawn vertical already and never
 * rotates.
 */
export function SchematicSymbol({ slot }: { slot: CircuitSlot }) {
  const rotate = slot.kind !== 'battery' && slot.orientation === 'vertical' ? 90 : 0

  return (
    <g transform={`translate(${slot.x} ${slot.y}) rotate(${rotate})`}>
      {slot.kind === 'resistor' && <Resistor halfWidth={slot.extent} />}
      {slot.kind === 'led' && <Led halfWidth={slot.extent} />}
      {slot.kind === 'battery' && <Battery halfHeight={slot.extent} />}
    </g>
  )
}

/** A faint preview of the symbol that belongs in an empty slot. */
export function GhostSymbol({ slot }: { slot: CircuitSlot }) {
  return (
    <g opacity={0.25}>
      <SchematicSymbol slot={slot} />
    </g>
  )
}

export function JunctionDot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={6} fill={JUNCTION_COLOR} />
}

export const WIRE_STROKE = WIRE_COLOR
/** The "current flowing" overlay colour, drawn over a finished wire. */
export const WIRE_FLOW_STROKE = '#cdf5e2'
