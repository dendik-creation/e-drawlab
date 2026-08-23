import Phaser from 'phaser'
import { audio } from '../audio/AudioDirector'
import { FONT_BODY, FONT_MONO, TEXT_RESOLUTION, type UiContext } from '../desainSkema/uiKit'
import { clampToRange, decimalsFor, type SliderRange } from './traceModel'

/**
 * The "SimSlider" component from the Figma frame: a label + live value row, a
 * 6px track with a 20px thumb, and a min/max caption row.
 *
 * Hand-built in Phaser rather than a DOM `<input type="range">` on purpose —
 * every scene in this app renders into one supersampled canvas that
 * `applyStageCamera` zooms by DPR and centres on the 1920x1080 design frame
 * (see `stage.ts`). A DOM overlay lives outside that transform, so it would
 * drift out of alignment on every non-16:9 viewport, which is exactly the
 * class of bug the stage module exists to prevent.
 */

const TRACK_HEIGHT = 6
const TRACK_RADIUS = 3
const THUMB_RADIUS = 10
const TRACK_BG = 0x66878e
const TRACK_BG_ALPHA = 0.25
const TRACK_FILL = 0x0c6179
const LABEL_COLOR = '#12333b'
const VALUE_COLOR = '#0c6179'
const CAPTION_COLOR = '#66878e'

/** Vertical grab margin around the 20px thumb row — the same track is a small target on a phone. */
const HIT_PADDING_Y = 6

/**
 * Minimum gap between detent ticks. A drag across the power slider crosses
 * hundreds of steps; firing the sample on every one of them overlaps it with
 * itself into a buzz, so ticks are rate-limited to a rhythm instead.
 */
const TICK_INTERVAL_MS = 55

export interface SimSliderConfig {
  /** Slider block origin in the parent container's local space (top-left of the label row). */
  x: number
  y: number
  width: number
  label: string
  range: SliderRange
  value: number
  /** Height of the label/value row: 22 when a unit toggle shares it, else 20 (straight from Figma). */
  headerHeight?: number
  /** Horizontal room the value readout must leave for a sibling control (the mW/Watt toggle). */
  formatValue: (value: number) => string
  formatBound: (value: number) => string
  onChange: (value: number) => void
}

export class SimSlider {
  readonly container: Phaser.GameObjects.Container
  private ctx: UiContext
  private config: SimSliderConfig
  private range: SliderRange
  private value: number

  private trackGfx: Phaser.GameObjects.Graphics
  private thumbGfx: Phaser.GameObjects.Graphics
  private valueText: Phaser.GameObjects.Text
  private minText: Phaser.GameObjects.Text
  private maxText: Phaser.GameObjects.Text
  private zone: Phaser.GameObjects.Zone

  /** Track geometry, derived once from the header height Figma authored for this slider. */
  private trackY = 0
  private trackCenterY = 0

  private dragging = false
  private lastTickAt = 0
  private onPointerMove?: (pointer: Phaser.Input.Pointer) => void
  private onPointerUp?: () => void

  /**
   * `onChange` drives a full scene repaint (`simulasiStep.ts`'s `refresh()`)
   * — cheap on desktop, but a raw touchmove stream fires far faster than the
   * display can show it, so on mobile that repaint was running 2-4x more
   * often than any frame could actually render, which is what read as frame
   * drops while dragging. The thumb/track redraw below stays unthrottled
   * (it's two small Graphics, effectively free); only the expensive
   * downstream notify is collapsed to once per rendered frame.
   */
  private pendingNotifyValue: number | null = null
  private notifyRafId = 0

  constructor(ctx: UiContext, config: SimSliderConfig) {
    this.ctx = ctx
    this.config = config
    this.range = config.range
    this.value = config.value

    const scene = ctx.scene
    const headerHeight = config.headerHeight ?? 20
    const trackTop = headerHeight + 8
    const trackY = trackTop + (20 - TRACK_HEIGHT) / 2
    const captionY = trackTop + 28

    this.container = scene.add.container(config.x, config.y)

    const label = scene.add.text(0, headerHeight === 22 ? 1 : 0, config.label, {
      fontFamily: FONT_BODY,
      fontStyle: '600',
      fontSize: '14px',
      color: LABEL_COLOR,
      resolution: TEXT_RESOLUTION,
    })

    this.valueText = scene.add
      .text(config.width, headerHeight === 22 ? 1 : 0, config.formatValue(this.value), {
        fontFamily: FONT_MONO,
        fontStyle: '700',
        fontSize: '14px',
        color: VALUE_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(1, 0)

    this.trackGfx = scene.add.graphics()
    this.thumbGfx = scene.add.graphics()

    this.minText = this.caption(0, captionY, config.formatBound(this.range.min), 0)
    this.maxText = this.caption(config.width, captionY, config.formatBound(this.range.max), 1)

    this.zone = scene.add
      .zone(config.width / 2, trackTop + 10, config.width + THUMB_RADIUS * 2, 20 + HIT_PADDING_Y * 2)
      .setInteractive({ useHandCursor: true })

    this.container.add([label, this.valueText, this.trackGfx, this.thumbGfx, this.minText, this.maxText, this.zone])
    this.trackY = trackY
    this.trackCenterY = trackTop + 10

    this.redraw()
    this.bindInput()
  }

  private caption(x: number, y: number, text: string, originX: number) {
    return this.ctx.scene.add
      .text(x, y, text, {
        fontFamily: FONT_MONO,
        fontSize: '12px',
        color: CAPTION_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(originX, 0)
  }

  // ---------------------------------------------------------------------
  // Input — pointerdown anywhere on the track jumps to that value, then the
  // scene-level move listener keeps following until the pointer is released
  // (releasing outside the track still ends the drag).
  // ---------------------------------------------------------------------

  private bindInput() {
    const scene = this.ctx.scene

    this.zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ctx.isLocked()) return
      this.dragging = true
      this.applyPointer(pointer)
    })

    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging || !pointer.isDown) return
      this.applyPointer(pointer)
    }
    scene.input.on('pointermove', this.onPointerMove)

    this.onPointerUp = () => {
      this.dragging = false
    }
    scene.input.on('pointerup', this.onPointerUp)
    scene.input.on('pointerupoutside', this.onPointerUp)
  }

  /**
   * `worldX` (not `x`) because the stage camera is zoomed by DPR and centred
   * on the design frame — only the world coordinate is in the same 1920x1080
   * space as the container's own layout numbers.
   */
  private applyPointer(pointer: Phaser.Input.Pointer) {
    const matrix = this.container.getWorldTransformMatrix()
    const local = (pointer.worldX - matrix.tx) / (matrix.scaleX || 1)
    const fraction = Phaser.Math.Clamp(local / this.config.width, 0, 1)
    const raw = this.range.min + fraction * (this.range.max - this.range.min)
    this.setValue(clampToRange(raw, this.range), true)
  }

  /** Removes the scene-level listeners this slider owns; everything else dies with its container. */
  destroy() {
    const input = this.ctx.scene.input
    if (this.onPointerMove) input.off('pointermove', this.onPointerMove)
    if (this.onPointerUp) {
      input.off('pointerup', this.onPointerUp)
      input.off('pointerupoutside', this.onPointerUp)
    }
    this.onPointerMove = undefined
    this.onPointerUp = undefined
    this.dragging = false

    if (this.notifyRafId) {
      cancelAnimationFrame(this.notifyRafId)
      this.notifyRafId = 0
    }
    this.pendingNotifyValue = null
  }

  // ---------------------------------------------------------------------
  // Value
  // ---------------------------------------------------------------------

  getValue() {
    return this.value
  }

  setValue(value: number, notify: boolean) {
    const next = clampToRange(value, this.range)
    if (next === this.value) return
    this.value = next
    this.redraw()
    if (notify) {
      this.tick()
      this.scheduleNotify(next)
    }
  }

  /** Detent click, rate-limited so a fast drag reads as a ratchet rather than a buzz. */
  private tick() {
    const now = this.ctx.scene.time.now
    if (now - this.lastTickAt < TICK_INTERVAL_MS) return
    this.lastTickAt = now
    audio.play('sliderTick')
  }

  /** Collapses a burst of same-frame `setValue` calls into one `onChange` on the next paint — see the field comment above. */
  private scheduleNotify(value: number) {
    this.pendingNotifyValue = value
    if (this.notifyRafId) return
    this.notifyRafId = requestAnimationFrame(() => {
      this.notifyRafId = 0
      const pending = this.pendingNotifyValue
      this.pendingNotifyValue = null
      if (pending !== null) this.config.onChange(pending)
    })
  }

  /** Swaps the slider's scale (the mW/Watt toggle) and re-lands the current reading inside it. */
  setRange(range: SliderRange, value: number) {
    this.range = range
    this.value = clampToRange(value, range)
    this.minText.setText(this.config.formatBound(range.min))
    this.maxText.setText(this.config.formatBound(range.max))
    this.redraw()
  }

  private redraw() {
    const { width } = this.config
    const span = this.range.max - this.range.min
    const fraction = span === 0 ? 0 : Phaser.Math.Clamp((this.value - this.range.min) / span, 0, 1)
    const fillWidth = fraction * width

    this.trackGfx
      .clear()
      .fillStyle(TRACK_BG, TRACK_BG_ALPHA)
      .fillRoundedRect(0, this.trackY, width, TRACK_HEIGHT, TRACK_RADIUS)
    if (fillWidth > 0) {
      this.trackGfx.fillStyle(TRACK_FILL, 1).fillRoundedRect(0, this.trackY, Math.max(fillWidth, TRACK_HEIGHT), TRACK_HEIGHT, TRACK_RADIUS)
    }

    this.thumbGfx
      .clear()
      .fillStyle(0x000000, 0.12)
      .fillCircle(fillWidth, this.trackCenterY + 2, THUMB_RADIUS)
      .fillStyle(0xffffff, 1)
      .fillCircle(fillWidth, this.trackCenterY, THUMB_RADIUS)
      .lineStyle(2, TRACK_FILL, 1)
      .strokeCircle(fillWidth, this.trackCenterY, THUMB_RADIUS - 1)

    this.valueText.setText(this.config.formatValue(this.value))
  }
}

/**
 * Shared by every slider caption: prints a bound at its range's own precision,
 * without trailing zeros — Figma's captions read "0.1 mm" and "10 mm", not
 * "0.10 mm" and "10.00 mm".
 */
export function boundFormatter(range: SliderRange, suffix: string) {
  const decimals = decimalsFor(range.step)
  return (value: number) => `${Number(value.toFixed(decimals))} ${suffix}`
}
