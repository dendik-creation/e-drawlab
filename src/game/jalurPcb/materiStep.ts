import Phaser from 'phaser'
import { DESIGN_WIDTH } from '../stage'
import { containFit } from '../coverFit'
import {
  attachButtonBehaviour,
  fadeDownIn,
  BORDER_COLOR,
  TEXT_COLOR,
  FONT_HEADING,
  FONT_BODY,
  TEXT_RESOLUTION,
  FADE_DOWN_STAGGER,
  FADE_DOWN_DURATION,
  type UiContext,
} from '../desainSkema/uiKit'

/** Body copy color used throughout this design slice — darker than TEXT_COLOR, lighter than pure black. */
const BODY_TEXT = '#123c46'
/** Caption/meta color — a different muted teal than uiKit's MUTED_TEXT_COLOR, specific to this Figma frame. */
const MUTED_TEXT = '#66878e'
/** Matches the scene's own `cameras.main.setBackgroundColor('#faf3e7')`. */
const PAGE_BACKGROUND = 0xfaf3e7
const DARK_FILL = 0x0c6179
const DARK_TEXT = '#faf3e7'
const CARD_BORDER = 0x66878e
const CARD_BORDER_ALPHA = 0.2
const SOFT_FILL_ALPHA = 0.05

/** Content column: matches the Figma "Main Content" frame's own 1096px inner width, centered on the design frame. */
const CONTENT_WIDTH = 1096
const SECTION_LEFT = DESIGN_WIDTH / 2 - CONTENT_WIDTH / 2

/** Scrollable viewport: below the header chrome, above the footer's Lanjut corner. */
const VIEWPORT_TOP = 192
const VIEWPORT_BOTTOM = 992
const VIEWPORT_HEIGHT = VIEWPORT_BOTTOM - VIEWPORT_TOP

/** Section entrance: same fade+slide-down language as the header, staggered per section. */
const SECTION_IN_BASE_DELAY = FADE_DOWN_STAGGER * 4 + FADE_DOWN_DURATION
const SECTION_IN_STAGGER = 70
const SECTION_COUNT = 9

/** Total delay before the last section's entrance clears — the scene uses this to know when input can unlock. */
export const materiEntranceDuration = () => SECTION_IN_BASE_DELAY + SECTION_IN_STAGGER * (SECTION_COUNT - 1) + FADE_DOWN_DURATION

/** How close to the bottom counts as "read to the end" — the content's last pixel rarely lines up exactly with the viewport's. */
const SCROLL_BOTTOM_EPSILON = 4
/** Wheel and drag feel roughly identical in speed; wheel deltas are just bigger per tick. */
const WHEEL_SCROLL_FACTOR = 0.6

/**
 * Extra slack (px, content space) kept visible past the viewport edge when
 * culling off-screen sections — a fast wheel/drag tick can move several
 * hundred px in one update, so this keeps the next section from popping in
 * a frame late.
 */
const CULL_MARGIN = 250

const NEXT_BUTTON_WIDTH = 220
const NEXT_BUTTON_HEIGHT = 68
const NEXT_BUTTON_RADIUS = 16
const NEXT_BUTTON_X = DESIGN_WIDTH - 180
const NEXT_BUTTON_Y = 1006

/** One content section's authored position within the scrollable column, taken straight from the Figma frame. */
interface SectionSpec {
  y: number
  build: (scene: Phaser.Scene) => Phaser.GameObjects.Container
}

/** A rendered section's vertical span in `scrollLayer`-local space, used to cull it while off-screen. */
interface SectionBounds {
  container: Phaser.GameObjects.Container
  top: number
  bottom: number
}

/**
 * Langkah 1 — the Jalur PCB theory page. Long-form scrollable content (the
 * Figma frame is ~3600px tall against a 1080px viewport), so unlike
 * DesainSkema's materi grid this owns a scroll offset, a geometry mask, and a
 * footer button gated on having scrolled to the bottom.
 *
 * The mask is a WebGL Filter mask (Phaser 4 has no WebGL-capable
 * GeometryMask — see layoutPalette's note in workbenchStep.ts), which
 * composites its masked subtree through an offscreen render target every
 * frame it's drawn. Phaser containers don't cull their own off-screen
 * children, so without `updateSectionCulling` all nine sections' worth of
 * Text/Image objects would sit in that offscreen pass on every single frame
 * this step is on screen, not just while actively scrolling — hence
 * `sectionBounds`/`updateSectionCulling` toggling `visible` on whatever's
 * currently outside the viewport.
 */
export class MateriStep {
  private ctx: UiContext
  private scrollLayer!: Phaser.GameObjects.Container
  private dragZone!: Phaser.GameObjects.Zone
  private maxScroll = 0
  private dragging = false
  private dragStartPointerY = 0
  private dragStartScrollY = 0
  private reachedBottom = false
  private onPointerMove?: (pointer: Phaser.Input.Pointer) => void
  private onPointerUp?: () => void
  /** Pure geometry source for the scroll mask — deliberately never added to the display list, so it needs its own destroy. */
  private maskShape?: Phaser.GameObjects.Graphics
  private nextBg!: Phaser.GameObjects.Graphics
  private nextLabel!: Phaser.GameObjects.Text
  private nextEnabled = false
  private onWheel?: (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[], dx: number, dy: number, dz: number) => void
  /** Each section's vertical span, for `updateSectionCulling`. */
  private sectionBounds: SectionBounds[] = []

  constructor(ctx: UiContext) {
    this.ctx = ctx
  }

  render(body: Phaser.GameObjects.Container, entrance: boolean, onNext: () => void) {
    const scene = this.ctx.scene
    const sections = this.buildSections()
    const contentHeight = sections[sections.length - 1].y + LAST_SECTION_HEIGHT

    this.scrollLayer = scene.add.container(0, VIEWPORT_TOP)
    const sectionTargets = sections.map((section) => {
      const built = section.build(scene)
      built.setPosition(SECTION_LEFT, section.y)
      this.scrollLayer.add(built)
      return built
    })

    this.sectionBounds = sections.map((section, i) => ({
      container: sectionTargets[i],
      top: section.y,
      bottom: sections[i + 1]?.y ?? section.y + LAST_SECTION_HEIGHT,
    }))

    // Phaser 4's WebGL renderer doesn't support the old Components.Mask
    // (setMask/createGeometryMask) — it silently no-ops there and warns "not
    // supported in WebGL", so scrolled content was bleeding past the viewport
    // uncapped. Filter Mask is the WebGL-correct replacement — see
    // workbenchStep.ts's layoutPalette for the same fix with the fuller
    // rationale.
    this.maskShape = scene.make.graphics({}).fillStyle(0xffffff, 1).fillRect(0, VIEWPORT_TOP, DESIGN_WIDTH, VIEWPORT_HEIGHT)
    this.scrollLayer.enableFilters()
    this.scrollLayer.filters!.internal.addMask(this.maskShape)

    this.maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT)

    this.dragZone = scene.add.zone(DESIGN_WIDTH / 2, VIEWPORT_TOP + VIEWPORT_HEIGHT / 2, DESIGN_WIDTH, VIEWPORT_HEIGHT)
    this.dragZone.setInteractive({ useHandCursor: false })
    this.bindScrollInput()

    const next = this.buildNextButton(onNext)

    // Belt-and-suspenders on top of the geometry mask: an opaque band, painted
    // in front of the scroll layer, over the strip between the page top and
    // the viewport — so a scrolled-past section can never bleed up into the
    // header regardless of mask edge cases.
    const topGuard = scene.add.graphics().fillStyle(PAGE_BACKGROUND, 1).fillRect(0, 0, DESIGN_WIDTH, VIEWPORT_TOP)

    // `maskShape` is deliberately never added to the display list — `scene.make`
    // (unlike `scene.add`) skips that step, so it stays a pure geometry source
    // for the mask instead of painting a solid rectangle over the viewport.
    body.add([this.scrollLayer, topGuard, this.dragZone, next])

    // Content that already fits without scrolling counts as "read" immediately.
    if (this.maxScroll <= 0) this.setNextEnabled(true)

    if (entrance) this.playSectionsIn(sectionTargets)

    // Hide whatever's below the first screenful before the very first render
    // — otherwise all nine sections sit in the mask's offscreen pass from
    // frame one, entrance animation or not.
    this.updateSectionCulling()
  }

  /**
   * Toggles `visible` on each section based on whether it currently
   * intersects the viewport. A GameObject with `visible = false` is skipped
   * entirely by the renderer — including the WebGL Filter mask's offscreen
   * composite pass — so this is what keeps that pass to roughly one or two
   * sections' worth of Text/Image objects instead of all nine regardless of
   * scroll position.
   */
  private updateSectionCulling() {
    const offsetY = this.scrollLayer.y
    const viewTop = VIEWPORT_TOP - CULL_MARGIN
    const viewBottom = VIEWPORT_BOTTOM + CULL_MARGIN

    this.sectionBounds.forEach(({ container, top, bottom }) => {
      container.visible = offsetY + bottom >= viewTop && offsetY + top <= viewBottom
    })
  }

  /** Removes the scene-level input listeners this step binds outside the display list — everything else dies with `body.removeAll(true)`. */
  teardown() {
    const input = this.ctx.scene.input
    if (this.onWheel) input.off('wheel', this.onWheel)
    if (this.onPointerMove) input.off('pointermove', this.onPointerMove)
    if (this.onPointerUp) {
      input.off('pointerup', this.onPointerUp)
      input.off('pointerupoutside', this.onPointerUp)
    }
    this.onWheel = undefined
    this.onPointerMove = undefined
    this.onPointerUp = undefined

    // Clear the filter before destroying its mask source graphic — the
    // reverse order leaves the filter holding a dead GameObject and crashes
    // the next render frame while this step's container is still fading out.
    // Same ordering, same reason, as workbenchStep.ts's palette mask teardown.
    this.scrollLayer?.filters?.internal.clear()
    this.maskShape?.destroy()
    this.maskShape = undefined
  }

  // ---------------------------------------------------------------------
  // Scrolling
  // ---------------------------------------------------------------------

  private bindScrollInput() {
    const scene = this.ctx.scene

    this.dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ctx.isLocked()) return
      this.dragging = true
      this.dragStartPointerY = pointer.y
      this.dragStartScrollY = this.scrollLayer.y
    })

    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging || !pointer.isDown) return
      const delta = pointer.y - this.dragStartPointerY
      this.setScrollY(this.dragStartScrollY + delta)
    }
    scene.input.on('pointermove', this.onPointerMove)

    this.onPointerUp = () => {
      this.dragging = false
    }
    scene.input.on('pointerup', this.onPointerUp)
    scene.input.on('pointerupoutside', this.onPointerUp)

    // Scene-level 'wheel' emits (pointer, currentlyOver, dx, dy, dz) — NOT
    // (pointer, dx, dy). Reading the wrong slot here silently ate every wheel
    // tick, which is why only click-drag ever scrolled anything.
    this.onWheel = (pointer, _currentlyOver, _dx, dy) => {
      if (this.ctx.isLocked()) return
      if (pointer.y < VIEWPORT_TOP || pointer.y > VIEWPORT_BOTTOM) return
      this.setScrollY(this.scrollLayer.y - dy * WHEEL_SCROLL_FACTOR)
    }
    scene.input.on('wheel', this.onWheel)
  }

  private setScrollY(y: number) {
    const min = VIEWPORT_TOP - this.maxScroll
    const max = VIEWPORT_TOP
    this.scrollLayer.y = Phaser.Math.Clamp(y, min, max)
    this.updateSectionCulling()

    if (!this.reachedBottom && this.scrollLayer.y <= min + SCROLL_BOTTOM_EPSILON) {
      this.reachedBottom = true
      this.setNextEnabled(true)
    }
  }

  // ---------------------------------------------------------------------
  // Entrance
  // ---------------------------------------------------------------------

  private playSectionsIn(targets: Phaser.GameObjects.Container[]) {
    const scene = this.ctx.scene
    targets.forEach((target, index) => {
      fadeDownIn(scene, target, SECTION_IN_BASE_DELAY + index * SECTION_IN_STAGGER)
    })
  }

  // ---------------------------------------------------------------------
  // Footer "Lanjut" — gated on reaching the bottom of the materi content
  // ---------------------------------------------------------------------

  private buildNextButton(onPress: () => void) {
    const scene = this.ctx.scene

    this.nextBg = scene.add.graphics()
    this.nextLabel = scene.add
      .text(0, 0, 'Lanjut →', {
        fontFamily: FONT_BODY,
        fontStyle: '700',
        fontSize: '22px',
        color: DARK_TEXT,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    const container = scene.add.container(NEXT_BUTTON_X, NEXT_BUTTON_Y, [this.nextBg, this.nextLabel])
    container.setSize(NEXT_BUTTON_WIDTH, NEXT_BUTTON_HEIGHT)
    this.nextButtonContainer = container
    this.nextPress = onPress

    this.drawNextButton(false)
    return container
  }

  private nextButtonContainer!: Phaser.GameObjects.Container
  private nextPress!: () => void

  private drawNextButton(enabled: boolean) {
    const fill = enabled ? BORDER_COLOR : 0xcfcac0
    const stroke = enabled ? 0x1d6f7c : 0xb9b1a4
    const textColor = enabled ? DARK_TEXT : '#7a8a90'

    this.nextBg
      .clear()
      .fillStyle(fill, 1)
      .fillRoundedRect(-NEXT_BUTTON_WIDTH / 2, -NEXT_BUTTON_HEIGHT / 2, NEXT_BUTTON_WIDTH, NEXT_BUTTON_HEIGHT, NEXT_BUTTON_RADIUS)
      .lineStyle(2, stroke, 1)
      .strokeRoundedRect(-NEXT_BUTTON_WIDTH / 2, -NEXT_BUTTON_HEIGHT / 2, NEXT_BUTTON_WIDTH, NEXT_BUTTON_HEIGHT, NEXT_BUTTON_RADIUS)
    this.nextLabel.setColor(textColor)
  }

  private setNextEnabled(enabled: boolean) {
    if (this.nextEnabled === enabled) return
    this.nextEnabled = enabled
    this.drawNextButton(enabled)

    if (enabled) attachButtonBehaviour(this.ctx, this.nextButtonContainer, this.nextPress)
    else this.nextButtonContainer.disableInteractive()
  }

  // ---------------------------------------------------------------------
  // Section builders — one per "Section" frame in the Figma file, in order.
  // ---------------------------------------------------------------------

  private buildSections(): SectionSpec[] {
    return [
      { y: 0, build: (s) => this.section1(s) },
      { y: 386.25, build: (s) => this.section2(s) },
      { y: 816.421875, build: (s) => this.section3(s) },
      { y: 1222.421875, build: (s) => this.section4(s) },
      { y: 1537.702880859375, build: (s) => this.section5(s) },
      { y: 1915.702880859375, build: (s) => this.section6(s) },
      { y: 2326.702880859375, build: (s) => this.section7(s) },
      { y: 2861.702880859375, build: (s) => this.section8(s) },
      { y: 3251.702880859375, build: (s) => this.section9(s) },
    ]
  }

  private text(scene: Phaser.Scene, x: number, y: number, value: string, opts: Phaser.Types.GameObjects.Text.TextStyle) {
    return scene.add.text(x, y, value, { fontFamily: FONT_BODY, resolution: TEXT_RESOLUTION, ...opts })
  }

  private heading(scene: Phaser.Scene, x: number, y: number, value: string, size: number, opts: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    return scene.add.text(x, y, value, {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: `${size}px`,
      color: TEXT_COLOR,
      resolution: TEXT_RESOLUTION,
      ...opts,
    })
  }

  private sectionTitle(scene: Phaser.Scene, x: number, y: number, value: string, width: number, align: 'left' | 'center' = 'left') {
    return this.heading(scene, x, y, value, 27, {
      align,
      wordWrap: { width },
    }).setOrigin(align === 'center' ? 0.5 : 0, 0)
  }

  private paragraph(
    scene: Phaser.Scene,
    x: number,
    y: number,
    value: string,
    width: number,
    opts: { size?: number; color?: string; align?: 'left' | 'right' | 'center' } = {},
  ) {
    return this.text(scene, x, y, value, {
      fontStyle: '500',
      fontSize: `${opts.size ?? 16}px`,
      color: opts.color ?? BODY_TEXT,
      align: opts.align ?? 'left',
      lineSpacing: 6,
      wordWrap: { width },
    }).setOrigin(opts.align === 'right' ? 1 : opts.align === 'center' ? 0.5 : 0, 0)
  }

  /** White rounded card w/ subtle border + drop shadow — the "AssetPanel" wrapper around every illustration. */
  private assetPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, radius = 16) {
    return scene.add
      .graphics()
      .fillStyle(0x000000, 0.06)
      .fillRoundedRect(x + 1, y + 3, width, height, radius)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(x, y, width, height, radius)
      .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
      .strokeRoundedRect(x, y, width, height, radius)
  }

  private illustration(scene: Phaser.Scene, texture: string, centerX: number, centerY: number, w: number, h: number) {
    return containFit(scene.add.image(centerX, centerY, texture), w, h)
  }

  private icon(scene: Phaser.Scene, texture: string, x: number, y: number, size: number) {
    return scene.add.image(x, y, texture).setDisplaySize(size, size)
  }

  // Section 1 — "Penentuan Lebar Jalur PCB"
  private section1(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)

    const heading = this.heading(scene, 0, 0, 'Penentuan Lebar\nJalur PCB', 40, { align: 'left', lineSpacing: 4 })
    const paragraph = this.paragraph(
      scene,
      0,
      106,
      'Jalur PCB adalah jalur tembaga yang menghubungkan komponen dan membawa arus listrik pada rangkaian. Lebar jalur perlu ditentukan agar mampu membawa arus dengan aman tanpa mengalami pemanasan berlebihan.',
      460,
      { size: 17 },
    )

    const panelX = 572
    const panelW = 524
    const panelH = 290
    const panel = this.assetPanel(scene, panelX, 0, panelW, panelH)
    const img = this.illustration(scene, 'jalur-arus-mengalir', panelX + panelW / 2, panelH / 2, 474, 240)
    const caption = this.text(scene, panelX + panelW / 2, panelH + 12, 'Arus mengalir melalui jalur tembaga pada PCB.', {
      fontStyle: 'italic 500',
      fontSize: '13.5px',
      color: MUTED_TEXT,
    }).setOrigin(0.5, 0)

    c.add([heading, paragraph, panel, img, caption])
    return c
  }

  // Section 2 — "Mengapa Lebar Jalur Penting?"
  private section2(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)

    const title = this.sectionTitle(scene, 0, 0, 'Mengapa Lebar Jalur Penting?', 472)
    const paragraph = this.paragraph(
      scene,
      0,
      46,
      'Semakin besar arus yang mengalir, semakin besar kemampuan penghantaran yang dibutuhkan oleh jalur PCB. Salah satu pendekatan sederhana adalah menggunakan jalur yang lebih lebar.',
      440,
    )

    const cardW = 440
    const cardH = 146
    const cardY = 74 + 28
    const card = scene.add
      .graphics()
      .fillStyle(DARK_FILL, 1)
      .fillRoundedRect(0, cardY, cardW, cardH, 16)
    const cardCenterX = cardW / 2
    const cardLabel1 = this.text(scene, cardCenterX, cardY + 24, 'ARUS MENINGKAT', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '20px',
      color: DARK_TEXT,
    }).setOrigin(0.5, 0)
    const cardIcon = this.icon(scene, 'jalur-icon-trend-up', cardCenterX, cardY + 62, 22).setAlpha(0.85)
    const cardLabel2 = this.text(scene, cardCenterX, cardY + 92, 'KEBUTUHAN LEBAR JALUR MENINGKAT', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '20px',
      color: DARK_TEXT,
      align: 'center',
      wordWrap: { width: 392 },
    }).setOrigin(0.5, 0)

    const panelX = 520
    const panelW = 432
    const panelH = 264
    const panel = this.assetPanel(scene, panelX, 51, panelW, panelH)
    const img = this.illustration(scene, 'jalur-perbandingan-lebar', panelX + panelW / 2, 51 + panelH / 2, 386, 218)

    const legendX = panelX + panelW + 16 + 12
    const legendRows: [string, string, string][] = [
      ['Arus kecil', '0,5 A', '1 mm'],
      ['Arus sedang', '1,5 A', '2,5 mm'],
      ['Arus besar', '3 A', '5 mm'],
    ]
    const legend = legendRows.map(([label, value, sub], i) => {
      const rowY = 71 + i * 80
      const line = scene.add.graphics().lineStyle(2, CARD_BORDER, 0.33).lineBetween(legendX - 12, rowY, legendX - 12, rowY + 64)
      const labelText = this.text(scene, legendX, rowY, label, { fontStyle: '600', fontSize: '12px', color: MUTED_TEXT })
      const valueText = this.heading(scene, legendX, rowY + 18, value, 22)
      const subText = this.text(scene, legendX, rowY + 43, sub, { fontFamily: FONT_HEADING, fontStyle: '700', fontSize: '14px', color: MUTED_TEXT })
      return scene.add.container(0, 0, [line, labelText, valueText, subText])
    })

    c.add([title, paragraph, card, cardLabel1, cardIcon, cardLabel2, panel, img, ...legend])
    return c
  }

  // Section 3 — "Apa yang Membentuk Jalur PCB?"
  private section3(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)
    const title = this.sectionTitle(scene, CONTENT_WIDTH / 2, 0, 'Apa yang Membentuk Jalur PCB?', CONTENT_WIDTH, 'center')

    const rowY = 32 + 98
    const panelX = 307
    const panelW = 482
    const panelH = 278

    const leftLabel = this.text(scene, 275, rowY, 'Lapisan Tembaga', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '18px',
      color: TEXT_COLOR,
      align: 'right',
    }).setOrigin(1, 0)
    const leftIcon = this.icon(scene, 'jalur-icon-copper-layer', 295, rowY + leftLabel.height / 2, 20)
    const leftParagraph = this.paragraph(scene, 275, rowY + 35, 'Bagian penghantar yang membawa arus listrik.', 276, { size: 14.5, align: 'right' })

    const panel = this.assetPanel(scene, panelX, 32, panelW, panelH)
    const img = this.illustration(scene, 'jalur-penampang-pcb', panelX + panelW / 2, 32 + panelH / 2, 424, 220)

    const rightX = panelX + panelW + 32
    const rightLabel = this.text(scene, rightX + 28, rowY, 'Substrat PCB', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '18px',
      color: TEXT_COLOR,
    })
    const rightIcon = this.icon(scene, 'jalur-icon-substrate', rightX, rowY + rightLabel.height / 2, 20)
    const rightParagraph = this.paragraph(scene, rightX, rowY + 35, 'Material dasar tempat lapisan tembaga berada.', 276, { size: 14.5 })

    c.add([title, leftLabel, leftIcon, leftParagraph, panel, img, rightIcon, rightLabel, rightParagraph])
    return c
  }

  // Section 4 — "Faktor yang Memengaruhi Lebar Jalur"
  private section4(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)
    const title = this.sectionTitle(scene, 0, 0, 'Faktor yang Memengaruhi Lebar Jalur', CONTENT_WIDTH)

    const cards = [
      { icon: 'jalur-icon-factor-01', number: '01', label: 'Besarnya Arus', desc: 'Arus yang lebih besar membutuhkan kemampuan penghantaran yang lebih besar.' },
      { icon: 'jalur-icon-factor-02', number: '02', label: 'Ketebalan Tembaga', desc: 'Ketebalan lapisan tembaga memengaruhi kemampuan jalur membawa arus.' },
      { icon: 'jalur-icon-factor-03', number: '03', label: 'Panjang Jalur', desc: 'Panjang jalur perlu diperhatikan dalam desain PCB.' },
      { icon: 'jalur-icon-factor-04', number: '04', label: 'Kemampuan Pembuatan', desc: 'Jalur yang terlalu tipis lebih sulit dibuat pada proses PCB sederhana.' },
    ]

    const cardW = 259
    const cardH = 191.28
    const gap = 20
    const top = 28 + 32

    const built = cards.map((item, i) => {
      const x = i * (cardW + gap)
      const bg = scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(x, top, cardW, cardH, 12)
        .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
        .strokeRoundedRect(x, top, cardW, cardH, 12)

      const badge = scene.add.graphics().fillStyle(DARK_FILL, 1).fillRoundedRect(x + 20, top + 20, 38, 38, 8)
      const icon = this.icon(scene, item.icon, x + 20 + 19, top + 20 + 19, 20)
      const number = this.text(scene, x + cardW - 20, top + 20 + 5.5, item.number, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '18px',
        color: 'rgba(102,135,142,0.53)',
      }).setOrigin(1, 0)
      const label = this.text(scene, x + 20, top + 20 + 51, item.label, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '15px',
        color: TEXT_COLOR,
      })
      const desc = this.paragraph(scene, x + 20, top + 20 + 51 + 30, item.desc, 217, { size: 13.5 })

      return [bg, badge, icon, number, label, desc]
    })

    c.add([title, ...built.flat()])
    return c
  }

  // Section 5 — "Mengapa Jalur Tidak Boleh Terlalu Tipis?"
  private section5(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)
    const title = this.sectionTitle(scene, CONTENT_WIDTH / 2, 0, 'Mengapa Jalur Tidak Boleh Terlalu Tipis?', CONTENT_WIDTH, 'center')

    const rowTop = 32 + 79
    const rowH = 92.5

    const leftW = 313
    const leftBg = scene.add
      .graphics()
      .fillStyle(DARK_FILL, SOFT_FILL_ALPHA)
      .fillRoundedRect(0, rowTop, leftW, rowH, 12)
      .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
      .strokeRoundedRect(0, rowTop, leftW, rowH, 12)
    const leftTitle = this.text(scene, leftW - 24, rowTop + 20, 'Jalur terlalu tipis', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '17px',
      color: TEXT_COLOR,
      align: 'right',
    }).setOrigin(1, 0)
    const leftIconX = leftW - 24 - 15 / 2
    const leftMeta = this.text(scene, leftIconX - 23, rowTop + 47, 'pemanasan berlebihan', {
      fontStyle: '500',
      fontSize: '14px',
      color: MUTED_TEXT,
      align: 'right',
    }).setOrigin(1, 0)
    const leftIcon = this.icon(scene, 'jalur-icon-arrow-right', leftIconX, rowTop + 47 + leftMeta.height / 2, 15)

    const panelX = leftW + 32
    const panelW = 407
    const panelH = 200
    const panel = this.assetPanel(scene, panelX, rowTop - (panelH - rowH) / 2, panelW, panelH)
    const img = this.illustration(
      scene,
      'jalur-perbandingan-tipis-lebar',
      panelX + panelW / 2,
      rowTop - (panelH - rowH) / 2 + panelH / 2,
      357,
      200,
    )

    const rightX = panelX + panelW + 32
    const rightW = 313
    const rightBg = scene.add
      .graphics()
      .fillStyle(DARK_FILL, 1)
      .fillRoundedRect(rightX, rowTop, rightW, rowH, 12)
    const rightTitle = this.text(scene, rightX + 24, rowTop + 20, 'Lebar sesuai', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '17px',
      color: DARK_TEXT,
    })
    const rightMeta = this.text(scene, rightX + 24 + 23, rowTop + 47, 'penghantaran lebih aman', {
      fontStyle: '500',
      fontSize: '14px',
      color: DARK_TEXT,
    }).setAlpha(0.9)
    const rightIcon = this.icon(scene, 'jalur-icon-arrow-right', rightX + 24, rowTop + 47 + rightMeta.height / 2, 15).setAlpha(0.9)

    c.add([title, leftBg, leftTitle, leftIcon, leftMeta, panel, img, rightBg, rightTitle, rightIcon, rightMeta])
    return c
  }

  // Section 6 — "Rumus Praktis Penentuan Lebar Jalur"
  private section6(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)
    const title = this.sectionTitle(scene, CONTENT_WIDTH / 2, 0, 'Rumus Praktis Penentuan Lebar Jalur', CONTENT_WIDTH, 'center')

    const cardTop = 32
    const cardH = 283
    const card = scene.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(0, cardTop, CONTENT_WIDTH, cardH, 16)
      .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
      .strokeRoundedRect(0, cardTop, CONTENT_WIDTH, cardH, 16)

    const centerX = CONTENT_WIDTH / 2
    const formula = this.text(scene, centerX, cardTop + 41 + 24, 'Lebar Jalur (mm)  =  Arus (A)  ×  Faktor Pengali', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '30px',
      color: TEXT_COLOR,
      align: 'center',
    }).setOrigin(0.5)

    const subFormula = this.text(scene, centerX, cardTop + 120 + 15, 'Arus (I)  =  Daya (P)  /  Tegangan (V)', {
      fontFamily: FONT_HEADING,
      fontStyle: '700',
      fontSize: '19px',
      color: MUTED_TEXT,
      align: 'center',
    }).setOrigin(0.5)

    const divider = scene.add.graphics().lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA).lineBetween(centerX - 336, cardTop + 178, centerX + 336, cardTop + 178)

    const note = this.paragraph(
      scene,
      centerX,
      cardTop + 178 + 18,
      'Rumus ini digunakan sebagai pendekatan sederhana dalam simulator pembelajaran. Dalam desain PCB sebenarnya, penentuan lebar jalur mempertimbangkan lebih banyak parameter teknis.',
      672,
      { size: 13.5, color: MUTED_TEXT, align: 'center' },
    )

    c.add([title, card, formula, subFormula, divider, note])
    return c
  }

  // Section 7 — "Contoh Perhitungan"
  private section7(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)
    const title = this.sectionTitle(scene, 0, 0, 'Contoh Perhitungan', CONTENT_WIDTH)

    const rowY = 42
    const chip = (x: number, w: number, label: string, value: string, dark = false) => {
      const bg = scene.add
        .graphics()
        .fillStyle(dark ? DARK_FILL : 0xffffff, 1)
        .fillRoundedRect(x, rowY, w, dark ? 107 : 98, 12)
      if (!dark) bg.lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA).strokeRoundedRect(x, rowY, w, 98, 12)
      const labelText = this.text(scene, x + w / 2, rowY + 17, label, {
        fontStyle: '600',
        fontSize: '12.5px',
        color: dark ? DARK_TEXT : MUTED_TEXT,
        align: 'center',
      }).setOrigin(0.5, 0)
      if (dark) labelText.setAlpha(0.85)
      const valueText = this.text(scene, x + w / 2, rowY + 36, value, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: dark ? '48px' : '30px',
        color: dark ? DARK_TEXT : TEXT_COLOR,
        align: 'center',
      }).setOrigin(0.5, 0)
      return [bg, labelText, valueText]
    }

    const op = (x: number, symbol: string) =>
      this.text(scene, x, rowY + 31, symbol, { fontFamily: FONT_HEADING, fontStyle: '800', fontSize: '30px', color: MUTED_TEXT }).setOrigin(0.5, 0)

    const widths = [120, 16, 135, 16, 123, 16, 180]
    let cx = 0
    const positions: number[] = []
    widths.forEach((w) => {
      positions.push(cx)
      cx += w + 16
    })
    const rowWidth = cx - 16
    const rowLeft = CONTENT_WIDTH / 2 - rowWidth / 2
    const at = (i: number) => rowLeft + positions[i]

    const row = [
      ...chip(at(0), widths[0], 'Arus', '1 A'),
      op(at(1) + widths[1] / 2, '×'),
      ...chip(at(2), widths[2], 'Faktor Pengali', '2'),
      op(at(3) + widths[3] / 2, '='),
      ...chip(at(4), widths[4], 'Perhitungan', '1 × 2'),
      op(at(5) + widths[5] / 2, '='),
      ...chip(at(6), widths[6], 'Lebar Jalur', '2 mm', true),
    ]

    const gridTop = 32 + 107 + 40
    const panelX = 0
    const panelW = 601
    const panelH = 260
    const panel = this.assetPanel(scene, panelX, gridTop, panelW, panelH)
    const img = this.illustration(scene, 'jalur-arus-diproses', panelX + panelW / 2, gridTop + panelH / 2, 551, 210)

    const stepsX = panelX + panelW + 32
    const stepsW = 463
    const steps: Phaser.GameObjects.GameObject[] = []
    ;[
      { value: '1 A', barH: 8, width: 90, result: '2 mm' },
      { value: '2 A', barH: 16, width: 90, result: '4 mm' },
    ].forEach((row2, i) => {
      const y = gridTop + 10 + i * 86
      const bg = scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(stepsX, y, stepsW, 70, 12)
        .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
        .strokeRoundedRect(stepsX, y, stepsW, 70, 12)
      const value = this.text(scene, stepsX + 20, y + 17, row2.value, { fontFamily: FONT_HEADING, fontStyle: '800', fontSize: '24px', color: TEXT_COLOR })
      const arrow = this.icon(scene, 'jalur-icon-arrow-right', stepsX + 20 + 52 + 16 + 9, y + 17 + 9, 18)
      const bar = scene.add
        .graphics()
        .fillStyle(DARK_FILL, 1)
        .fillRoundedRect(stepsX + 20 + 52 + 16 + 18 + 20, y + 35 - row2.barH / 2, row2.width, row2.barH, row2.barH / 2)
      const result = this.text(scene, stepsX + stepsW - 20, y + 21.5, row2.result, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '18px',
        color: TEXT_COLOR,
      }).setOrigin(1, 0)
      steps.push(bg, value, arrow, bar, result)
    })

    const noteY = gridTop + 10 + 2 * 86 + 12
    const note = this.paragraph(
      scene,
      stepsX,
      noteY,
      '•  Arus bertambah lebar jalur bertambah. Nilai 2 A × 2 = 4 mm menghasilkan jalur yang tampak dua kali lebih lebar.',
      stepsW,
      { size: 14, color: MUTED_TEXT },
    )

    c.add([title, ...row, panel, img, ...steps, note])
    return c
  }

  // Section 8 — "Apa Arti Lebar Jalur 2 mm?"
  private section8(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)

    const panelW = 576
    const panelH = 270
    const panel = this.assetPanel(scene, 0, 0, panelW, panelH)
    const img = this.illustration(scene, 'jalur-pengukuran-lebar', panelW / 2, panelH / 2, 526, 220)

    const legendY = panelH + 16
    const legendCenter = panelW / 2
    const arrowLeft = this.icon(scene, 'jalur-icon-arrow-left-right', legendCenter - 87, legendY + 9, 18)
    const pill = scene.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(legendCenter - 43, legendY, 87, 28, 14)
      .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
      .strokeRoundedRect(legendCenter - 43, legendY, 87, 28, 14)
    const pillText = this.text(scene, legendCenter, legendY + 5, '2 mm', {
      fontFamily: FONT_HEADING,
      fontStyle: '800',
      fontSize: '20px',
      color: TEXT_COLOR,
      align: 'center',
    }).setOrigin(0.5, 0)
    const arrowRight = this.icon(scene, 'jalur-icon-arrow-left-right', legendCenter + 87, legendY + 9, 18)

    const rightX = panelW + 48
    const rightW = 472
    const title = this.sectionTitle(scene, rightX, 81, 'Apa Arti Lebar Jalur 2 mm?', rightW)
    const paragraph = this.paragraph(
      scene,
      rightX,
      81 + 46,
      'Lebar jalur adalah ukuran melintang dari satu sisi jalur tembaga ke sisi lainnya. Angka 2 mm yang dihasilkan simulator mewakili lebar fisik yang nyata pada papan PCB.',
      rightW,
    )

    c.add([panel, img, arrowLeft, pill, pillText, arrowRight, title, paragraph])
    return c
  }

  // Section 9 — "Yang Perlu Kamu Ingat"
  private section9(scene: Phaser.Scene) {
    const c = scene.add.container(0, 0)
    const title = this.sectionTitle(scene, 0, 0, 'Yang Perlu Kamu Ingat', CONTENT_WIDTH)

    const items = [
      { number: '01', label: 'Arus lebih besar', desc: 'jalur cenderung membutuhkan lebar yang lebih besar.' },
      { number: '02', label: 'Lebar jalur', desc: 'menentukan kemampuan penghantaran pada pendekatan pembelajaran ini.' },
      { number: '03', label: 'Simulator', desc: 'digunakan untuk menerapkan konsep tersebut secara langsung.' },
    ]

    const cardW = 352
    const cardH = 204.375
    const gap = 20
    const top = 28 + 32

    const built = items.map((item, i) => {
      const x = i * (cardW + gap)
      const bg = scene.add
        .graphics()
        .fillStyle(DARK_FILL, SOFT_FILL_ALPHA)
        .fillRoundedRect(x, top, cardW, cardH, 16)
        .lineStyle(1, CARD_BORDER, CARD_BORDER_ALPHA)
        .strokeRoundedRect(x, top, cardW, cardH, 16)
      const number = this.text(scene, x + 24, top + 24, item.number, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '34px',
        color: 'rgba(102,135,142,0.4)',
      })
      const label = this.text(scene, x + 24, top + 24 + 44, item.label, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '20px',
        color: TEXT_COLOR,
      })
      const desc = this.paragraph(scene, x + 24, top + 24 + 44 + 38, item.desc, 302, { size: 14.5 })
      return [bg, number, label, desc]
    })

    c.add([title, ...built.flat()])
    return c
  }
}

/** `section9.y + its own height + bottom padding` — the scrollable content's total height. */
const LAST_SECTION_HEIGHT = 264.375
