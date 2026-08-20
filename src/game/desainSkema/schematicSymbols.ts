import Phaser from 'phaser'

/**
 * IEC/ANSI-flavoured schematic symbols for the work sheet (as opposed to the
 * photographic component icons used in the palette). Every symbol is drawn
 * horizontally, centred on the Graphics object's own origin — a vertical slot
 * is achieved by rotating the container that holds it, not by a second
 * drawing path.
 */

const WIRE_COLOR = 0x1fae6b
const RESISTOR_COLOR = 0xd23c3c
const LED_BODY_COLOR = 0xf5b731
const LED_EDGE_COLOR = 0x8a5a00
const BATTERY_COLOR = 0xd23c3c
const JUNCTION_COLOR = 0x1fae6b

export function drawResistorSymbol(gfx: Phaser.GameObjects.Graphics, halfWidth: number) {
  const legLength = halfWidth * 0.3
  const zigzagWidth = halfWidth - legLength
  const zigzagHalfHeight = 14
  const teeth = 6

  gfx.lineStyle(4, RESISTOR_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(-halfWidth, 0)
  gfx.lineTo(-zigzagWidth, 0)

  for (let i = 0; i < teeth; i++) {
    const x = -zigzagWidth + (zigzagWidth * 2 * (i + 1)) / (teeth + 1)
    const y = i % 2 === 0 ? -zigzagHalfHeight : zigzagHalfHeight
    gfx.lineTo(x, y)
  }

  gfx.lineTo(zigzagWidth, 0)
  gfx.lineTo(halfWidth, 0)
  gfx.strokePath()
}

/** Diode/LED symbol: a filled triangle pointing right into a flat cathode bar, plus two emission arrows. */
export function drawLedSymbol(gfx: Phaser.GameObjects.Graphics, halfWidth: number) {
  const triangleHalf = halfWidth * 0.45
  const barX = triangleHalf
  const barHalfHeight = 16

  gfx.lineStyle(4, LED_EDGE_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(-halfWidth, 0)
  gfx.lineTo(-triangleHalf, 0)
  gfx.strokePath()
  gfx.beginPath()
  gfx.moveTo(barX, 0)
  gfx.lineTo(halfWidth, 0)
  gfx.strokePath()

  gfx.fillStyle(LED_BODY_COLOR, 1)
  gfx.lineStyle(3, LED_EDGE_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(-triangleHalf, -barHalfHeight)
  gfx.lineTo(-triangleHalf, barHalfHeight)
  gfx.lineTo(barX, 0)
  gfx.closePath()
  gfx.fillPath()
  gfx.strokePath()

  gfx.lineStyle(3, LED_EDGE_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(barX, -barHalfHeight)
  gfx.lineTo(barX, barHalfHeight)
  gfx.strokePath()

  // Two short emission arrows above-right of the diode, angled up-right.
  ;[-10, 8].forEach((offsetX) => {
    const startX = offsetX
    const startY = -barHalfHeight - 6
    const endX = startX + 14
    const endY = startY - 14
    gfx.lineStyle(2.5, LED_EDGE_COLOR, 1)
    gfx.beginPath()
    gfx.moveTo(startX, startY)
    gfx.lineTo(endX, endY)
    gfx.moveTo(endX, endY)
    gfx.lineTo(endX - 6, endY + 2)
    gfx.moveTo(endX, endY)
    gfx.lineTo(endX - 2, endY + 6)
    gfx.strokePath()
  })
}

/** Battery cell symbol: a long thin "+" plate and a short thick "−" plate. */
export function drawBatterySymbol(gfx: Phaser.GameObjects.Graphics, halfHeight: number) {
  const plateGap = 10
  const longPlateWidth = 34
  const shortPlateWidth = 20
  const leadLength = halfHeight - plateGap

  gfx.lineStyle(4, BATTERY_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(0, -halfHeight)
  gfx.lineTo(0, -plateGap)
  gfx.strokePath()

  gfx.lineStyle(5, BATTERY_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(-longPlateWidth / 2, -plateGap)
  gfx.lineTo(longPlateWidth / 2, -plateGap)
  gfx.strokePath()

  gfx.lineStyle(9, BATTERY_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(-shortPlateWidth / 2, plateGap)
  gfx.lineTo(shortPlateWidth / 2, plateGap)
  gfx.strokePath()

  gfx.lineStyle(4, BATTERY_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(0, plateGap)
  gfx.lineTo(0, halfHeight)
  gfx.strokePath()

  void leadLength
}

export function drawJunctionDot(gfx: Phaser.GameObjects.Graphics, x: number, y: number) {
  gfx.fillStyle(JUNCTION_COLOR, 1)
  gfx.fillCircle(x, y, 6)
}

/** Draws a straight wire from `from` to a point `progress` of the way to `to` — the "trail line" reveal. */
export function drawWireProgress(
  gfx: Phaser.GameObjects.Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number,
) {
  gfx.clear()
  gfx.lineStyle(4, WIRE_COLOR, 1)
  gfx.beginPath()
  gfx.moveTo(from.x, from.y)
  gfx.lineTo(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress)
  gfx.strokePath()
}

const DASH_COLOR = 0xcdf5e2

/**
 * "Current flowing" overlay once a wire's trail-line reveal finishes: one
 * plain, full-length line — no dash pattern, no animation. Replaces an
 * earlier marching-dash version that redrew every frame forever; this is a
 * single static draw per wire.
 */
export function drawWireFlowOverlay(gfx: Phaser.GameObjects.Graphics, from: { x: number; y: number }, to: { x: number; y: number }) {
  gfx.clear()
  gfx.lineStyle(4, DASH_COLOR, 0.85)
  gfx.beginPath()
  gfx.moveTo(from.x, from.y)
  gfx.lineTo(to.x, to.y)
  gfx.strokePath()
}
