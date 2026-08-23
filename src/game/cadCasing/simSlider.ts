import Phaser from 'phaser'
import { audio } from '../audio/AudioDirector'
import { FONT_BODY, FONT_MONO, TEXT_RESOLUTION, type UiContext } from '../desainSkema/uiKit'
import { clampToRange, type SliderRange } from './casingModel'

/**
 * Drag slider for the CAD Casing simulator, adapted from `jalurPcb/simSlider.ts`
 * (kept as its own copy — see `simulasiStep.ts`'s note on why journeys don't
 * share this widget). Two differences from that version: this frame's rows
 * carry their own track color per parameter (`trackColor`), and Figma's
 * "SliderRow" here has no min/max caption line, so that row is dropped.
 *
 * Hand-built in Phaser rather than a DOM `<input type="range">` for the same
 * reason as `jalurPcb/simSlider.ts`: the stage is a single supersampled,
 * DPR-zoomed canvas (`stage.ts`), so a DOM overlay would drift out of
 * alignment on any non-16:9 viewport.
 */

const TRACK_HEIGHT = 6
const TRACK_RADIUS = 3
const THUMB_RADIUS = 7
const TRACK_BG = 0xe2e8f0
const TRACK_BG_ALPHA = 1
const LABEL_COLOR = '#334155'

/** Vertical grab margin around the thumb row — the same track is a small target on a phone. */
const HIT_PADDING_Y = 8

/** Minimum gap between detent ticks, same rate-limit reasoning as `jalurPcb/simSlider.ts`. */
const TICK_INTERVAL_MS = 55

export interface SimSliderConfig {
  x: number
  y: number
  width: number
  label: string
  range: SliderRange
  value: number
  /** This row's value/track color — every row in this Figma frame has its own. */
  trackColor: number
  /** Height of the label/value row before the track starts. Figma authors this row at 12px. */
  headerHeight?: number
  formatValue: (value: number) => string
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
  private zone: Phaser.GameObjects.Zone

  private trackY = 0
  private trackCenterY = 0

  private dragging = false
  private lastTickAt = 0
  private onPointerMove?: (pointer: Phaser.Input.Pointer) => void
  private onPointerUp?: () => void

  /**
   * `onChange` drives a full 3D-viewport repaint (`simulasiStep.ts`'s
   * `refresh()`/`paintViewport()`) — a raw touchmove stream fires far faster
   * than the display can show it, so on mobile that repaint ran several
   * times more often than any frame could actually render, reading as frame
   * drops while dragging. The thumb/track redraw below stays unthrottled
   * (two small Graphics, effectively free); only the expensive downstream
   * notify is collapsed to once per rendered frame. See `jalurPcb/simSlider.ts`,
   * which has the same fix for the same reason.
   */
  private pendingNotifyValue: number | null = null
  private notifyRafId = 0

  constructor(ctx: UiContext, config: SimSliderConfig) {
    this.ctx = ctx
    this.config = config
    this.range = config.range
    this.value = config.value

    const scene = ctx.scene
    const headerHeight = config.headerHeight ?? 12
    const trackTop = headerHeight + 6
    const trackY = trackTop + (20 - TRACK_HEIGHT) / 2

    this.container = scene.add.container(config.x, config.y)

    const label = scene.add.text(0, 0, config.label, {
      fontFamily: FONT_BODY,
      fontStyle: '500',
      fontSize: '11.5px',
      color: LABEL_COLOR,
      resolution: TEXT_RESOLUTION,
    })

    this.valueText = scene.add
      .text(config.width, 0, config.formatValue(this.value), {
        fontFamily: FONT_MONO,
        fontStyle: '500',
        fontSize: '11px',
        color: this.hexToCss(config.trackColor),
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(1, 0)

    this.trackGfx = scene.add.graphics()
    this.thumbGfx = scene.add.graphics()

    this.zone = scene.add
      .zone(config.width / 2, trackTop + 10, config.width + THUMB_RADIUS * 2, 20 + HIT_PADDING_Y * 2)
      .setInteractive({ useHandCursor: true })

    this.container.add([label, this.valueText, this.trackGfx, this.thumbGfx, this.zone])
    this.trackY = trackY
    this.trackCenterY = trackTop + 10

    this.redraw()
    this.bindInput()
  }

  private hexToCss(hex: number) {
    return `#${hex.toString(16).padStart(6, '0')}`
  }

  // ---------------------------------------------------------------------
  // Input — same shape as jalurPcb/simSlider.ts: pointerdown jumps to that
  // value, a scene-level move listener keeps following until release.
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

  /** `worldX`, not `x` — the stage camera is DPR-zoomed, so only the world coordinate matches the container's own layout numbers. */
  private applyPointer(pointer: Phaser.Input.Pointer) {
    const matrix = this.container.getWorldTransformMatrix()
    const local = (pointer.worldX - matrix.tx) / (matrix.scaleX || 1)
    const fraction = Phaser.Math.Clamp(local / this.config.width, 0, 1)
    const raw = this.range.min + fraction * (this.range.max - this.range.min)
    this.setValue(clampToRange(raw, this.range), true)
  }

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

  private redraw() {
    const { width, trackColor } = this.config
    const span = this.range.max - this.range.min
    const fraction = span === 0 ? 0 : Phaser.Math.Clamp((this.value - this.range.min) / span, 0, 1)
    const fillWidth = fraction * width

    this.trackGfx
      .clear()
      .fillStyle(TRACK_BG, TRACK_BG_ALPHA)
      .fillRoundedRect(0, this.trackY, width, TRACK_HEIGHT, TRACK_RADIUS)
    if (fillWidth > 0) {
      this.trackGfx.fillStyle(trackColor, 1).fillRoundedRect(0, this.trackY, Math.max(fillWidth, TRACK_HEIGHT), TRACK_HEIGHT, TRACK_RADIUS)
    }

    this.thumbGfx
      .clear()
      .fillStyle(0x000000, 0.12)
      .fillCircle(fillWidth, this.trackCenterY + 1.5, THUMB_RADIUS)
      .fillStyle(0xffffff, 1)
      .fillCircle(fillWidth, this.trackCenterY, THUMB_RADIUS)
      .lineStyle(2, trackColor, 1)
      .strokeCircle(fillWidth, this.trackCenterY, THUMB_RADIUS - 1)

    this.valueText.setText(this.config.formatValue(this.value)).setColor(this.hexToCss(trackColor))
  }
}
