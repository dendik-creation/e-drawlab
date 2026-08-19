import Phaser from 'phaser'
import { audio } from '../audio/AudioDirector'
import { coverFit } from '../coverFit'
import {
  SHEET_X,
  SHEET_Y,
  SHEET_WIDTH,
  SHEET_HEIGHT,
  resolveWireEnd,
  isWireReady,
  type CircuitLevel,
  type CircuitSlot,
  type PaletteItem,
} from './circuits'
import {
  drawResistorSymbol,
  drawLedSymbol,
  drawBatterySymbol,
  drawJunctionDot,
  drawWireProgress,
  drawWireDashOverlay,
  DASH_PATTERN,
} from './schematicSymbols'
import {
  buildNextButton,
  BADGE_FILL,
  BORDER_COLOR,
  CARD_EDGE,
  CARD_FILL,
  MUTED_TEXT_COLOR,
  TEXT_COLOR,
  FONT_BODY,
  FONT_HEADING,
  TEXT_RESOLUTION,
  type UiContext,
} from './uiKit'

const LEFT_PANEL_X = 26
const LEFT_PANEL_Y = 192
const LEFT_PANEL_WIDTH = 382
const LEFT_PANEL_HEIGHT = 827
const RIGHT_PANEL_X = 472
const RIGHT_PANEL_Y = 192
const RIGHT_PANEL_WIDTH = 1355
const RIGHT_PANEL_HEIGHT = 737
const PANEL_RADIUS = 20

const PALETTE_ROW_WIDTH = 320
const PALETTE_ROW_HEIGHT = 84
// Tight enough that level 3's worst case (5 components + 1 distractor + the
// etiket row) still fits inside the left panel.
const PALETTE_ROW_GAP = 14
const PALETTE_TOP = LEFT_PANEL_Y + 148
const PALETTE_CENTER_X = LEFT_PANEL_X + LEFT_PANEL_WIDTH / 2
const PALETTE_ICON_BOX = 60

/** The palette list scrolls within this viewport once its rows (components + the trailing etiket) overflow it. */
const PALETTE_VIEWPORT_TOP = PALETTE_TOP - 6
const PALETTE_VIEWPORT_BOTTOM = LEFT_PANEL_Y + LEFT_PANEL_HEIGHT - 20
const PALETTE_VIEWPORT_HEIGHT = PALETTE_VIEWPORT_BOTTOM - PALETTE_VIEWPORT_TOP
const PALETTE_WHEEL_FACTOR = 0.6

const SNAP_RADIUS = 95
const WIRE_DRAW_DURATION = 260
const WIRE_DASH_LOOP_DURATION = 700

/** Ghost drop-target box: centred on the slot, name label inside the box, below the symbol. */
const GHOST_PAD = 16
const GHOST_THICKNESS_HALF = 20
const GHOST_LABEL_GAP = 6
const GHOST_LABEL_HEIGHT = 20

/** The etiket: a locked palette entry until the circuit is complete, then a drag target of its own. */
const ETIKET_WIDTH = 322
const ETIKET_HEIGHT = 84
const ETIKET_SNAP_RADIUS = 110

/** Runtime state for whichever circuit level is currently on the sheet. */
interface WorkbenchState {
  level: CircuitLevel
  filledSlots: Set<string>
  drawnWires: Set<string>
  wireGraphics: Map<string, Phaser.GameObjects.Graphics>
  wireDashOverlays: Map<string, Phaser.GameObjects.Graphics>
  wireDashTweens: Map<string, Phaser.Tweens.Tween>
  ghostPreviews: Map<string, Phaser.GameObjects.Graphics>
  ghostLabels: Map<string, Phaser.GameObjects.Text>
  ghostPulses: Map<string, Phaser.Tweens.Tween>
  junctionGraphics: Phaser.GameObjects.Graphics[]
  paletteRows: Map<string, Phaser.GameObjects.Container>
  paletteHome: Map<string, { x: number; y: number }>
  /** Holds every palette row (+ the etiket row) and gets masked/scrolled as one unit. */
  paletteContainer?: Phaser.GameObjects.Container
  paletteScrollY: number

  // The etiket: not a circuit slot, so it's tracked separately from everything above.
  etiketRect: { x: number; y: number; width: number; height: number }
  etiketPlaced: boolean
  /** Locked (undraggable, shown with a padlock) until the whole circuit is wired. */
  etiketLocked: boolean
  etiketRow?: Phaser.GameObjects.Container
  etiketLockOverlay?: Phaser.GameObjects.Container
  etiketHome?: { x: number; y: number }
  etiketGhost?: {
    box: Phaser.GameObjects.Graphics
    preview: Phaser.GameObjects.Image
    label: Phaser.GameObjects.Text
    pulse: Phaser.Tweens.Tween
  }
}

export interface WorkbenchRenderOptions {
  level: CircuitLevel
  levelNumber: 1 | 2 | 3
  /** Was this level already solved on a previous visit? Skips straight to the finished sheet, no drag/drop rebuilt. */
  alreadySolved: boolean
  /** Whether Lanjut has anywhere to go once this level is solved (level 3 has nowhere — evaluasi is the next step, which does exist, so this is only ever false past the journey's last step). */
  hasNextStep: boolean
  /** Bookkeeping only — the panel already unlocks/rebuilds its own Lanjut button; this just lets the scene mark the level solved in its own state. */
  onSolved: () => void
  onNext: () => void
}

/**
 * Langkah 2.1-2.3 — one "kertas kerja" CAD work sheet: drag-and-drop
 * components onto a schematic, watch wires draw themselves in as the circuit
 * completes, then drag the etiket into place to finish. One instance per
 * level render; the scene builds a fresh one on every step change.
 */
export class WorkbenchStep {
  private state!: WorkbenchState
  private nextButton?: Phaser.GameObjects.Container
  private body!: Phaser.GameObjects.Container
  private opts!: WorkbenchRenderOptions
  private readonly wheelHandler = (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) =>
    this.handlePaletteWheel(pointer, dy)
  private ctx: UiContext

  constructor(ctx: UiContext) {
    this.ctx = ctx
  }

  private get scene() {
    return this.ctx.scene
  }

  render(body: Phaser.GameObjects.Container, opts: WorkbenchRenderOptions) {
    this.body = body
    this.opts = opts
    const { level, levelNumber, alreadySolved } = opts

    this.state = {
      level,
      filledSlots: new Set(),
      drawnWires: new Set(),
      wireGraphics: new Map(),
      wireDashOverlays: new Map(),
      wireDashTweens: new Map(),
      ghostPreviews: new Map(),
      ghostLabels: new Map(),
      ghostPulses: new Map(),
      junctionGraphics: [],
      paletteRows: new Map(),
      paletteHome: new Map(),
      paletteScrollY: 0,
      etiketRect: this.etiketRect(),
      etiketPlaced: false,
      etiketLocked: true,
    }

    body.add(this.buildPanel(LEFT_PANEL_X, LEFT_PANEL_Y, LEFT_PANEL_WIDTH, LEFT_PANEL_HEIGHT))
    body.add(this.buildPanel(RIGHT_PANEL_X, RIGHT_PANEL_Y, RIGHT_PANEL_WIDTH, RIGHT_PANEL_HEIGHT))

    body.add(
      this.scene.add.text(LEFT_PANEL_X + 32, LEFT_PANEL_Y + 27, 'Daftar Komponen', {
        fontFamily: FONT_HEADING,
        fontStyle: '600',
        fontSize: '30px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      }),
    )
    body.add(
      this.scene.add.text(LEFT_PANEL_X + 32, LEFT_PANEL_Y + 76, 'Seret komponen ke kertas kerja\ndi sisi kanan.', {
        fontFamily: FONT_BODY,
        fontStyle: '500',
        fontSize: '16px',
        color: TEXT_COLOR,
        lineSpacing: 4,
        resolution: TEXT_RESOLUTION,
      }),
    )

    body.add(
      this.scene.add.text(RIGHT_PANEL_X + 24, RIGHT_PANEL_Y + 27, `Kertas Kerja ${levelNumber} dari 3 — ${level.title}`, {
        fontFamily: FONT_HEADING,
        fontStyle: '600',
        fontSize: '30px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      }),
    )

    this.buildSheet(level)

    // Nothing left to drag on a level that's already solved — skip building
    // palette rows only to immediately destroy them.
    if (alreadySolved) this.fillSolvedSheet(level)
    else this.layoutPalette(level)

    this.nextButton = buildNextButton(this.ctx, alreadySolved && opts.hasNextStep, opts.onNext)
    body.add(this.nextButton)
  }

  /**
   * Stops every tween this workbench has in flight (ghost idle pulses,
   * palette-row reflow, the marching-dash loops) before its graphics get
   * destroyed. These are all counters or explicitly-tracked tweens — the
   * ghost pulses and dash loops repeat forever and would otherwise outlive
   * their Graphics. Wire-*reveal* tweens are the one exception: they're
   * anonymous counters with no handle to remove, so `revealReadyWires`'s
   * onUpdate guards itself with `gfx.active` instead. Without this, clicking
   * Lanjut right after finishing a sheet could tear down a Graphics object
   * mid-tween and crash on the next draw call.
   */
  teardown() {
    const state = this.state
    if (!state) return

    state.ghostPulses.forEach((tween) => tween.remove())
    state.wireDashTweens.forEach((tween) => tween.remove())
    state.paletteRows.forEach((row) => this.scene.tweens.killTweensOf(row))
    state.etiketGhost?.pulse.remove()
    if (state.etiketRow) this.scene.tweens.killTweensOf(state.etiketRow)

    // Registered once per render — never left attached across a step change,
    // or scrolling on materi/a later level would fire this level's now-destroyed handler.
    this.scene.input.off('wheel', this.wheelHandler)
  }

  private buildPanel(x: number, y: number, width: number, height: number) {
    return this.scene.add
      .graphics()
      .fillStyle(CARD_FILL, 1)
      .fillRoundedRect(x, y, width, height, PANEL_RADIUS)
      .lineStyle(3, BADGE_FILL, 1)
      .strokeRoundedRect(x, y, width, height, PANEL_RADIUS)
  }

  /** The dot-grid drawing sheet, its "effective area" caption, and the etiket title block. */
  private buildSheet(level: CircuitLevel) {
    const sheet = this.scene.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(SHEET_X, SHEET_Y, SHEET_WIDTH, SHEET_HEIGHT, 10)
      .lineStyle(2, CARD_EDGE, 1)
      .strokeRoundedRect(SHEET_X, SHEET_Y, SHEET_WIDTH, SHEET_HEIGHT, 10)

    const dotSpacing = 40
    sheet.fillStyle(0xd8dfe0, 1)
    for (let gx = SHEET_X + dotSpacing; gx < SHEET_X + SHEET_WIDTH; gx += dotSpacing) {
      for (let gy = SHEET_Y + dotSpacing; gy < SHEET_Y + SHEET_HEIGHT; gy += dotSpacing) {
        sheet.fillCircle(gx, gy, 1.5)
      }
    }
    this.body.add(sheet)

    this.body.add(
      this.scene.add.text(SHEET_X + 14, SHEET_Y + 10, 'KERTAS KERJA: AREA EFEKTIF GAMBAR', {
        fontFamily: FONT_BODY,
        fontStyle: '700',
        fontSize: '13px',
        color: MUTED_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      }),
    )

    // Drop-target ghosts, one per empty slot: a faint preview of the actual
    // symbol plus its name, so the sheet reads as "put the battery here"
    // rather than a grid of mystery boxes. They also light up while a
    // matching component is being dragged nearby (see updateGhostHighlights).
    level.slots.forEach((slot) => this.buildGhost(slot))

    level.wires.forEach((wire) => {
      const gfx = this.scene.add.graphics()
      this.body.add(gfx)
      this.state.wireGraphics.set(wire.id, gfx)

      // Sits above the solid wire, dashes marching along it once the reveal
      // finishes — see startWireDashLoop.
      const overlay = this.scene.add.graphics()
      this.body.add(overlay)
      this.state.wireDashOverlays.set(wire.id, overlay)
    })

    level.junctions.forEach((junction) => {
      const gfx = this.scene.add.graphics()
      gfx.setAlpha(0)
      this.body.add(gfx)
      drawJunctionDot(gfx, junction.x, junction.y)
      this.state.junctionGraphics.push(gfx)
    })

    // Ghost only, for now — the real etiket is a component the learner drags
    // into place themselves (see unlockEtiket/placeEtiket). Built last, same
    // as the real one would be, so it sits above any wire trail that happens
    // to pass behind its bottom-right corner (the bottom rail commonly does).
    this.state.etiketGhost = this.buildEtiketGhost(this.state.etiketRect)
  }

  /**
   * The ghost box's footprint: centred on the slot horizontally, but with
   * extra room below the symbol for its name label (per the "info goes
   * inside the drop area, under the icon" ask) — never above or beside it,
   * which is what used to poke the box past the sheet's top edge.
   */
  private ghostBoxRect(slot: CircuitSlot) {
    const horizontal = slot.orientation === 'horizontal'
    const halfWidth = horizontal ? slot.extent + GHOST_PAD : GHOST_THICKNESS_HALF + GHOST_PAD
    const halfTop = horizontal ? GHOST_THICKNESS_HALF + GHOST_PAD : slot.extent + GHOST_PAD
    const halfBottom = halfTop + GHOST_LABEL_GAP + GHOST_LABEL_HEIGHT

    return {
      left: slot.x - halfWidth,
      right: slot.x + halfWidth,
      top: slot.y - halfTop,
      bottom: slot.y + halfBottom,
    }
  }

  private paintGhostBox(gfx: Phaser.GameObjects.Graphics, slot: CircuitSlot, highlighted: boolean) {
    const rect = this.ghostBoxRect(slot)
    const color = highlighted ? 0x1fae6b : BORDER_COLOR

    gfx.clear()
    gfx.fillStyle(color, highlighted ? 0.16 : 0.07)
    gfx.fillRoundedRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top, 12)
    gfx.lineStyle(highlighted ? 3 : 2, color, highlighted ? 0.95 : 0.45)
    gfx.strokeRoundedRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top, 12)
  }

  /** A drop target: the highlightable box, a low-alpha preview of its symbol, its name below the icon, and an idle pulse. */
  private buildGhost(slot: CircuitSlot) {
    const state = this.state

    const box = this.scene.add.graphics()
    this.paintGhostBox(box, slot, false)
    this.body.add(box)
    state.wireGraphics.set(`ghost:${slot.id}`, box)

    const preview = this.scene.add.graphics({ x: slot.x, y: slot.y })
    if (slot.kind === 'resistor') {
      if (slot.orientation === 'vertical') preview.setAngle(90)
      drawResistorSymbol(preview, slot.extent)
    } else if (slot.kind === 'led') {
      if (slot.orientation === 'vertical') preview.setAngle(90)
      drawLedSymbol(preview, slot.extent)
    } else {
      drawBatterySymbol(preview, slot.extent)
    }
    preview.setAlpha(0.35)
    this.body.add(preview)
    state.ghostPreviews.set(slot.id, preview)

    const horizontal = slot.orientation === 'horizontal'
    const labelY = slot.y + (horizontal ? GHOST_THICKNESS_HALF : slot.extent) + GHOST_LABEL_GAP + GHOST_LABEL_HEIGHT / 2
    const label = this.scene.add
      .text(slot.x, labelY, slot.nameLabel ?? '', {
        fontFamily: FONT_BODY,
        fontStyle: '700',
        fontSize: '14px',
        color: MUTED_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
      .setAlpha(0.55)
    this.body.add(label)
    state.ghostLabels.set(slot.id, label)

    // A gentle breathing pulse — makes the empty sheet read as "waiting for
    // input" rather than static/dead, per the "simulate it more alive" ask.
    const pulse = this.scene.tweens.add({
      targets: [preview, label],
      alpha: { from: 0.55, to: 0.22 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    state.ghostPulses.set(slot.id, pulse)
  }

  /** Live "you're about to drop here" feedback while a matching component is being dragged. */
  private updateGhostHighlights(activeItem: PaletteItem | null, x: number | null, y: number | null) {
    const state = this.state

    state.level.slots.forEach((slot) => {
      if (state.filledSlots.has(slot.id)) return
      const box = state.wireGraphics.get(`ghost:${slot.id}`)
      if (!box) return

      const highlighted = !!(
        activeItem &&
        x !== null &&
        y !== null &&
        activeItem.kind === slot.kind &&
        Phaser.Math.Distance.Between(x, y, slot.x, slot.y) <= SNAP_RADIUS
      )
      this.paintGhostBox(box, slot, highlighted)
    })
  }

  /** Retires one slot's drop-target ghost once its real component has landed. */
  private hideGhost(slotId: string) {
    const state = this.state
    state.wireGraphics.get(`ghost:${slotId}`)?.setVisible(false)
    state.ghostPreviews.get(slotId)?.setVisible(false)
    state.ghostLabels.get(slotId)?.setVisible(false)
    state.ghostPulses.get(slotId)?.remove()
  }

  /** Fixed drop target, bottom-right of the sheet — same spot the real etiket renders once placed. */
  private etiketRect() {
    return {
      x: SHEET_X + SHEET_WIDTH - ETIKET_WIDTH - 16,
      y: SHEET_Y + SHEET_HEIGHT - ETIKET_HEIGHT - 16,
      width: ETIKET_WIDTH,
      height: ETIKET_HEIGHT,
    }
  }

  private paintEtiketGhostBox(gfx: Phaser.GameObjects.Graphics, rect: { x: number; y: number; width: number; height: number }, highlighted: boolean) {
    const color = highlighted ? 0x1fae6b : BORDER_COLOR

    gfx.clear()
    gfx.fillStyle(color, highlighted ? 0.16 : 0.07)
    gfx.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 12)
    gfx.lineStyle(highlighted ? 3 : 2, color, highlighted ? 0.95 : 0.45)
    gfx.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 12)
  }

  /** The etiket's drop-target ghost: same idle-pulse + preview + label treatment as a component slot. */
  private buildEtiketGhost(rect: { x: number; y: number; width: number; height: number }) {
    const cy = rect.y + rect.height / 2

    const box = this.scene.add.graphics()
    this.paintEtiketGhostBox(box, rect, false)
    this.body.add(box)

    const preview = coverFit(this.scene.add.image(rect.x + 46, cy, 'elec-etiket'), 48, 48)
    preview.setAlpha(0.35)
    this.body.add(preview)

    const label = this.scene.add
      .text(rect.x + 92, cy, 'Etiket kerja diletakkan di sini', {
        fontFamily: FONT_BODY,
        fontStyle: '700',
        fontSize: '13px',
        color: MUTED_TEXT_COLOR,
        wordWrap: { width: rect.width - 100 },
        lineSpacing: 2,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)
      .setAlpha(0.55)
    this.body.add(label)

    const pulse = this.scene.tweens.add({
      targets: [preview, label],
      alpha: { from: 0.55, to: 0.22 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    return { box, preview, label, pulse }
  }

  /** Live drop-target feedback while the etiket itself is being dragged. */
  private updateEtiketHighlight(x: number | null, y: number | null) {
    const ghost = this.state.etiketGhost
    if (!ghost) return

    const rect = this.state.etiketRect
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const highlighted = x !== null && y !== null && Phaser.Math.Distance.Between(x, y, cx, cy) <= ETIKET_SNAP_RADIUS
    this.paintEtiketGhostBox(ghost.box, rect, highlighted)
  }

  /** The drafting title block, bottom-right of the sheet — dynamic per level (REQ-F-018-style wayfinding for this stage). */
  private buildEtiket(level: CircuitLevel) {
    const width = ETIKET_WIDTH
    const height = ETIKET_HEIGHT
    const headerHeight = height * 0.46
    const x = SHEET_X + SHEET_WIDTH - width - 16
    const y = SHEET_Y + SHEET_HEIGHT - height - 16
    const radius = 8

    const box = this.scene.add
      .graphics()
      .fillStyle(0x000000, 0.1)
      .fillRoundedRect(x + 3, y + 4, width, height, radius)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(x, y, width, height, radius)
      .fillStyle(0xe6efee, 1)
      .fillRect(x + 1.5, y + 1.5, width - 3, headerHeight - 1.5)
      .lineStyle(1.5, BORDER_COLOR, 0.9)
      .strokeRoundedRect(x, y, width, height, radius)
      .lineStyle(1, BORDER_COLOR, 0.5)
      .lineBetween(x, y + headerHeight, x + width, y + headerHeight)
      .lineBetween(x + width / 2, y, x + width / 2, y + headerHeight)

    const cellStyle = {
      fontFamily: FONT_BODY,
      fontStyle: '700',
      fontSize: '12px',
      color: TEXT_COLOR,
      resolution: TEXT_RESOLUTION,
    }

    const skala = this.scene.add.text(x + 12, y + headerHeight / 2, 'SKALA: 1:1', cellStyle).setOrigin(0, 0.5)
    const digambar = this.scene.add.text(x + width / 2 + 12, y + headerHeight / 2, 'DIGAMBAR: SISWA', cellStyle).setOrigin(0, 0.5)
    const drawingLabel = this.scene.add
      .text(x + 12, y + headerHeight + (height - headerHeight) / 2, `${level.levelNumber}: ${level.etiketName}`, {
        ...cellStyle,
        fontSize: '13px',
      })
      .setOrigin(0, 0.5)

    return this.scene.add.container(0, 0, [box, skala, digambar, drawingLabel])
  }

  private layoutPalette(level: CircuitLevel) {
    const state = this.state

    // Rows live in their own container so the whole list can be masked and
    // scrolled as one unit once it overflows the panel (level 3's full
    // component set + the etiket row routinely does).
    const container = this.scene.add.container(0, 0)
    this.body.add(container)
    state.paletteContainer = container

    const maskShape = this.scene.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRect(LEFT_PANEL_X, PALETTE_VIEWPORT_TOP, LEFT_PANEL_WIDTH, PALETTE_VIEWPORT_HEIGHT)
    maskShape.setVisible(false)
    this.body.add(maskShape)
    container.setMask(maskShape.createGeometryMask())

    level.palette.forEach((item, index) => {
      const y = PALETTE_TOP + index * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) + PALETTE_ROW_HEIGHT / 2
      const row = this.buildPaletteRow(item)
      row.setPosition(PALETTE_CENTER_X, y)
      container.add(row)
      state.paletteRows.set(item.id, row)
      state.paletteHome.set(item.id, { x: PALETTE_CENTER_X, y })
      this.attachDrag(row, item)
      this.ctx.registerInteractive(row)
    })

    // The etiket sits last, locked (padlocked, not draggable) until the
    // circuit is fully wired — see unlockEtiket. It reflows up the same way
    // the components above it do (see reflowPalette) as they get consumed.
    const etiketY = PALETTE_TOP + level.palette.length * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) + PALETTE_ROW_HEIGHT / 2
    const { row: etiketRow, lockOverlay } = this.buildEtiketPaletteRow()
    etiketRow.setPosition(PALETTE_CENTER_X, etiketY)
    container.add(etiketRow)
    state.etiketRow = etiketRow
    state.etiketLockOverlay = lockOverlay
    state.etiketHome = { x: PALETTE_CENTER_X, y: etiketY }
    state.etiketLocked = true

    this.scene.input.on('wheel', this.wheelHandler)
  }

  private paletteRowCount() {
    const state = this.state
    return state.paletteRows.size + (state.etiketRow ? 1 : 0)
  }

  private paletteContentHeight() {
    const rows = this.paletteRowCount()
    return rows === 0 ? 0 : rows * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) - PALETTE_ROW_GAP
  }

  private clampPaletteScroll() {
    const state = this.state
    if (!state.paletteContainer) return
    const maxScroll = Math.max(0, this.paletteContentHeight() - PALETTE_VIEWPORT_HEIGHT)
    state.paletteScrollY = Phaser.Math.Clamp(state.paletteScrollY, 0, maxScroll)
    state.paletteContainer.y = -state.paletteScrollY
  }

  private handlePaletteWheel(pointer: Phaser.Input.Pointer, deltaY: number) {
    const state = this.state
    if (!state?.paletteContainer || this.ctx.isLocked()) return
    if (
      pointer.worldX < LEFT_PANEL_X ||
      pointer.worldX > LEFT_PANEL_X + LEFT_PANEL_WIDTH ||
      pointer.worldY < PALETTE_VIEWPORT_TOP ||
      pointer.worldY > PALETTE_VIEWPORT_BOTTOM
    ) {
      return
    }

    state.paletteScrollY += deltaY * PALETTE_WHEEL_FACTOR
    this.clampPaletteScroll()
  }

  /**
   * A row being dragged has to leave the scrolling/masked container — its
   * tween targets (a slot, the etiket zone, or its own home) are authored in
   * the sheet's absolute coordinates, which only line up while the container
   * isn't offset by a scroll. `y` is adjusted so the row doesn't visually
   * jump the moment it's lifted out.
   */
  private detachRowForDrag(row: Phaser.GameObjects.Container) {
    const container = this.state.paletteContainer
    if (!container) return
    row.y += container.y
    container.remove(row, false)
    this.body.add(row)
  }

  /** The inverse of detachRowForDrag — put a row that didn't land back into the scrolling list. */
  private reattachRowToPalette(row: Phaser.GameObjects.Container) {
    const container = this.state.paletteContainer
    if (!container) return
    this.body.remove(row, false)
    row.y -= container.y
    container.add(row)
  }

  private buildEtiketPaletteRow() {
    const halfWidth = PALETTE_ROW_WIDTH / 2
    const halfHeight = PALETTE_ROW_HEIGHT / 2

    const bg = this.scene.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-halfWidth, -halfHeight, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT, 12)
      .lineStyle(2, 0x5c9f96, 1)
      .strokeRoundedRect(-halfWidth, -halfHeight, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT, 12)

    const icon = coverFit(this.scene.add.image(-halfWidth + 44, 0, 'elec-etiket'), PALETTE_ICON_BOX, PALETTE_ICON_BOX).setAngle(15)

    const label = this.scene.add
      .text(-halfWidth + 90, 0, 'Etiket Kerja', {
        fontFamily: FONT_BODY,
        fontStyle: '800',
        fontSize: '19px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)

    const handle = this.scene.add.graphics()
    handle.fillStyle(0x5c9f96, 1)
    const dotOffsets = [-6, 0, 6]
    dotOffsets.forEach((dx) => dotOffsets.forEach((dy) => handle.fillCircle(halfWidth - 26 + dx, dy, 2.2)))

    const lockOverlay = this.buildLockOverlay()

    const row = this.scene.add.container(0, 0, [bg, icon, label, handle, lockOverlay])
    row.setSize(PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT)

    return { row, lockOverlay }
  }

  /** Frosted scrim + padlock glyph, shown over the etiket row until the circuit is complete. */
  private buildLockOverlay() {
    const halfWidth = PALETTE_ROW_WIDTH / 2
    const halfHeight = PALETTE_ROW_HEIGHT / 2

    // Opaque enough to fully hide the row's own icon/label underneath —
    // the lock glyph and hint below replace them, centred, rather than
    // fighting for the same space as the row's left-aligned content.
    const scrim = this.scene.add
      .graphics()
      .fillStyle(0xfbf0dc, 0.94)
      .fillRoundedRect(-halfWidth, -halfHeight, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT, 12)

    const lockBodyWidth = 24
    const lockBodyHeight = 20
    const lockShackleRadius = 10
    const lockCenterY = -14

    const lock = this.scene.add.graphics()
    lock.lineStyle(4, 0x8a7a55, 1)
    lock.beginPath()
    lock.arc(0, lockCenterY, lockShackleRadius, Math.PI, 0, false)
    lock.strokePath()
    lock.fillStyle(0x8a7a55, 1)
    lock.fillRoundedRect(-lockBodyWidth / 2, lockCenterY, lockBodyWidth, lockBodyHeight, 4)
    lock.fillStyle(0x5c4a2a, 1)
    lock.fillCircle(0, lockCenterY + lockBodyHeight / 2, 3)

    const hint = this.scene.add
      .text(0, lockCenterY + lockBodyHeight + 12, 'Selesaikan rangkaian dulu', {
        fontFamily: FONT_BODY,
        fontStyle: '600',
        fontSize: '13px',
        color: MUTED_TEXT_COLOR,
        align: 'center',
        wordWrap: { width: PALETTE_ROW_WIDTH - 60 },
        lineSpacing: 2,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)

    return this.scene.add.container(0, 0, [scrim, lock, hint])
  }

  /**
   * The circuit is fully wired: unlocks the etiket row (removes the padlock,
   * makes it draggable) so the learner can bring it to its slot themselves.
   */
  private unlockEtiket() {
    const state = this.state
    if (!state.etiketLocked) return
    state.etiketLocked = false

    audio.play('allConnected')
    state.etiketLockOverlay?.setVisible(false)

    if (state.etiketRow && state.etiketHome) {
      this.attachEtiketDrag(state.etiketRow, state.etiketHome)
      this.ctx.registerInteractive(state.etiketRow)
      this.scene.tweens.add({ targets: state.etiketRow, scaleX: 1.08, scaleY: 1.08, duration: 150, yoyo: true, ease: 'Sine.easeOut' })
    }
  }

  private attachEtiketDrag(row: Phaser.GameObjects.Container, home: { x: number; y: number }) {
    row.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(0, 0, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    })
    this.scene.input.setDraggable(row)

    row.on('dragstart', () => {
      if (this.ctx.isLocked() || this.state.etiketLocked) return
      this.scene.tweens.killTweensOf(row)
      this.detachRowForDrag(row)
      row.setDepth(1000)
    })
    row.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.ctx.isLocked() || this.state.etiketLocked) return
      row.x = dragX
      row.y = dragY
      this.updateEtiketHighlight(pointer.worldX, pointer.worldY)
    })
    row.on('dragend', (pointer: Phaser.Input.Pointer) => {
      if (this.ctx.isLocked() || this.state.etiketLocked) return
      this.handleEtiketDrop(row, pointer.worldX, pointer.worldY, home)
    })
  }

  private handleEtiketDrop(row: Phaser.GameObjects.Container, dropX: number, dropY: number, home: { x: number; y: number }) {
    const rect = this.state.etiketRect
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const hit = Phaser.Math.Distance.Between(dropX, dropY, cx, cy) <= ETIKET_SNAP_RADIUS

    this.updateEtiketHighlight(null, null)

    if (hit) {
      this.placeEtiket(row, cx, cy)
      return
    }

    this.scene.tweens.add({
      targets: row,
      x: home.x,
      y: home.y,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        row.setDepth(0)
        this.reattachRowToPalette(row)
      },
    })
  }

  private placeEtiket(row: Phaser.GameObjects.Container, targetX: number, targetY: number) {
    audio.play('pencil')
    this.ctx.unregisterInteractive(row)

    this.scene.tweens.add({
      targets: row,
      x: targetX,
      y: targetY,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        row.destroy()
        this.state.etiketPlaced = true
        this.state.etiketRow = undefined

        const ghost = this.state.etiketGhost
        if (ghost) {
          ghost.box.setVisible(false)
          ghost.preview.setVisible(false)
          ghost.label.setVisible(false)
          ghost.pulse.remove()
        }

        this.body.add(this.buildEtiket(this.state.level))
        this.markSolved()
      },
    })
  }

  /** Level's done: sound, swap the footer button to enabled, and let the scene know (so it can remember across a step change). */
  private markSolved() {
    audio.play('lockSuccess')

    if (this.nextButton) {
      this.ctx.unregisterInteractive(this.nextButton)
      this.nextButton.destroy()
      this.nextButton = buildNextButton(this.ctx, this.opts.hasNextStep, this.opts.onNext)
      this.body.add(this.nextButton)
    }

    this.opts.onSolved()
  }

  private buildPaletteRow(item: PaletteItem) {
    const halfWidth = PALETTE_ROW_WIDTH / 2
    const halfHeight = PALETTE_ROW_HEIGHT / 2

    const bg = this.scene.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-halfWidth, -halfHeight, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT, 12)
      .lineStyle(2, 0x5c9f96, 1)
      .strokeRoundedRect(-halfWidth, -halfHeight, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT, 12)

    const icon = coverFit(this.scene.add.image(-halfWidth + 44, 0, item.texture), PALETTE_ICON_BOX, PALETTE_ICON_BOX).setAngle(15)

    const label = this.scene.add
      .text(-halfWidth + 90, 0, item.label, {
        fontFamily: FONT_BODY,
        fontStyle: '800',
        fontSize: '19px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)

    const handle = this.scene.add.graphics()
    handle.fillStyle(0x5c9f96, 1)
    const dotOffsets = [-6, 0, 6]
    dotOffsets.forEach((dx) => dotOffsets.forEach((dy) => handle.fillCircle(halfWidth - 26 + dx, dy, 2.2)))

    const container = this.scene.add.container(0, 0, [bg, icon, label, handle])
    container.setSize(PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT)
    container.setData('itemId', item.id)
    return container
  }

  private attachDrag(row: Phaser.GameObjects.Container, item: PaletteItem) {
    // Phaser adds the Container's displayOrigin (its centre, once setSize()
    // has run) to the pointer position before testing it against hitArea —
    // so the hit rect has to be authored top-left-relative (0,0..w,h), not
    // centred like the row's own children are. A centred rect here silently
    // shifted the hittable region to only the left half of the card, which
    // read as "only the text is draggable" (the label happens to sit there).
    row.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(0, 0, PALETTE_ROW_WIDTH, PALETTE_ROW_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    })
    this.scene.input.setDraggable(row)

    row.on('dragstart', () => {
      if (this.ctx.isLocked()) return
      this.scene.tweens.killTweensOf(row)
      this.detachRowForDrag(row)
      row.setDepth(1000)
    })
    row.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.ctx.isLocked()) return
      // Phaser's dragX/dragY preserve the offset between the grab point and
      // the container's origin, so the card follows the cursor naturally
      // from wherever it was picked up — icon, handle, or label.
      row.x = dragX
      row.y = dragY
      // Drop detection below deliberately uses the pointer itself, not
      // row.x/row.y: a card grabbed by its icon (~116px off-centre) would
      // otherwise need to be dropped 116px past the slot before its origin
      // came close enough, which read as "only the text is draggable".
      this.updateGhostHighlights(item, pointer.worldX, pointer.worldY)
    })
    row.on('dragend', (pointer: Phaser.Input.Pointer) => {
      if (this.ctx.isLocked()) return
      this.handleDrop(row, item, pointer.worldX, pointer.worldY)
    })
  }

  private handleDrop(row: Phaser.GameObjects.Container, item: PaletteItem, dropX: number, dropY: number) {
    const state = this.state
    const home = state.paletteHome.get(item.id)!
    const nearestSlot = state.level.slots
      .filter((slot) => !state.filledSlots.has(slot.id))
      .map((slot) => ({ slot, distance: Phaser.Math.Distance.Between(dropX, dropY, slot.x, slot.y) }))
      .filter(({ distance }) => distance <= SNAP_RADIUS)
      .sort((a, b) => a.distance - b.distance)[0]?.slot

    this.updateGhostHighlights(null, null, null)

    if (nearestSlot && nearestSlot.kind === item.kind) {
      this.placeComponent(row, item, nearestSlot)
      return
    }

    if (nearestSlot) {
      // Wrong component for this slot: red flash + buzz, then spring back.
      audio.play('buzz')
      this.scene.tweens.add({ targets: row, angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => row.setAngle(0) })
    }

    this.scene.tweens.add({
      targets: row,
      x: home.x,
      y: home.y,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        row.setDepth(0)
        this.reattachRowToPalette(row)
      },
    })
  }

  private placeComponent(row: Phaser.GameObjects.Container, item: PaletteItem, slot: CircuitSlot) {
    const state = this.state
    audio.play('pencil')
    state.filledSlots.add(slot.id)
    state.paletteRows.delete(item.id)

    this.scene.tweens.add({
      targets: row,
      x: slot.x,
      y: slot.y,
      angle: 0,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        row.destroy()
        this.ctx.unregisterInteractive(row)
        this.drawSymbol(slot)
        this.revealReadyWires()
        this.reflowPalette()

        // Circuit's done, but the level isn't "solved" — and Lanjut doesn't
        // enable — until the etiket is unlocked and dragged into place too.
        if (state.filledSlots.size === state.level.slots.length) this.unlockEtiket()
      },
    })

    this.hideGhost(slot.id)
  }

  private drawSymbol(slot: CircuitSlot) {
    const gfx = this.scene.add.graphics({ x: slot.x, y: slot.y })

    if (slot.kind === 'resistor') {
      // Canonical symbol is drawn horizontal; rotate the whole Graphics to stand it up.
      if (slot.orientation === 'vertical') gfx.setAngle(90)
      drawResistorSymbol(gfx, slot.extent)
    } else if (slot.kind === 'led') {
      // +90° also flips the diode to point down-rail, which is the correct
      // anode-to-cathode direction for level 3's top-to-bottom branches.
      if (slot.orientation === 'vertical') gfx.setAngle(90)
      drawLedSymbol(gfx, slot.extent)
    } else {
      // Battery is always drawn vertical already — never rotate it.
      drawBatterySymbol(gfx, slot.extent)
    }

    this.body.add(gfx)

    const labelOffsetY = slot.orientation === 'horizontal' ? -30 : 0
    const labelOffsetX = slot.orientation === 'vertical' ? -50 : 0
    if (slot.nameLabel) {
      this.body.add(
        this.scene.add
          .text(slot.x + labelOffsetX, slot.y + labelOffsetY - (slot.orientation === 'horizontal' ? 14 : 0), slot.nameLabel, {
            fontFamily: FONT_BODY,
            fontStyle: '700',
            fontSize: '15px',
            color: MUTED_TEXT_COLOR,
            resolution: TEXT_RESOLUTION,
          })
          .setOrigin(0.5),
      )
    }
    if (slot.valueLabel) {
      const vy = slot.orientation === 'horizontal' ? slot.y + 26 : slot.y
      const vx = slot.orientation === 'horizontal' ? slot.x : slot.x + 60
      this.body.add(
        this.scene.add
          .text(vx, vy, slot.valueLabel, {
            fontFamily: FONT_BODY,
            fontStyle: '600',
            fontSize: '14px',
            color: MUTED_TEXT_COLOR,
            resolution: TEXT_RESOLUTION,
          })
          .setOrigin(0.5),
      )
    }
  }

  /** Draws (with a short trail-line animation) every wire whose endpoints are now available. */
  private revealReadyWires() {
    const state = this.state
    const allSlotIds = state.level.slots.map((slot) => slot.id)

    state.level.wires.forEach((wire) => {
      if (state.drawnWires.has(wire.id)) return
      if (!isWireReady(wire, state.filledSlots, allSlotIds)) return

      state.drawnWires.add(wire.id)
      const gfx = state.wireGraphics.get(wire.id)
      if (!gfx) return

      const from = resolveWireEnd(wire.from, state.level.slots)
      const to = resolveWireEnd(wire.to, state.level.slots)

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: WIRE_DRAW_DURATION,
        ease: 'Sine.easeOut',
        // `killTweensOf` can't reach a counter tween (its target is an
        // internal dummy, not `gfx`) — this guard is what actually stops it
        // touching a Graphics object the step transition already destroyed.
        onUpdate: (tween) => {
          if (!gfx.active) return
          drawWireProgress(gfx, from, to, tween.getValue() ?? 0)
        },
        onComplete: () => this.startWireDashLoop(wire.id, from, to),
      })
    })

    if (state.filledSlots.size === state.level.slots.length) {
      state.junctionGraphics.forEach((dot) => this.scene.tweens.add({ targets: dot, alpha: 1, duration: 200 }))
    }
  }

  /** Starts (or restarts) the marching-dash "current flowing" overlay on one completed wire. */
  private startWireDashLoop(wireId: string, from: { x: number; y: number }, to: { x: number; y: number }) {
    const state = this.state
    const overlay = state.wireDashOverlays.get(wireId)
    if (!overlay) return

    state.wireDashTweens.get(wireId)?.remove()

    const tween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: WIRE_DASH_LOOP_DURATION,
      repeat: -1,
      ease: 'Linear',
      onUpdate: (t) => {
        if (!overlay.active) return
        drawWireDashOverlay(overlay, from, to, (t.getValue() ?? 0) * DASH_PATTERN)
      },
    })
    state.wireDashTweens.set(wireId, tween)
  }

  /** Recentres the remaining, still-unplaced palette rows so a used slot doesn't leave a gap. */
  private reflowPalette() {
    const state = this.state
    const remaining = state.level.palette.filter((item) => state.paletteRows.has(item.id))
    remaining.forEach((item, index) => {
      const y = PALETTE_TOP + index * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) + PALETTE_ROW_HEIGHT / 2
      const row = state.paletteRows.get(item.id)!
      state.paletteHome.set(item.id, { x: PALETTE_CENTER_X, y })
      this.scene.tweens.add({ targets: row, y, duration: 220, ease: 'Sine.easeInOut' })
    })

    // The etiket follows the same "next open slot" rule as everything above
    // it, so it closes the gap left by a just-placed component instead of
    // sitting stranded at its original, far-down position.
    if (state.etiketRow && !state.etiketPlaced) {
      const etiketY = PALETTE_TOP + remaining.length * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) + PALETTE_ROW_HEIGHT / 2
      state.etiketHome = { x: PALETTE_CENTER_X, y: etiketY }
      this.scene.tweens.add({ targets: state.etiketRow, y: etiketY, duration: 220, ease: 'Sine.easeInOut' })
    }

    // Fewer rows now — the scrollable area shrank, so the current scroll
    // offset (if any) may need pulling back to a now-valid range.
    this.clampPaletteScroll()
  }

  /** Instantly fills an already-solved level's sheet when the learner steps back into it. */
  private fillSolvedSheet(level: CircuitLevel) {
    const state = this.state
    level.slots.forEach((slot) => {
      state.filledSlots.add(slot.id)
      this.drawSymbol(slot)
      this.hideGhost(slot.id)
    })
    level.wires.forEach((wire) => {
      state.drawnWires.add(wire.id)
      const gfx = state.wireGraphics.get(wire.id)
      if (!gfx) return
      const from = resolveWireEnd(wire.from, level.slots)
      const to = resolveWireEnd(wire.to, level.slots)
      drawWireProgress(gfx, from, to, 1)
      this.startWireDashLoop(wire.id, from, to)
    })
    state.junctionGraphics.forEach((dot) => dot.setAlpha(1))

    // Etiket was already dragged into place on the visit that solved this
    // level — render it directly, no ghost/lock/palette-row needed.
    state.etiketLocked = false
    state.etiketPlaced = true
    const ghost = state.etiketGhost
    if (ghost) {
      ghost.box.setVisible(false)
      ghost.preview.setVisible(false)
      ghost.label.setVisible(false)
      ghost.pulse.remove()
    }
    this.body.add(this.buildEtiket(level))
  }
}
