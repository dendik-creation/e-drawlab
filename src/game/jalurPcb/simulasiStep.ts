import Phaser from 'phaser'
import { audio } from '../audio/AudioDirector'
import type { SfxKey } from '../audio/manifest'
import { attachButtonBehaviour, buildNextButton, FONT_BODY, FONT_MONO, TEXT_RESOLUTION, type UiContext } from '../desainSkema/uiKit'
import { SimSlider, boundFormatter } from './simSlider'
import {
  COPPER_BAND_HEIGHT,
  COPPER_FACTOR,
  COPPER_LABEL,
  MIN_RECOMMENDED_WIDTH,
  POWER_RANGE,
  VOLTAGE_RANGE,
  WIDTH_RANGE,
  convertPower,
  currentFormula,
  evaluate,
  formatFactor,
  formatPower,
  widthFormula,
  type CopperThickness,
  type PowerUnit,
  type SimulatorInput,
  type TraceStatus,
} from './traceModel'

/**
 * Langkah 2 — "Simulator Lebar Jalur PCB", built from the Figma frame
 * "Step 2 - Simulasi" (node 48:423) of the E-DrawLab file.
 *
 * Two columns inside a 1549x830 content area: a white "Kontrol Input" card on
 * the left (three sliders, a mW/Watt unit toggle, a copper-thickness segmented
 * control and a read-only current card), and a dark "Visualisasi Layout" panel
 * on the right holding the live trace preview plus the two result cards.
 *
 * Everything is drawn with Phaser Graphics/Text rather than DOM elements: the
 * whole app renders into one supersampled canvas that `applyStageCamera` zooms
 * by DPR and centres on the design frame, so a DOM overlay would sit outside
 * that transform and drift on any non-16:9 viewport. See `simSlider.ts`.
 */

// ---------------------------------------------------------------------
// Palette + type ramp, all straight from the Figma frame (no variables are
// bound in the file, so these are the raw hex values it paints with).
// ---------------------------------------------------------------------

const PANEL_WHITE = 0xffffff
const PANEL_DARK = 0x0a4e62
const VIZ_BACKDROP = 0x093c4e
const CARD_CREAM = 0xfaf3e7
const CURRENT_CARD_FILL = 0xede5d3
const ACCENT = 0x0c6179
const ACCENT_TEXT = '#0c6179'
const HEADING_TEXT = '#0c6179'
const LABEL_TEXT = '#12333b'
const MUTED = 0x66878e
const MUTED_TEXT = '#66878e'
const HAIRLINE_ALPHA = 0.2
const GOLD_TEXT = '#fddc6c'
const COPPER = 0xb87333
const COPPER_HIGHLIGHT = 0xd89a5a
const GOLD = 0xfddc6c
const PAD_CORE = 0x0a2530
const BADGE_BACKDROP = 0x04202a

/** Status ramps. Only the OK ramp exists in Figma — warning/danger extend it with the app's own semantic gold/red. */
interface StatusStyle {
  trace: number
  highlight: number
  badgeText: string
  evalText: string
  glyph: string
  badgeLabel: string
  message: string
  /** Verdict sting, played only when the status actually flips. */
  sfx: SfxKey
}

const STATUS_STYLE: Record<TraceStatus, StatusStyle> = {
  ok: {
    trace: 0x3e8b5c,
    highlight: 0x7edba4,
    badgeText: '#7edba4',
    evalText: '#2c6b44',
    glyph: '✓',
    badgeLabel: 'Jalur Aman',
    message: 'Jalur memenuhi rekomendasi',
    sfx: 'statusSafe',
  },
  warning: {
    trace: 0xc9971f,
    highlight: 0xfddc6c,
    badgeText: '#fddc6c',
    evalText: '#8a6414',
    glyph: '!',
    badgeLabel: 'Jalur Kurang Lebar',
    message: 'Lebar jalur mendekati batas rekomendasi',
    sfx: 'statusWarning',
  },
  danger: {
    trace: 0xc0392b,
    highlight: 0xf08a7c,
    badgeText: '#f5a99e',
    evalText: '#8e2b20',
    glyph: '✕',
    badgeLabel: 'Jalur Berisiko',
    message: 'Lebar jalur di bawah rekomendasi',
    sfx: 'statusDanger',
  },
}

// ---------------------------------------------------------------------
// Layout — design-space coordinates lifted from the Figma frame.
// ---------------------------------------------------------------------

const LEFT_PANEL = { x: 206, y: 196, width: 420, height: 811 }
const RIGHT_PANEL = { x: 646, y: 196, width: 1069, height: 509 }
const PANEL_RADIUS = 16

/** Left card: body starts under the 79px header block, contents inset 24px. */
const BODY_TOP = 79
const BODY_INSET = 24
const SLIDER_WIDTH = 372

const SEGMENT_WIDTH = 118.66
const SEGMENT_GAP = 8
const SEGMENT_HEIGHT = 49

const VIZ_BOX = { x: 24, y: 85, width: 1021, height: 220 }
/** Centre of the trace preview inside the dark panel, and of the status badge under it. */
const TRACE_CENTER_X = 534.5
const TRACE_CENTER_Y = 170
const TRACE_HALF_LENGTH = 200
const PAD_RADIUS = 38.52
const BADGE_CENTER_Y = 285

/** Figma draws a 5.35 mm trace 64.2px tall — exactly 12px per millimetre. */
const TRACE_PX_PER_MM = 12
/** Highlight band keeps its authored 17.976/64.2 share of the trace's thickness. */
const HIGHLIGHT_RATIO = 17.976 / 64.2

const RESULT_ROW_Y = 321
const RESULT_ROW_HEIGHT = 168
const CARD_A_WIDTH = 496.71
const CARD_B_X = 536.71
const CARD_B_WIDTH = 508.29

export class SimulasiStep {
  private ctx: UiContext

  private input: SimulatorInput = {
    power: 64600,
    unit: 'mW',
    voltage: 43,
    copper: '2',
    actualWidth: 5.35,
  }
  /** "Ukuran" switch: shows the dimension line + width label on the trace. */
  private showMeasure = true

  private sliders: SimSlider[] = []
  private powerSlider!: SimSlider

  // Widgets whose paint depends on state, kept as fields so `refresh()` can
  // repaint them in place instead of rebuilding the panel on every drag tick.
  private unitSegments = new Map<PowerUnit, { gfx: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }>()
  private copperSegments = new Map<CopperThickness, { gfx: Phaser.GameObjects.Graphics; bar: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }>()
  private crossSection!: Phaser.GameObjects.Graphics
  private copperTitle!: Phaser.GameObjects.Text
  private copperFactorText!: Phaser.GameObjects.Text
  private currentValue!: Phaser.GameObjects.Text
  private currentFormulaText!: Phaser.GameObjects.Text
  private switchGfx!: Phaser.GameObjects.Graphics
  private traceGfx!: Phaser.GameObjects.Graphics
  private traceGlow!: Phaser.GameObjects.Graphics
  private measureLabel!: Phaser.GameObjects.Text
  private badgeGfx!: Phaser.GameObjects.Graphics
  private badgeGlyph!: Phaser.GameObjects.Text
  private badgeLabel!: Phaser.GameObjects.Text
  private recommendedValue!: Phaser.GameObjects.Text
  private recommendedFormula!: Phaser.GameObjects.Text
  private minBadgeGfx!: Phaser.GameObjects.Graphics
  private minBadgeText!: Phaser.GameObjects.Text
  private evalCardGfx!: Phaser.GameObjects.Graphics
  private evalRecommended!: Phaser.GameObjects.Text
  private evalActual!: Phaser.GameObjects.Text
  private evalMessageGfx!: Phaser.GameObjects.Graphics
  private evalMessageGlyph!: Phaser.GameObjects.Text
  private evalMessage!: Phaser.GameObjects.Text

  private glowPulse?: Phaser.Tweens.Tween
  private lastStatus: TraceStatus | null = null

  constructor(ctx: UiContext) {
    this.ctx = ctx
  }

  /** The scene cross-fades `body` on the way in, so this just builds and paints once. */
  render(body: Phaser.GameObjects.Container, onNext: () => void) {
    body.add([this.buildLeftPanel(), this.buildRightPanel(), buildNextButton(this.ctx, true, onNext)])
    this.refresh()
  }

  /** Drops the scene-level pointer listeners the sliders own, and the danger pulse. */
  teardown() {
    this.sliders.forEach((slider) => slider.destroy())
    this.sliders = []
    this.glowPulse?.remove()
    this.glowPulse = undefined
  }

  // ---------------------------------------------------------------------
  // Small shared builders
  // ---------------------------------------------------------------------

  private text(x: number, y: number, value: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
    return this.ctx.scene.add.text(x, y, value, { fontFamily: FONT_BODY, resolution: TEXT_RESOLUTION, ...style })
  }

  private mono(x: number, y: number, value: string, size: number, color: string, bold: boolean) {
    return this.text(x, y, value, {
      fontFamily: FONT_MONO,
      fontStyle: bold ? '700' : '400',
      fontSize: `${size}px`,
      color,
    })
  }

  private hairline(gfx: Phaser.GameObjects.Graphics, x: number, y: number, width: number, color = MUTED, alpha = HAIRLINE_ALPHA) {
    gfx.fillStyle(color, alpha).fillRect(x, y, width, 1)
  }

  /** Card body + the soft drop shadow Figma puts under both panels. */
  private card(x: number, y: number, width: number, height: number, fill: number, radius: number, shadowAlpha: number) {
    return this.ctx.scene.add
      .graphics()
      .fillStyle(ACCENT, shadowAlpha)
      .fillRoundedRect(x, y + 4, width, height, radius)
      .fillStyle(fill, 1)
      .fillRoundedRect(x, y, width, height, radius)
  }

  // ---------------------------------------------------------------------
  // Left column — "Kontrol Input"
  // ---------------------------------------------------------------------

  private buildLeftPanel() {
    const scene = this.ctx.scene
    const panel = scene.add.container(LEFT_PANEL.x, LEFT_PANEL.y)

    const bg = this.card(0, 0, LEFT_PANEL.width, LEFT_PANEL.height, PANEL_WHITE, PANEL_RADIUS, 0.08)
    const rules = scene.add.graphics()
    this.hairline(rules, 0, BODY_TOP, LEFT_PANEL.width)

    const title = this.text(BODY_INSET, 15, 'Kontrol Input', {
      fontStyle: '700',
      fontSize: '20px',
      color: HEADING_TEXT,
    })
    const subtitle = this.text(BODY_INSET, 45, 'Atur parameter beban daya sistem', {
      fontSize: '12px',
      color: MUTED_TEXT,
    })

    panel.add([bg, rules, title, subtitle])

    // Beban Daya + mW/Watt toggle
    this.powerSlider = new SimSlider(this.ctx, {
      x: BODY_INSET,
      y: BODY_TOP + 16,
      width: SLIDER_WIDTH,
      label: 'Beban Daya',
      range: POWER_RANGE[this.input.unit],
      value: this.input.power,
      headerHeight: 22,
      formatValue: (value) => `${formatPower(value, this.input.unit)} ${this.input.unit}`,
      formatBound: (value) => `${formatPower(value, this.input.unit)} ${this.input.unit}`,
      onChange: (value) => {
        this.input.power = value
        this.refresh()
      },
    })
    this.sliders.push(this.powerSlider)
    panel.add(this.powerSlider.container)
    panel.add(this.buildUnitToggle(BODY_INSET + 218.78, BODY_TOP + 16))

    this.hairline(rules, BODY_INSET, BODY_TOP + 110, SLIDER_WIDTH)

    const voltage = new SimSlider(this.ctx, {
      x: BODY_INSET,
      y: BODY_TOP + 131,
      width: SLIDER_WIDTH,
      label: 'Tegangan Sistem',
      range: VOLTAGE_RANGE,
      value: this.input.voltage,
      formatValue: (value) => `${value} V`,
      formatBound: boundFormatter(VOLTAGE_RANGE, 'V'),
      onChange: (value) => {
        this.input.voltage = value
        this.refresh()
      },
    })
    this.sliders.push(voltage)
    panel.add(voltage.container)

    this.hairline(rules, BODY_INSET, BODY_TOP + 223, SLIDER_WIDTH)
    panel.add(this.buildCopperSection(BODY_INSET, BODY_TOP + 244))

    this.hairline(rules, BODY_INSET, BODY_TOP + 437, SLIDER_WIDTH)
    panel.add(this.buildCurrentSection(BODY_INSET, BODY_TOP + 458))

    this.hairline(rules, BODY_INSET, BODY_TOP + 582, SLIDER_WIDTH)
    panel.add(this.buildActualWidthSection(BODY_INSET, BODY_TOP + 603))

    return panel
  }

  /** 77x22 pill holding the two unit segments — the active one carries the accent fill. */
  private buildUnitToggle(x: number, y: number) {
    const scene = this.ctx.scene
    const group = scene.add.container(x, y)

    const border = scene.add
      .graphics()
      .lineStyle(1, MUTED, 0.4)
      .strokeRoundedRect(0.5, 0.5, 77.22 - 1, 21, 8)

    group.add(border)
    ;([
      { unit: 'mW' as PowerUnit, x: 1, width: 31, radius: { tl: 7, bl: 7, tr: 0, br: 0 } },
      { unit: 'W' as PowerUnit, x: 32, width: 44.22, radius: { tl: 0, bl: 0, tr: 7, br: 7 } },
    ]).forEach(({ unit, x: segX, width, radius }) => {
      const gfx = scene.add.graphics()
      const text = this.text(0, 0, unit === 'mW' ? 'mW' : 'Watt', {
        fontFamily: FONT_MONO,
        fontStyle: '700',
        fontSize: '12px',
        color: MUTED_TEXT,
      }).setOrigin(0.5)

      // The button container is centred on the segment so the shared
      // hover/press scale in `attachButtonBehaviour` grows it from its middle.
      const centerX = segX + width / 2
      const button = scene.add.container(centerX, 11, [gfx, text])
      button.setSize(width, 20)
      gfx.setData('rect', { x: -width / 2, y: -10, width, height: 20, radius })
      attachButtonBehaviour(this.ctx, button, () => this.setUnit(unit))

      this.unitSegments.set(unit, { gfx, text })
      group.add(button)
    })

    return group
  }

  private buildCopperSection(x: number, y: number) {
    const scene = this.ctx.scene
    const group = scene.add.container(x, y)

    const label = this.text(0, 0, 'Ketebalan Tembaga PCB', {
      fontStyle: '600',
      fontSize: '14px',
      color: LABEL_TEXT,
    })
    group.add(label)

    ;(['0.5', '1', '2'] as CopperThickness[]).forEach((thickness, index) => {
      const segX = index * (SEGMENT_WIDTH + SEGMENT_GAP)
      const gfx = scene.add.graphics()
      const bar = scene.add.graphics()
      const text = this.text(0, 0, COPPER_LABEL[thickness], {
        fontStyle: '700',
        fontSize: '12px',
        color: MUTED_TEXT,
        align: 'center',
      }).setOrigin(0.5, 0)

      const button = scene.add.container(segX + SEGMENT_WIDTH / 2, 32 + SEGMENT_HEIGHT / 2, [gfx, bar, text])
      button.setSize(SEGMENT_WIDTH, SEGMENT_HEIGHT)
      attachButtonBehaviour(this.ctx, button, () => this.setCopper(thickness))

      this.copperSegments.set(thickness, { gfx, bar, text })
      group.add(button)
    })

    // Cross-section preview card
    const preview = scene.add
      .graphics()
      .fillStyle(CARD_CREAM, 1)
      .fillRoundedRect(0, 97, SLIDER_WIDTH, 76, 8)
    this.crossSection = scene.add.graphics()
    this.crossSection.setPosition(12, 109)

    this.copperTitle = this.text(148, 118, COPPER_LABEL[this.input.copper], {
      fontStyle: '600',
      fontSize: '12px',
      color: ACCENT_TEXT,
    })
    this.copperFactorText = this.text(148, 136, '', {
      fontSize: '12px',
      color: MUTED_TEXT,
    })

    group.add([preview, this.crossSection, this.copperTitle, this.copperFactorText])
    return group
  }

  /** "Arus Terhitung" — read-only result card, inset-shadowed cream in Figma. */
  private buildCurrentSection(x: number, y: number) {
    const scene = this.ctx.scene
    const group = scene.add.container(x, y)

    const label = this.text(0, 0, 'Arus Terhitung', {
      fontStyle: '600',
      fontSize: '14px',
      color: LABEL_TEXT,
    })

    const card = scene.add
      .graphics()
      .fillStyle(CURRENT_CARD_FILL, 1)
      .fillRoundedRect(0, 28, SLIDER_WIDTH, 76, 8)
      // Stand-in for Figma's inset shadow: a darker lip along the card's top edge.
      .fillStyle(ACCENT, 0.14)
      .fillRoundedRect(0, 28, SLIDER_WIDTH, 6, { tl: 8, tr: 8, bl: 0, br: 0 })
      .fillStyle(CURRENT_CARD_FILL, 1)
      .fillRoundedRect(0, 30, SLIDER_WIDTH, 74, { tl: 6, tr: 6, bl: 8, br: 8 })

    this.currentValue = this.mono(16, 38, '', 24, ACCENT_TEXT, true)
    this.currentFormulaText = this.mono(16, 76, '', 12, MUTED_TEXT, false)

    group.add([label, card, this.currentValue, this.currentFormulaText])
    return group
  }

  private buildActualWidthSection(x: number, y: number) {
    const scene = this.ctx.scene
    const group = scene.add.container(x, y)

    const card = this.card(0, 0, SLIDER_WIDTH, 104, PANEL_WHITE, 8, 0.14)
    group.add(card)

    const slider = new SimSlider(this.ctx, {
      x: 16,
      y: 16,
      width: 340,
      label: 'Lebar Jalur Aktual',
      range: WIDTH_RANGE,
      value: this.input.actualWidth,
      formatValue: (value) => `${value.toFixed(2)} mm`,
      formatBound: boundFormatter(WIDTH_RANGE, 'mm'),
      onChange: (value) => {
        this.input.actualWidth = value
        this.refresh()
      },
    })
    this.sliders.push(slider)
    group.add(slider.container)

    return group
  }

  // ---------------------------------------------------------------------
  // Right column — "Visualisasi Layout (Zoom)"
  // ---------------------------------------------------------------------

  private buildRightPanel() {
    const scene = this.ctx.scene
    const panel = scene.add.container(RIGHT_PANEL.x, RIGHT_PANEL.y)

    const bg = this.card(0, 0, RIGHT_PANEL.width, RIGHT_PANEL.height, PANEL_DARK, PANEL_RADIUS, 0.12)
    const rules = scene.add.graphics()
    this.hairline(rules, 0, 65, RIGHT_PANEL.width, 0xffffff, 0.1)

    const title = this.text(24, 20, 'VISUALISASI LAYOUT (ZOOM)', {
      fontFamily: FONT_MONO,
      fontStyle: '700',
      fontSize: '14px',
      color: GOLD_TEXT,
      letterSpacing: 1.4,
    })

    panel.add([bg, rules, title])
    // Figma's "Lanjut ke Evaluasi" chip sat here next to the switch; dropped
    // because the footer "Lanjut →" already owns that transition.
    panel.add(this.buildMeasureSwitch(RIGHT_PANEL.width - 24 - 88, 20))
    panel.add(this.buildVisualization())
    panel.add(this.buildResultCards())

    return panel
  }

  /** "Ukuran" label + 40x24 switch that shows/hides the trace's dimension line. */
  private buildMeasureSwitch(x: number, y: number) {
    const scene = this.ctx.scene
    const group = scene.add.container(x, y)

    const label = this.text(0, 4, 'Ukuran', {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.8)',
    })

    this.switchGfx = scene.add.graphics()
    const button = scene.add.container(48 + 20, 12, [this.switchGfx])
    button.setSize(40, 24)
    attachButtonBehaviour(this.ctx, button, () => {
      this.showMeasure = !this.showMeasure
      this.refresh()
    })

    group.add([label, button])
    return group
  }

  private buildVisualization() {
    const scene = this.ctx.scene
    const group = scene.add.container(0, 0)

    const backdrop = scene.add.graphics().fillStyle(VIZ_BACKDROP, 1).fillRoundedRect(VIZ_BOX.x, VIZ_BOX.y, VIZ_BOX.width, VIZ_BOX.height, PANEL_RADIUS)

    // Dot grid on the same 24px pitch as the ruler ticks along the top edge.
    const dots = scene.add.graphics().fillStyle(MUTED, 0.16)
    for (let dx = 12; dx < VIZ_BOX.width; dx += 24) {
      for (let dy = 24; dy < VIZ_BOX.height; dy += 24) {
        dots.fillCircle(VIZ_BOX.x + dx, VIZ_BOX.y + dy, 1)
      }
    }

    const ruler = scene.add.image(VIZ_BOX.x, VIZ_BOX.y, 'jalur-sim-ruler').setOrigin(0, 0).setDisplaySize(VIZ_BOX.width, 12)

    this.traceGlow = scene.add.graphics()
    this.traceGfx = scene.add.graphics()
    this.measureLabel = this.mono(0, 0, '', 12, '#ffffff', true).setOrigin(0.5)
    this.measureLabel.setPosition(TRACE_CENTER_X, TRACE_CENTER_Y)

    this.badgeGfx = scene.add.graphics()
    this.badgeGlyph = this.text(0, 0, '', { fontStyle: '700', fontSize: '10px', color: '#093c4e' }).setOrigin(0.5)
    this.badgeLabel = this.text(0, 0, '', { fontStyle: '700', fontSize: '12px', color: '#7edba4' }).setOrigin(0, 0.5)

    group.add([backdrop, dots, ruler, this.traceGlow, this.traceGfx, this.measureLabel, this.badgeGfx, this.badgeGlyph, this.badgeLabel])
    return group
  }

  private buildResultCards() {
    const scene = this.ctx.scene
    const group = scene.add.container(0, 0)

    // Card A — recommended width
    const cardA = this.card(VIZ_BOX.x, RESULT_ROW_Y, CARD_A_WIDTH, RESULT_ROW_HEIGHT, CARD_CREAM, PANEL_RADIUS, 0.35)
    const titleA = this.text(VIZ_BOX.x + 16, RESULT_ROW_Y + 16, 'Lebar Jalur Direkomendasikan', {
      fontStyle: '600',
      fontSize: '12px',
      color: MUTED_TEXT,
    })
    this.recommendedValue = this.mono(VIZ_BOX.x + 16, RESULT_ROW_Y + 38, '', 24, ACCENT_TEXT, true)
    this.recommendedFormula = this.mono(VIZ_BOX.x + 16, RESULT_ROW_Y + 72, '', 12, MUTED_TEXT, false)

    this.minBadgeGfx = scene.add.graphics()
    this.minBadgeText = this.text(0, 0, `batas minimum ${MIN_RECOMMENDED_WIDTH} mm`, {
      fontStyle: '700',
      fontSize: '10px',
      color: ACCENT_TEXT,
    }).setOrigin(1, 0.5)

    // Card B — evaluation
    this.evalCardGfx = scene.add.graphics()
    const titleB = this.text(CARD_B_X + 22, RESULT_ROW_Y + 16, 'Evaluasi Lebar Jalur', {
      fontStyle: '600',
      fontSize: '12px',
      color: MUTED_TEXT,
    })
    const capA = this.text(CARD_B_X + 22, RESULT_ROW_Y + 44, 'Direkomendasikan', { fontSize: '10px', color: MUTED_TEXT })
    this.evalRecommended = this.mono(CARD_B_X + 22, RESULT_ROW_Y + 60, '', 16, ACCENT_TEXT, true)
    const capB = this.text(CARD_B_X + 143.84, RESULT_ROW_Y + 44, 'Aktual', { fontSize: '10px', color: MUTED_TEXT })
    this.evalActual = this.mono(CARD_B_X + 143.84, RESULT_ROW_Y + 60, '', 16, '#2c6b44', true)

    this.evalMessageGfx = scene.add.graphics()
    this.evalMessageGlyph = this.text(CARD_B_X + 32, RESULT_ROW_Y + 142, '', {
      fontStyle: '700',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5)
    this.evalMessage = this.text(CARD_B_X + 50, RESULT_ROW_Y + 134, '', {
      fontStyle: '600',
      fontSize: '12px',
      color: '#2c6b44',
    })

    group.add([
      cardA,
      titleA,
      this.recommendedValue,
      this.recommendedFormula,
      this.minBadgeGfx,
      this.minBadgeText,
      this.evalCardGfx,
      titleB,
      capA,
      this.evalRecommended,
      capB,
      this.evalActual,
      this.evalMessageGfx,
      this.evalMessageGlyph,
      this.evalMessage,
    ])
    return group
  }

  // ---------------------------------------------------------------------
  // State changes
  // ---------------------------------------------------------------------

  private setUnit(unit: PowerUnit) {
    if (this.input.unit === unit) return
    // The reading is rescaled, not reset: 64600 mW comes back as 64.6 W, so
    // the calculated current is identical either side of the toggle.
    this.input.power = convertPower(this.input.power, this.input.unit, unit)
    this.input.unit = unit
    this.powerSlider.setRange(POWER_RANGE[unit], this.input.power)
    this.refresh()
  }

  private setCopper(thickness: CopperThickness) {
    if (this.input.copper === thickness) return
    this.input.copper = thickness
    this.refresh()
  }

  // ---------------------------------------------------------------------
  // Repaint — one pass over every derived value, run on any input change.
  // ---------------------------------------------------------------------

  private refresh() {
    const result = evaluate(this.input)
    const style = STATUS_STYLE[result.status]

    this.paintUnitToggle()
    this.paintCopperControls()
    this.paintMeasureSwitch()

    this.currentValue.setText(`${result.current.toFixed(3)} A`)
    this.currentFormulaText.setText(currentFormula(this.input))

    this.paintTrace(style)
    this.paintBadge(style)
    this.paintResultCards(result.recommendedWidth, result.clamped, style)
    this.recommendedFormula.setText(widthFormula(this.input, result))
    this.onStatusSettled(result.status, style)
  }

  private paintUnitToggle() {
    this.unitSegments.forEach(({ gfx, text }, unit) => {
      const active = this.input.unit === unit
      const rect = gfx.getData('rect') as { x: number; y: number; width: number; height: number; radius: Phaser.Types.GameObjects.Graphics.RoundedRectRadius }
      gfx.clear()
      if (active) gfx.fillStyle(ACCENT, 1).fillRoundedRect(rect.x, rect.y, rect.width, rect.height, rect.radius)
      text.setColor(active ? '#ffffff' : MUTED_TEXT)
    })
  }

  private paintCopperControls() {
    this.copperSegments.forEach(({ gfx, bar, text }, thickness) => {
      const active = this.input.copper === thickness
      const barHeight = COPPER_BAND_HEIGHT[thickness]
      const halfW = SEGMENT_WIDTH / 2
      const halfH = SEGMENT_HEIGHT / 2

      gfx.clear()
      if (active) gfx.fillStyle(ACCENT, 1).fillRoundedRect(-halfW, -halfH, SEGMENT_WIDTH, SEGMENT_HEIGHT, 8)
      gfx.lineStyle(2, active ? ACCENT : MUTED, active ? 1 : 0.4).strokeRoundedRect(-halfW + 1, -halfH + 1, SEGMENT_WIDTH - 2, SEGMENT_HEIGHT - 2, 8)

      // Copper band: 2/4/7px tall, top-aligned at the button's 10px inset so
      // the label below always sits 6px under the band, exactly as authored.
      bar.clear()
        .fillStyle(active ? GOLD : COPPER, active ? 1 : 0.8)
        .fillRoundedRect(-12, -halfH + 10, 24, barHeight, 1)
      text.setColor(active ? '#ffffff' : MUTED_TEXT).setPosition(0, -halfH + 10 + barHeight + 6)
    })

    const factor = COPPER_FACTOR[this.input.copper]
    this.copperTitle.setText(COPPER_LABEL[this.input.copper])
    this.copperFactorText.setText(`Faktor koreksi: ×${formatFactor(factor)}`)
    this.paintCrossSection()
  }

  /**
   * The CopperCrossSection illustration, redrawn per thickness. Figma only
   * carries the 2 oz variant as a flat SVG, so the substrate/copper/highlight
   * geometry is reproduced here with that file's own colours and the copper
   * band scaled by the selected thickness.
   */
  private paintCrossSection() {
    const band = COPPER_BAND_HEIGHT[this.input.copper] * 1.7
    const substrateTop = 17.43
    const copperTop = substrateTop - band

    this.crossSection
      .clear()
      .fillStyle(MUTED, 0.25)
      .fillRoundedRect(6.86, substrateTop, 96, 34.29, 2.5)
      .lineStyle(1, MUTED, 0.6)
      .strokeRoundedRect(6.86, substrateTop, 96, 34.29, 2.5)
      .fillStyle(COPPER, 1)
      .fillRoundedRect(6.86, copperTop, 96, band, 1.7)
      .fillStyle(COPPER_HIGHLIGHT, 0.7)
      .fillRoundedRect(8.57, copperTop + 0.9, 92.57, Math.max(band * 0.35, 1.2), 0.9)
      // Caliper tick marking the copper layer's height, as in the source SVG.
      .lineStyle(1.3, ACCENT, 1)
      .lineBetween(109.71, copperTop, 109.71, substrateTop)
  }

  private paintMeasureSwitch() {
    // Knob travels between the two 4px insets of the 40px track (local -20..20).
    const knobX = this.showMeasure ? 8 : -8

    this.switchGfx
      .clear()
      .fillStyle(this.showMeasure ? ACCENT : MUTED, this.showMeasure ? 1 : 0.5)
      .fillRoundedRect(-20, -12, 40, 24, 12)
      .fillStyle(0x000000, 0.12)
      .fillCircle(knobX, 1, 8)
      .fillStyle(0xffffff, 1)
      .fillCircle(knobX, 0, 8)
  }

  // ---------------------------------------------------------------------
  // Trace preview
  // ---------------------------------------------------------------------

  /** Trace thickness follows the learner's own width slider, never the recommendation. */
  private paintTrace(style: StatusStyle) {
    const thickness = Math.max(this.input.actualWidth * TRACE_PX_PER_MM, 2)
    const top = TRACE_CENTER_Y - thickness / 2
    const left = TRACE_CENTER_X - TRACE_HALF_LENGTH
    const length = TRACE_HALF_LENGTH * 2

    // Blur stand-in: three progressively larger, fainter rounded rects.
    this.traceGlow.clear()
    ;[
      { spread: 12, alpha: 0.12 },
      { spread: 7, alpha: 0.18 },
      { spread: 3, alpha: 0.22 },
    ].forEach(({ spread, alpha }) => {
      this.traceGlow
        .fillStyle(style.trace, alpha)
        .fillRoundedRect(left - spread, top - spread, length + spread * 2, thickness + spread * 2, 3 + spread)
    })

    this.traceGfx
      .clear()
      .fillStyle(style.trace, 1)
      .fillRoundedRect(left, top, length, thickness, 3)
      .fillStyle(style.highlight, 0.6)
      .fillRoundedRect(left + 4, top + 2, length - 8, Math.max(thickness * HIGHLIGHT_RATIO, 1), 2)

    // Pads sit at the trace's two ends and take the status colour with it.
    ;[left, left + length].forEach((padX) => {
      this.traceGfx
        .fillStyle(style.trace, 1)
        .fillCircle(padX, TRACE_CENTER_Y, PAD_RADIUS)
        .lineStyle(2, PAD_CORE, 0.35)
        .strokeCircle(padX, TRACE_CENTER_Y, 27.73)
        .fillStyle(PAD_CORE, 1)
        .fillCircle(padX, TRACE_CENTER_Y, 14.64)
    })

    this.paintMeasure(style, top, thickness)
  }

  /** The 64x20 width chip on the trace plus its dimension line, gated on the "Ukuran" switch. */
  private paintMeasure(style: StatusStyle, top: number, thickness: number) {
    this.measureLabel.setVisible(this.showMeasure)
    if (!this.showMeasure) return

    const label = `${this.input.actualWidth.toFixed(2)}mm`
    this.measureLabel.setText(label).setColor(`#${style.trace.toString(16).padStart(6, '0')}`)

    const chipWidth = Math.max(this.measureLabel.width + 20, 64)
    const bottom = top + thickness
    const chipHalf = 10

    this.traceGfx
      .lineStyle(2, style.highlight, 0.9)
      .lineBetween(TRACE_CENTER_X - 8, top, TRACE_CENTER_X + 8, top)
      .lineBetween(TRACE_CENTER_X - 8, bottom, TRACE_CENTER_X + 8, bottom)
    if (thickness > 44) {
      this.traceGfx
        .lineBetween(TRACE_CENTER_X, top, TRACE_CENTER_X, TRACE_CENTER_Y - chipHalf)
        .lineBetween(TRACE_CENTER_X, TRACE_CENTER_Y + chipHalf, TRACE_CENTER_X, bottom)
    }

    this.traceGfx
      .fillStyle(PAD_CORE, 1)
      .fillRoundedRect(TRACE_CENTER_X - chipWidth / 2, TRACE_CENTER_Y - chipHalf, chipWidth, 20, 5)
  }

  private paintBadge(style: StatusStyle) {
    this.badgeLabel.setText(style.badgeLabel).setColor(style.badgeText)
    this.badgeGlyph.setText(style.glyph)

    const width = 12 + 16 + 8 + this.badgeLabel.width + 12
    const left = TRACE_CENTER_X - width / 2

    this.badgeGfx
      .clear()
      .fillStyle(BADGE_BACKDROP, 0.45)
      .fillRoundedRect(left, BADGE_CENTER_Y - 15, width, 30, 8)
      .lineStyle(1, style.trace, 1)
      .strokeRoundedRect(left, BADGE_CENTER_Y - 15, width, 30, 8)
      .fillStyle(style.trace, 1)
      .fillCircle(left + 12 + 8, BADGE_CENTER_Y, 8)

    this.badgeGlyph.setPosition(left + 12 + 8, BADGE_CENTER_Y)
    this.badgeLabel.setPosition(left + 12 + 16 + 8, BADGE_CENTER_Y)
  }

  // ---------------------------------------------------------------------
  // Result cards
  // ---------------------------------------------------------------------

  private paintResultCards(recommended: number, clamped: boolean, style: StatusStyle) {
    this.recommendedValue.setText(`${recommended.toFixed(3)} mm`)

    this.minBadgeGfx.clear()
    this.minBadgeText.setVisible(clamped)
    if (clamped) {
      const right = VIZ_BOX.x + CARD_A_WIDTH - 16
      const centerY = RESULT_ROW_Y + 50
      const width = this.minBadgeText.width + 20
      this.minBadgeGfx
        .fillStyle(ACCENT, 0.12)
        .fillRoundedRect(right - width, centerY - 11, width, 22, 11)
      this.minBadgeText.setPosition(right - 10, centerY)
    }

    // Card B: cream body with a 6px status-coloured spine down its left edge.
    this.evalCardGfx
      .clear()
      .fillStyle(ACCENT, 0.35)
      .fillRoundedRect(CARD_B_X, RESULT_ROW_Y + 4, CARD_B_WIDTH, RESULT_ROW_HEIGHT, PANEL_RADIUS)
      .fillStyle(style.trace, 1)
      .fillRoundedRect(CARD_B_X, RESULT_ROW_Y, CARD_B_WIDTH, RESULT_ROW_HEIGHT, PANEL_RADIUS)
      .fillStyle(CARD_CREAM, 1)
      .fillRoundedRect(CARD_B_X + 6, RESULT_ROW_Y, CARD_B_WIDTH - 6, RESULT_ROW_HEIGHT, { tl: 0, bl: 0, tr: PANEL_RADIUS, br: PANEL_RADIUS })
      .fillStyle(MUTED, 0.3)
      .fillRect(CARD_B_X + 126.84, RESULT_ROW_Y + 44, 1, 40)

    this.evalRecommended.setText(`${recommended.toFixed(2)} mm`)
    this.evalActual.setText(`${this.input.actualWidth.toFixed(2)} mm`).setColor(style.evalText)

    this.evalMessageGfx
      .clear()
      .fillStyle(style.trace, 1)
      .fillCircle(CARD_B_X + 32, RESULT_ROW_Y + 142, 10)
    this.evalMessageGlyph.setText(style.glyph)
    this.evalMessage.setText(style.message).setColor(style.evalText)
  }

  /**
   * Everything that fires on a *change* of verdict rather than on every repaint:
   * the status sting, and the breathing glow danger alone gets. Both are gated
   * on `lastStatus`, so the first paint of the panel lands silently.
   */
  private onStatusSettled(status: TraceStatus, style: StatusStyle) {
    if (status === this.lastStatus) return
    const firstPaint = this.lastStatus === null
    this.lastStatus = status
    if (!firstPaint) audio.play(style.sfx)

    this.glowPulse?.remove()
    this.glowPulse = undefined
    this.traceGlow.setAlpha(1)

    if (status !== 'danger') return
    this.glowPulse = this.ctx.scene.tweens.add({
      targets: this.traceGlow,
      alpha: 0.35,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }
}
