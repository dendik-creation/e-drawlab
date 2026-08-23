import Phaser from 'phaser'
import { DESIGN_WIDTH } from '../stage'
import { containFit } from '../coverFit'
import {
  buildNextButton,
  FONT_BODY,
  FONT_HEADING,
  FONT_MONO,
  TEXT_COLOR,
  TEXT_RESOLUTION,
  FADE_DOWN_STAGGER,
  FADE_DOWN_DURATION,
  fadeDownIn,
  type UiContext,
} from '../desainSkema/uiKit'

/** Caption/body colors specific to this Figma frame — different mutes than uiKit's shared MUTED_TEXT_COLOR. */
const BODY_TEXT = '#3d4a4d'
const MUTED_TEXT = '#66878e'
const CARD_BORDER = 0x0c6179
const CARD_BORDER_ALPHA = 0.12
const CARD_SHADOW_ALPHA = 0.06
/** The illustration panel's own fill — matches the scene's `home_gradient`-style page background, not uiKit's CARD_FILL. */
const PANEL_FILL = 0xfaf3e7
const DARK_FILL = 0x0c6179
const DARK_TEXT = '#faf3e7'
const GOLD_TEXT = '#fddc6c'
const CHIP_FILL = 0xffffff
const CHIP_FILL_ALPHA = 0.12

const INTRO_Y = 179
const INTRO_WIDTH = 1490

/** Three-up diagram grid: sliced from Figma's "Container" 139:305 — a 1573px row centered on the design frame. */
const ROW_WIDTH = 1573
const ROW_LEFT = (DESIGN_WIDTH - ROW_WIDTH) / 2
const ROW_TOP = 309
const CARD_GAP = 21
const CARD_WIDTH = (ROW_WIDTH - CARD_GAP * 2) / 3
const CARD_HEIGHT = 438
const CARD_RADIUS = 23
const CARD_PADDING = 21
/** Every card's illustration panel starts at the same offset below the card's title, regardless of the diagram's own aspect ratio. */
const PANEL_TOP = 60
const PANEL_WIDTH = CARD_WIDTH - CARD_PADDING * 2

const FORMULA_TOP = 768
const FORMULA_HEIGHT = 135
const FORMULA_RADIUS = 21
const FORMULA_PADDING_X = 28
const FORMULA_PADDING_Y = 17
const FORMULA_ROW_GAP = 11
const FORMULA_DIVIDER_ALPHA = 0.12
const CHIP_PADDING_X = 10
const CHIP_PADDING_Y = 4
const CHIP_RADIUS = 9
const CHIP_GAP = 7

/** Materi card/formula entrance: quick stagger, matching DesainSkema's materiStep pacing. */
const CARD_IN_STAGGER = 30
const CARD_IN_DURATION = 260
const CARD_IN_BASE_DELAY = FADE_DOWN_STAGGER * 4 + FADE_DOWN_DURATION

/** Total delay before this step's entrance stagger clears — the scene uses this to know when input can unlock. */
export const materiEntranceDuration = () => CARD_IN_BASE_DELAY + CARD_IN_STAGGER * (DIAGRAMS.length + 1) + CARD_IN_DURATION

/** The three DiagramCards, left to right — sliced from Figma's "DiagramCard" nodes 139:306/343/378. */
const DIAGRAMS = [
  {
    texture: 'cad-casing-compare',
    panelHeight: 196,
    title: 'Casing Terlalu Ketat vs Ideal',
    caption: 'Casing ideal menyisakan celah merata di semua sisi PCB.',
    body: 'Tanpa celah, PCB sulit dipasang dan berisiko korsleting. Celah merata memberi ruang toleransi yang aman.',
  },
  {
    texture: 'cad-casing-top-view',
    panelHeight: 230,
    title: 'Tampak Atas (X-Y) — Celah & Dinding',
    caption: 'Pandangan orthografis dari atas: PCB, celah samping, lalu dinding casing.',
    body: 'Ukuran X-Y = ukuran PCB + 2× celah samping + 2× tebal dinding. Celah memberi toleransi dan akses solder di tepi papan.',
  },
  {
    texture: 'cad-casing-side-view',
    panelHeight: 282,
    title: 'Tampak Samping (X-Z) — Lapisan Vertikal',
    caption: 'Penampang samping: pilar, PCB, komponen, dan celah bebas di atasnya.',
    body: 'Standoff menjaga sisi bawah PCB tidak menyentuh casing, sementara celah bebas atas memberi ventilasi dan ruang kabel.',
  },
] as const

/** One row of the FormulaBand: a bold label, then `term = term + term…` chips — sliced from Figma's "FormulaBand" node 139:439. */
const FORMULA_ROWS = [
  { label: 'Dimensi X / Y Casing', terms: ['Dimensi PCB', '2 × Celah Samping', '2 × Tebal Dinding'] },
  { label: 'Tinggi Z Casing', terms: ['Tinggi Pilar', 'Tebal PCB', 'Tinggi Komponen Tertinggi', 'Celah Bebas Atas'] },
] as const

/**
 * Langkah 1 — the CAD Casing theory page: an intro paragraph, three
 * illustrated DiagramCards, and a dark FormulaBand recapping the sizing
 * rules. Fits one screen (unlike Jalur PCB's scrolling materi), so this
 * follows DesainSkema's simpler single-screen materiStep shape. No teardown
 * needed: nothing it builds outlives a `body.removeAll(true)`.
 */
export class MateriStep {
  private ctx: UiContext

  constructor(ctx: UiContext) {
    this.ctx = ctx
  }

  render(body: Phaser.GameObjects.Container, entrance: boolean, onNext: () => void) {
    const scene = this.ctx.scene

    const intro = this.buildIntro()
    body.add(intro)
    if (entrance) fadeDownIn(scene, intro, FADE_DOWN_STAGGER * 4)

    const cards = DIAGRAMS.map((item, index) => {
      const x = ROW_LEFT + index * (CARD_WIDTH + CARD_GAP)
      const card = this.buildDiagramCard(item, x, ROW_TOP)
      body.add(card)
      return card
    })

    const formula = this.buildFormulaBand()
    body.add(formula)

    const next = buildNextButton(this.ctx, true, onNext)
    body.add(next)

    if (entrance) this.playCardsIn([...cards, formula, next])
  }

  /** Quick staggered pop-in, matching DesainSkema's materiStep grid. */
  private playCardsIn(targets: Phaser.GameObjects.Container[]) {
    const scene = this.ctx.scene
    targets.forEach((target, index) => {
      target.setAlpha(0).setScale(0.86)
      scene.tweens.add({
        targets: target,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        delay: CARD_IN_BASE_DELAY + index * CARD_IN_STAGGER,
        duration: CARD_IN_DURATION,
        ease: 'Back.easeOut',
      })
    })
  }

  private buildIntro() {
    return this.ctx.scene.add
      .text(
        DESIGN_WIDTH / 2,
        INTRO_Y,
        'Casing melindungi PCB dari debu dan kontak listrik yang tidak di inginkan. Namun casing tidak boleh berukuran sama ' +
          'persis dengan PCB. Selalu diperlukan ruang toleransi di sekelilingnya. Ukuran casing yang ideal mempertimbangkan ' +
          'dimensi PCB, celah di sekeliling papan, tebal, tinggi komponen, serta ruang untuk sirkulasi udara dan jalur kabel.',
        {
          fontFamily: FONT_BODY,
          fontStyle: '600',
          fontSize: '20px',
          color: TEXT_COLOR,
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: INTRO_WIDTH },
          resolution: TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5, 0)
  }

  private buildDiagramCard(item: (typeof DIAGRAMS)[number], x: number, y: number) {
    const scene = this.ctx.scene

    const bg = scene.add
      .graphics()
      .fillStyle(0x000000, CARD_SHADOW_ALPHA)
      .fillRoundedRect(1, 3, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)
      .lineStyle(2, CARD_BORDER, CARD_BORDER_ALPHA)
      .strokeRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)

    const title = scene.add.text(CARD_PADDING, CARD_PADDING, item.title, {
      fontFamily: FONT_HEADING,
      fontStyle: '700',
      fontSize: '21px',
      color: TEXT_COLOR,
      wordWrap: { width: PANEL_WIDTH },
      resolution: TEXT_RESOLUTION,
    })

    const panel = scene.add
      .graphics()
      .fillStyle(PANEL_FILL, 1)
      .fillRoundedRect(CARD_PADDING, PANEL_TOP, PANEL_WIDTH, item.panelHeight, 16)

    const illustration = containFit(
      scene.add.image(CARD_PADDING + PANEL_WIDTH / 2, PANEL_TOP + item.panelHeight / 2, item.texture),
      PANEL_WIDTH - 28,
      item.panelHeight - 28,
    )

    const captionY = PANEL_TOP + item.panelHeight + 7
    const caption = scene.add
      .text(CARD_WIDTH / 2, captionY, item.caption, {
        fontFamily: FONT_BODY,
        fontStyle: 'italic 500',
        fontSize: '11.5px',
        color: MUTED_TEXT,
        align: 'center',
        wordWrap: { width: PANEL_WIDTH },
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)

    const body = scene.add.text(CARD_PADDING, captionY + caption.height + 10, item.body, {
      fontFamily: FONT_BODY,
      fontStyle: '500',
      fontSize: '13.5px',
      color: BODY_TEXT,
      lineSpacing: 5,
      wordWrap: { width: PANEL_WIDTH },
      resolution: TEXT_RESOLUTION,
    })

    return scene.add.container(x, y, [bg, title, panel, illustration, caption, body])
  }

  /** Dark recap band under the diagram row — one row per sizing formula, each a label plus `term (+ term)…` chips. */
  private buildFormulaBand() {
    const scene = this.ctx.scene

    const bg = scene.add.graphics().fillStyle(DARK_FILL, 1).fillRoundedRect(0, 0, ROW_WIDTH, FORMULA_HEIGHT, FORMULA_RADIUS)

    const rowHeight = (FORMULA_HEIGHT - FORMULA_PADDING_Y * 2 - FORMULA_ROW_GAP) / 2
    const rows = FORMULA_ROWS.map((row, index) => this.buildFormulaRow(row, FORMULA_PADDING_Y + index * (rowHeight + FORMULA_ROW_GAP), rowHeight))

    const divider = scene.add
      .graphics()
      .fillStyle(0xffffff, FORMULA_DIVIDER_ALPHA)
      .fillRect(FORMULA_PADDING_X, FORMULA_PADDING_Y + rowHeight + FORMULA_ROW_GAP / 2 - 0.5, ROW_WIDTH - FORMULA_PADDING_X * 2, 1)

    return scene.add.container(ROW_LEFT, FORMULA_TOP, [bg, ...rows, divider])
  }

  private buildFormulaRow(row: (typeof FORMULA_ROWS)[number], y: number, rowHeight: number) {
    const scene = this.ctx.scene
    const centerY = y + rowHeight / 2
    const parts: Phaser.GameObjects.GameObject[] = []

    const label = scene.add
      .text(FORMULA_PADDING_X, centerY, row.label, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '17px',
        color: GOLD_TEXT,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)
    parts.push(label)

    let cursor = FORMULA_PADDING_X + 150 + CHIP_GAP

    const equals = scene.add
      .text(cursor, centerY, '=', {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '18px',
        color: DARK_TEXT,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)
    parts.push(equals)
    cursor += equals.width + CHIP_GAP

    row.terms.forEach((term, index) => {
      if (index > 0) {
        const plus = scene.add
          .text(cursor, centerY, '+', {
            fontFamily: FONT_HEADING,
            fontStyle: '800',
            fontSize: '18px',
            color: GOLD_TEXT,
            resolution: TEXT_RESOLUTION,
          })
          .setOrigin(0, 0.5)
        parts.push(plus)
        cursor += plus.width + CHIP_GAP
      }

      const label = scene.add
        .text(0, 0, term, {
          fontFamily: FONT_MONO,
          fontStyle: '500',
          fontSize: '14px',
          color: DARK_TEXT,
          resolution: TEXT_RESOLUTION,
        })
        .setOrigin(0, 0)

      const chipWidth = label.width + CHIP_PADDING_X * 2
      const chipHeight = label.height + CHIP_PADDING_Y * 2
      const chipBg = scene.add.graphics().fillStyle(CHIP_FILL, CHIP_FILL_ALPHA).fillRoundedRect(0, 0, chipWidth, chipHeight, CHIP_RADIUS)
      label.setPosition(CHIP_PADDING_X, CHIP_PADDING_Y)

      const chip = scene.add.container(cursor, centerY - chipHeight / 2, [chipBg, label])
      parts.push(chip)
      cursor += chipWidth + CHIP_GAP
    })

    return scene.add.container(0, 0, parts)
  }
}
