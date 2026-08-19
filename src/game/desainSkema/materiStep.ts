import Phaser from 'phaser'
import { DESIGN_WIDTH } from '../stage'
import { coverFit } from '../coverFit'
import {
  buildNextButton,
  CARD_EDGE,
  CARD_FILL,
  CARD_SHADOW_ALPHA,
  FONT_BODY,
  FONT_HEADING,
  TEXT_COLOR,
  TEXT_RESOLUTION,
  FADE_DOWN_STAGGER,
  FADE_DOWN_DURATION,
  fadeDownIn,
  type UiContext,
} from './uiKit'

const INTRO_Y = 176
const INTRO_WIDTH = 1360

/** Materi card entrance: quick stagger, not the slow bubble-in the app uses elsewhere. */
const CARD_IN_STAGGER = 30
const CARD_IN_DURATION = 260
const CARD_IN_BASE_DELAY = FADE_DOWN_STAGGER * 4 + FADE_DOWN_DURATION

/** Component library, top to bottom: theory content for REQ-EDU-009's LED circuits plus the distractor symbols. */
const COMPONENTS = [
  { texture: 'elec-resistor', label: 'Resistor', desc: 'Membatasi arus listrik yang mengalir dalam rangkaian.' },
  { texture: 'elec-capacitor', label: 'Kapasitor', desc: 'Menyimpan muatan listrik sementara di dalam rangkaian.' },
  { texture: 'elec-diode', label: 'Dioda', desc: 'Mengalirkan arus hanya satu arah, mencegah arus balik.' },
  { texture: 'elec-led', label: 'LED', desc: 'Memancarkan cahaya saat dialiri arus searah dari anoda ke katoda.' },
  { texture: 'elec-ic-chip', label: 'IC (Chip)', desc: 'Sirkuit terpadu yang menjalankan fungsi elektronik kompleks.' },
  { texture: 'elec-battery', label: 'Baterai', desc: 'Sumber tegangan searah yang mengalirkan arus ke seluruh rangkaian.' },
  { texture: 'elec-inductor', label: 'Induktor', desc: 'Menyimpan energi dalam medan magnet saat dialiri arus.' },
  { texture: 'elec-opamp', label: 'Op-Amp', desc: 'Penguat sinyal tegangan untuk pemrosesan analog.' },
  { texture: 'elec-terminal-block', label: 'Terminal Block', desc: 'Titik sambung kabel yang aman dan rapi ke sumber daya.' },
  { texture: 'elec-usb-connector', label: 'Konektor USB', desc: 'Antarmuka daya dan data standar antar perangkat.' },
  { texture: 'elec-pcb-trace', label: 'Jalur PCB', desc: 'Jalur tembaga yang menghubungkan antar komponen di papan.' },
] as const

/** Total delay before the materi grid's entrance stagger clears — the scene uses this to know when input can unlock. */
export const materiEntranceDuration = () => CARD_IN_BASE_DELAY + CARD_IN_STAGGER * (COMPONENTS.length + 1) + CARD_IN_DURATION

const GRID_COLUMNS = 6
const CARD_WIDTH = 280
const CARD_HEIGHT = 300
const CARD_RADIUS = 18
const CARD_GAP_X = 20
const CARD_GAP_Y = 40
const CARD_ICON_BOX = 92
const CARD_ICON_Y = -86
const CARD_LABEL_Y = -14
const CARD_DESC_Y = 24
const CARD_DESC_WIDTH = CARD_WIDTH - 48

const GRID_TOP = 272
const GRID_ROW_HEIGHT = CARD_HEIGHT + CARD_GAP_Y

/** Langkah 1 — the component-symbol reference grid. No teardown needed: nothing it builds outlives a body.removeAll(true). */
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

    const cards = COMPONENTS.map((item, index) => {
      const column = index % GRID_COLUMNS
      const row = Math.floor(index / GRID_COLUMNS)
      const rowCount = Math.ceil(COMPONENTS.length / GRID_COLUMNS)
      const columnsInRow = row === rowCount - 1 ? COMPONENTS.length - row * GRID_COLUMNS : GRID_COLUMNS

      const rowWidth = columnsInRow * CARD_WIDTH + (columnsInRow - 1) * CARD_GAP_X
      const rowLeft = DESIGN_WIDTH / 2 - rowWidth / 2

      const x = rowLeft + column * (CARD_WIDTH + CARD_GAP_X) + CARD_WIDTH / 2
      const y = GRID_TOP + row * GRID_ROW_HEIGHT + CARD_HEIGHT / 2

      const card = this.buildComponentCard(item, x, y)
      body.add(card)
      return card
    })

    const next = buildNextButton(this.ctx, true, onNext)
    body.add(next)

    if (entrance) this.playCardsIn([...cards, next])
  }

  /** Quick staggered pop-in for the materi grid — much shorter than the app's shared bubble entrance. */
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
        'Sebelum mulai merancang, kenali dulu simbol-simbol komponen dasar yang dipakai dalam skema elektronika. ' +
          'Simbol ini mengikuti standar internasional IEC/ANSI, sehingga gambar teknikmu bisa dibaca oleh siapa pun.',
        {
          fontFamily: FONT_BODY,
          fontStyle: '500',
          fontSize: '22px',
          color: TEXT_COLOR,
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: INTRO_WIDTH },
          resolution: TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5, 0)
  }

  private buildComponentCard(item: (typeof COMPONENTS)[number], x: number, y: number) {
    const scene = this.ctx.scene
    const halfWidth = CARD_WIDTH / 2
    const halfHeight = CARD_HEIGHT / 2

    const card = scene.add
      .graphics()
      .fillStyle(0x000000, CARD_SHADOW_ALPHA)
      .fillRoundedRect(-halfWidth + 3, -halfHeight + 4, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)
      .fillStyle(CARD_FILL, 1)
      .fillRoundedRect(-halfWidth, -halfHeight, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)
      .lineStyle(2, CARD_EDGE, 1)
      .strokeRoundedRect(-halfWidth, -halfHeight, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS)

    const icon = coverFit(scene.add.image(0, CARD_ICON_Y, item.texture), CARD_ICON_BOX, CARD_ICON_BOX)

    const label = scene.add
      .text(0, CARD_LABEL_Y, item.label, {
        fontFamily: FONT_HEADING,
        fontStyle: '700',
        fontSize: '24px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    const desc = scene.add
      .text(0, CARD_DESC_Y, item.desc, {
        fontFamily: FONT_BODY,
        fontStyle: '500',
        fontSize: '17px',
        color: TEXT_COLOR,
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: CARD_DESC_WIDTH },
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)

    return scene.add.container(x, y, [card, icon, label, desc])
  }
}
