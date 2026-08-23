import Phaser from 'phaser'
import {
  attachButtonBehaviour,
  buildNextButton,
  FONT_BODY,
  FONT_HEADING,
  FONT_MONO,
  TEXT_RESOLUTION,
  type UiContext,
} from '../desainSkema/uiKit'
import { SimSlider } from './simSlider'
import {
  buildScene,
  computeCasing,
  DEFAULT_INPUT,
  RANGES,
  type Box3,
  type CasingInput,
} from './casingModel'
import {
  attachOrbitDrag,
  CAMERA_PRESETS,
  dashedLine,
  drawAxisGizmo,
  drawSolidBox,
  drawWireBox,
  project,
  projectedExtent,
  shortestEquivalentAngle,
  type Camera,
} from './box3d'

/**
 * Langkah 2 — "Parameter CAD 3D & PCB" + "Visualisasi 3D", built from the
 * Figma frame "Step 2 - Simulasi" (node 140:504) of the E-DrawLab file.
 *
 * The Figma box art is a single static, flat "Depan" pose exported as plain
 * vector paths — there is no real geometry behind it. The brief asks for the
 * opposite of a static illustration: a model the learner can drag to orbit
 * and snap between Atas/Samping/Depan/Isometrik, that reshapes live as the
 * eight sliders move. So the right panel's box is generated every repaint by
 * `box3d.ts` from `casingModel.ts`'s dimensions, rather than drawn from the
 * exported asset — same "recompute, don't trace" approach `jalurPcb/simulasiStep.ts`
 * takes for its trace preview.
 */

// ---------------------------------------------------------------------
// Palette — straight from the Figma frame's own hex values (no variables
// are bound in the file).
// ---------------------------------------------------------------------

const PANEL_WHITE = 0xffffff
const CARD_BORDER = 0xe8ecf0
const GREEN_CARD_FILL = 0xf0fdf4
const GREEN_CARD_BORDER = 0x86efac
const GREEN_TITLE = '#16a34a'
const GREEN_VALUE = 0x22c55e
const MUTED_TEXT = '#9babbf'
const PILL_BORDER = 0x66878e
const ACCENT = 0x0c6179
const ACCENT_TEXT = '#0c6179'
const CREAM_TEXT = '#faf3e7'
const CHIP_BG = 0x0c6179
const CHIP_BORDER = 0x0c6179
const LEGEND_TEXT = '#64748b'

const AMBER = 0xb45309
const BLUE = 0x3b82f6
const PURPLE = 0xa855f7
const SLATE = 0x64748b

const CASING_COLOR = 0x0c6179
const VOID_COLOR = 0xca8a04
const PCB_COLOR = 0x22c55e
const COMPONENT_COLOR = 0xa855f7
const PILLAR_COLOR = 0x94a3b8

// ---------------------------------------------------------------------
// Layout — lifted from Figma's "Container" 143:697 (a 1549px row centered
// on the design frame, matching MateriStep's own ROW_LEFT convention).
// ---------------------------------------------------------------------

// Both panels were grown from Figma's authored 442px height to 580px: the
// frame's own numbers left a lot of dead space on a 1920x1080 stage, and
// feedback asked for the 3D preview specifically to fill more of it.
const LEFT_PANEL = { x: 206, y: 271, width: 649, height: 580 }
const RIGHT_PANEL = { x: 871, y: 271, width: 844, height: 580 }
const PANEL_RADIUS = 24
const CARD_SHADOW_ALPHA = 0.06

const BODY_PAD = 28
const PCB_SLIDER_WIDTH = 561
const LOWER_SLIDER_WIDTH = 593
/** Row pitch inside the "Ukuran PCB Dinamis" card — wider than Figma's own 36px so stacked sliders don't crowd each other. */
const PCB_ROW_STRIDE = 46
const PCB_CARD_HEIGHT = 195
/** Row pitch for the five plain sliders below it. `LEFT_PANEL.height` leaves ~60px of trailing space below the last one, up from Figma's near-zero bottom padding. */
const LOWER_ROW_STRIDE = 50

const CAMERA_KEYS = ['atas', 'samping', 'depan', 'isometrik'] as const
type CameraKey = (typeof CAMERA_KEYS)[number]
const CAMERA_LABEL: Record<CameraKey, string> = { atas: 'Atas', samping: 'Samping', depan: 'Depan', isometrik: 'Isometrik' }

const AXIS_KEYS = ['x', 'y', 'z'] as const
type AxisKey = (typeof AXIS_KEYS)[number]
/** Matches `box3d.ts`'s own `AXIS_TIPS` colors — kept as a separate copy since that module has no Phaser Text of its own to color. */
const AXIS_LABEL_COLOR: Record<AxisKey, string> = { x: '#dc2626', y: '#15803d', z: '#1d4ed8' }

/** Camera-row pill sizing — deliberately generous: cramped pills (Figma's own 34px-tall, text-width-fitted ones) were easy to miss-click, especially "Depan" wedged between two wider neighbors. */
const PILL_HEIGHT = 46
const PILL_WIDTH = 136
const PILL_GAP = 14
const CAMERA_ROW_Y = 22
const CAMERA_ROW_HEIGHT = PILL_HEIGHT

const VIEWPORT_LOCAL = { x: 1, y: CAMERA_ROW_Y + CAMERA_ROW_HEIGHT + 32, width: 842, height: 0 }
const LEGEND_HEIGHT = 46
VIEWPORT_LOCAL.height = RIGHT_PANEL.height - VIEWPORT_LOCAL.y - LEGEND_HEIGHT

/** True geometric center of the viewport — `paintViewport` re-anchors the casing's own center onto this point every repaint, not world (0,0,0) (see its comment). */
const VIEWPORT_ORIGIN = { x: VIEWPORT_LOCAL.x + VIEWPORT_LOCAL.width / 2, y: VIEWPORT_LOCAL.y + VIEWPORT_LOCAL.height / 2 }
const FIT_WIDTH = VIEWPORT_LOCAL.width * 0.6
const FIT_HEIGHT = VIEWPORT_LOCAL.height * 0.74
const GIZMO_ORIGIN = { x: VIEWPORT_LOCAL.x + VIEWPORT_LOCAL.width * 0.09, y: VIEWPORT_LOCAL.y + VIEWPORT_LOCAL.height * 0.86 }
const GIZMO_ARM = 30

/** Local y (within the right panel) where the legend row starts — right after the viewport. */
const LEGEND_LOCAL_Y = VIEWPORT_LOCAL.y + VIEWPORT_LOCAL.height
const LEGEND_ITEMS: { key: 'casing' | 'void' | 'pcb' | 'komp' | 'pilar'; label: string; x: number }[] = [
  { key: 'casing', label: 'Casing', x: 258 },
  { key: 'void', label: 'Void', x: 337 },
  { key: 'pcb', label: 'PCB', x: 402 },
  { key: 'komp', label: 'Komp', x: 467 },
  { key: 'pilar', label: 'Pilar', x: 540 },
]

interface SliderSpec {
  key: keyof CasingInput
  label: string
  color: number
  decimals: number
}

const PCB_SLIDERS: SliderSpec[] = [
  { key: 'pcbLength', label: 'Panjang PCB (X)', color: GREEN_VALUE, decimals: 0 },
  { key: 'pcbWidth', label: 'Lebar PCB (Y)', color: GREEN_VALUE, decimals: 0 },
  { key: 'pcbThickness', label: 'Tebal Papan PCB (Z)', color: GREEN_VALUE, decimals: 1 },
]

const LOWER_SLIDERS: SliderSpec[] = [
  { key: 'sideClearance', label: 'Celah Samping', color: AMBER, decimals: 0 },
  { key: 'wallThickness', label: 'Tebal Dinding', color: BLUE, decimals: 0 },
  { key: 'componentHeight', label: 'Tinggi Komponen', color: PURPLE, decimals: 0 },
  { key: 'pillarHeight', label: 'Tinggi Pilar', color: SLATE, decimals: 0 },
  { key: 'topClearance', label: 'Celah Bebas Atas', color: AMBER, decimals: 0 },
]

export class SimulasiStep {
  private ctx: UiContext

  private input: CasingInput = { ...DEFAULT_INPUT }
  private camera: Camera = { ...CAMERA_PRESETS.isometrik }
  private activeView: CameraKey | null = 'isometrik'

  private sliders: SimSlider[] = []
  private orbitDrag?: { destroy: () => void }
  private snapTween?: Phaser.Tweens.Tween

  private pcbBadgeValue!: Phaser.GameObjects.Text
  private dimensionChipText!: Phaser.GameObjects.Text
  private cameraPills = new Map<CameraKey, { gfx: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; width: number }>()
  private sceneGfx!: Phaser.GameObjects.Graphics
  private gizmoLabels = new Map<AxisKey, Phaser.GameObjects.Text>()

  constructor(ctx: UiContext) {
    this.ctx = ctx
  }

  render(body: Phaser.GameObjects.Container, onNext: () => void) {
    body.add([this.buildLeftPanel(), this.buildRightPanel(), buildNextButton(this.ctx, true, onNext)])
    this.refresh()
  }

  teardown() {
    this.sliders.forEach((slider) => slider.destroy())
    this.sliders = []
    this.orbitDrag?.destroy()
    this.orbitDrag = undefined
    this.snapTween?.remove()
    this.snapTween = undefined
  }

  // ---------------------------------------------------------------------
  // Shared builders
  // ---------------------------------------------------------------------

  private text(x: number, y: number, value: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
    return this.ctx.scene.add.text(x, y, value, { fontFamily: FONT_BODY, resolution: TEXT_RESOLUTION, ...style })
  }

  private card(x: number, y: number, width: number, height: number, fill: number, radius: number) {
    return this.ctx.scene.add
      .graphics()
      .fillStyle(0x000000, CARD_SHADOW_ALPHA)
      .fillRoundedRect(x + 1, y + 3, width, height, radius)
      .fillStyle(fill, 1)
      .fillRoundedRect(x, y, width, height, radius)
      .lineStyle(1, CARD_BORDER, 1)
      .strokeRoundedRect(x, y, width, height, radius)
  }

  // ---------------------------------------------------------------------
  // Left column — "Parameter CAD 3D & PCB"
  // ---------------------------------------------------------------------

  private buildLeftPanel() {
    const scene = this.ctx.scene
    const panel = scene.add.container(LEFT_PANEL.x, LEFT_PANEL.y)
    panel.add(this.card(0, 0, LEFT_PANEL.width, LEFT_PANEL.height, PANEL_WHITE, PANEL_RADIUS))

    const icon = scene.add.image(BODY_PAD + 9, BODY_PAD + 9, 'cad-casing-icon-parameter').setDisplaySize(18, 18)
    const title = this.text(BODY_PAD + 26, BODY_PAD, 'Parameter CAD 3D & PCB', {
      fontStyle: '700',
      fontSize: '15px',
      color: ACCENT_TEXT,
    })
    panel.add([icon, title])

    panel.add(this.buildPcbCard(BODY_PAD, BODY_PAD + 34))
    panel.add(this.buildLowerSliders(BODY_PAD, BODY_PAD + 34 + PCB_CARD_HEIGHT + 28))

    return panel
  }

  private buildPcbCard(x: number, y: number) {
    const scene = this.ctx.scene
    const width = LEFT_PANEL.width - BODY_PAD * 2
    const height = PCB_CARD_HEIGHT
    const group = scene.add.container(x, y)

    const bg = scene.add
      .graphics()
      .fillStyle(GREEN_CARD_FILL, 1)
      .fillRoundedRect(0, 0, width, height, 16)
      .lineStyle(1, GREEN_CARD_BORDER, 1)
      .strokeRoundedRect(0, 0, width, height, 16)

    const badgeTitle = this.text(16, 14, 'Ukuran PCB Dinamis', { fontStyle: '700', fontSize: '13px', color: GREEN_TITLE })
    this.pcbBadgeValue = this.text(width - 16, 15.5, '', {
      fontFamily: FONT_MONO,
      fontStyle: '500',
      fontSize: '11px',
      color: '#22c55e',
    }).setOrigin(1, 0)

    group.add([bg, badgeTitle, this.pcbBadgeValue])

    PCB_SLIDERS.forEach((spec, index) => {
      const slider = new SimSlider(this.ctx, {
        x: 16,
        y: 50 + index * PCB_ROW_STRIDE,
        width: PCB_SLIDER_WIDTH,
        label: spec.label,
        range: RANGES[spec.key],
        value: this.input[spec.key],
        trackColor: spec.color,
        formatValue: (value) => `${value.toFixed(spec.decimals)} mm`,
        onChange: (value) => {
          this.input = { ...this.input, [spec.key]: value }
          this.refresh()
        },
      })
      this.sliders.push(slider)
      group.add(slider.container)
    })

    return group
  }

  private buildLowerSliders(x: number, y: number) {
    const scene = this.ctx.scene
    const group = scene.add.container(x, y)

    LOWER_SLIDERS.forEach((spec, index) => {
      const slider = new SimSlider(this.ctx, {
        x: 0,
        y: index * LOWER_ROW_STRIDE,
        width: LOWER_SLIDER_WIDTH,
        label: spec.label,
        range: RANGES[spec.key],
        value: this.input[spec.key],
        trackColor: spec.color,
        formatValue: (value) => `${value.toFixed(spec.decimals)} mm`,
        onChange: (value) => {
          this.input = { ...this.input, [spec.key]: value }
          this.refresh()
        },
      })
      this.sliders.push(slider)
      group.add(slider.container)
    })

    return group
  }

  // ---------------------------------------------------------------------
  // Right column — "Visualisasi 3D"
  // ---------------------------------------------------------------------

  private buildRightPanel() {
    const scene = this.ctx.scene
    const panel = scene.add.container(RIGHT_PANEL.x, RIGHT_PANEL.y)
    panel.add(this.card(0, 0, RIGHT_PANEL.width, RIGHT_PANEL.height, PANEL_WHITE, PANEL_RADIUS))

    panel.add(this.buildCameraRow())

    const caption = this.text(20, CAMERA_ROW_Y + CAMERA_ROW_HEIGHT + 10, 'Klik untuk melihat sudut tertentu, atau seret gambar untuk memutar bebas.', {
      fontStyle: 'italic 400',
      fontSize: '11px',
      color: MUTED_TEXT,
    })
    panel.add(caption)

    const viewportBg = scene.add
      .graphics()
      .fillStyle(0xfefcf8, 1)
      .fillRect(1, VIEWPORT_LOCAL.y, RIGHT_PANEL.width - 2, VIEWPORT_LOCAL.height)
      .lineStyle(1, ACCENT, 0.15)
      .lineBetween(0, VIEWPORT_LOCAL.y, RIGHT_PANEL.width, VIEWPORT_LOCAL.y)
      .lineBetween(0, LEGEND_LOCAL_Y, RIGHT_PANEL.width, LEGEND_LOCAL_Y)
    panel.add(viewportBg)

    this.sceneGfx = scene.add.graphics()
    panel.add(this.sceneGfx)
    panel.add(this.buildAxisLabels())

    panel.add(this.buildDimensionChip())

    const zone = scene.add
      .zone(VIEWPORT_LOCAL.x + VIEWPORT_LOCAL.width / 2, VIEWPORT_LOCAL.y + VIEWPORT_LOCAL.height / 2, VIEWPORT_LOCAL.width, VIEWPORT_LOCAL.height)
      .setInteractive({ useHandCursor: true })
    panel.add(zone)
    this.orbitDrag = attachOrbitDrag(
      this.ctx,
      zone,
      this.camera,
      () => this.paintViewport(),
      () => this.clearActiveView(),
    )

    panel.add(this.buildLegend())

    return panel
  }

  /**
   * Uniform-width pills (not text-fitted, per-label widths) so every button
   * — "Depan" included, wedged between two longer labels — gets the same
   * generous hit target.
   *
   * Every button here is centered on its own container position, with
   * children drawn from `-width/2` to `width/2` — NOT left-aligned from
   * `(0, 0)`. That matters more than usual for a `Container`: Phaser hard-codes
   * a Container's `displayOriginX/Y` to its own center regardless of where its
   * children actually sit (`originX`/`originY` are the one part of a Container
   * you can't override), and the default `setInteractive()` hit-test rectangle
   * is placed relative to that center. Draw children left-aligned from (0,0)
   * on a Container built this way and the *visual* pill and its *clickable*
   * rectangle disagree by half a pill's width — exactly the "hitbox is
   * offset onto the neighboring button" bug reported here. Every other
   * button in this codebase (`uiKit.ts`'s `buildActionButton`/`buildNextButton`,
   * `jalurPcb/simulasiStep.ts`'s segmented controls) already draws centered
   * for this reason; these pills didn't, until now.
   */
  private buildCameraRow() {
    const scene = this.ctx.scene
    const group = scene.add.container(20, CAMERA_ROW_Y)

    CAMERA_KEYS.forEach((key, index) => {
      const iconKey = `cad-casing-icon-${key}`
      const label = CAMERA_LABEL[key]
      const gfx = scene.add.graphics()
      const icon = scene.add.image(0, 0, iconKey).setDisplaySize(15, 15)
      const text = this.text(0, 0, label, {
        fontFamily: FONT_HEADING,
        fontStyle: '700',
        fontSize: '14px',
        color: '#66878e',
      }).setOrigin(0, 0.5)

      const contentWidth = 15 + 10 + text.width
      const startX = -contentWidth / 2
      icon.setPosition(startX + 7.5, 0)
      text.setPosition(startX + 15 + 10, 0)

      const centerX = index * (PILL_WIDTH + PILL_GAP) + PILL_WIDTH / 2
      const button = scene.add.container(centerX, PILL_HEIGHT / 2, [gfx, icon, text])
      button.setSize(PILL_WIDTH, PILL_HEIGHT)
      attachButtonBehaviour(this.ctx, button, () => this.setView(key))

      this.cameraPills.set(key, { gfx, text, width: PILL_WIDTH })
      group.add(button)
    })

    const resetIcon = scene.add.image(0, 0, 'cad-casing-icon-reset').setDisplaySize(14, 14)
    const resetText = this.text(0, 0, 'Reset Tampilan', {
      fontFamily: FONT_BODY,
      fontStyle: '600',
      fontSize: '13px',
      color: ACCENT_TEXT,
    }).setOrigin(0, 0.5)
    const resetWidth = 26 + resetText.width + 24
    resetIcon.setPosition(-resetWidth / 2 + 13, 0)
    resetText.setPosition(-resetWidth / 2 + 26, 0)
    const resetGfx = scene.add
      .graphics()
      .lineStyle(1.5, PILL_BORDER, 0.6)
      .strokeRoundedRect(-resetWidth / 2 + 0.5, -PILL_HEIGHT / 2 + 0.5, resetWidth - 1, PILL_HEIGHT - 1, PILL_HEIGHT / 2)
    // `group` sits at local x=20 (see above) and this container is centered, so its
    // center lands `resetWidth/2` short of a plain right-edge alignment — land its
    // right edge 20px from the panel's own right edge (40 total, backing out `group`'s 20).
    const resetCenterX = RIGHT_PANEL.width - 40 - resetWidth / 2
    const resetButton = scene.add.container(resetCenterX, PILL_HEIGHT / 2, [resetGfx, resetIcon, resetText])
    resetButton.setSize(resetWidth, PILL_HEIGHT)
    attachButtonBehaviour(this.ctx, resetButton, () => this.setView('isometrik'))

    group.add(resetButton)
    return group
  }

  /** X/Y/Z text for the orientation gizmo — Figma pairs each arrow with a label, which the earlier pass dropped. Positioned every repaint in `paintViewport`, tracking each arrow's rotated tip. */
  private buildAxisLabels() {
    const group = this.ctx.scene.add.container(0, 0)
    AXIS_KEYS.forEach((key) => {
      const label = this.text(0, 0, key.toUpperCase(), {
        fontFamily: FONT_MONO,
        fontStyle: '700',
        fontSize: '10px',
        color: AXIS_LABEL_COLOR[key],
      }).setOrigin(0.5)
      this.gizmoLabels.set(key, label)
      group.add(label)
    })
    return group
  }

  private buildDimensionChip() {
    const scene = this.ctx.scene
    const width = 210
    const x = VIEWPORT_LOCAL.x + VIEWPORT_LOCAL.width - 16 - width
    const y = VIEWPORT_LOCAL.y + 12

    const bg = scene.add
      .graphics()
      .fillStyle(CHIP_BG, 0.08)
      .fillRoundedRect(x, y, width, 32, 12)
      .lineStyle(1, CHIP_BORDER, 0.18)
      .strokeRoundedRect(x, y, width, 32, 12)

    this.dimensionChipText = this.text(x + 12, y + 8, '', {
      fontFamily: FONT_MONO,
      fontStyle: '500',
      fontSize: '11.5px',
      color: ACCENT_TEXT,
    })

    return scene.add.container(0, 0, [bg, this.dimensionChipText])
  }

  private buildLegend() {
    const scene = this.ctx.scene
    const group = scene.add.container(0, LEGEND_LOCAL_Y + 16)
    const swatchColors: Record<string, number> = { casing: CASING_COLOR, void: VOID_COLOR, pcb: PCB_COLOR, komp: COMPONENT_COLOR, pilar: PILLAR_COLOR }

    LEGEND_ITEMS.forEach((item) => {
      const swatch = scene.add.graphics()
      const color = swatchColors[item.key]
      if (item.key === 'void') {
        swatch.lineStyle(1.5, color, 1)
        const size = 14
        // Tighter dash/gap than the 3D view's edges — at 14px a 5/4 pattern only fits one dash per side.
        dashedLine(swatch, { x: item.x, y: 0 }, { x: item.x + size, y: 0 }, 2.5, 2)
        dashedLine(swatch, { x: item.x + size, y: 0 }, { x: item.x + size, y: size }, 2.5, 2)
        dashedLine(swatch, { x: item.x + size, y: size }, { x: item.x, y: size }, 2.5, 2)
        dashedLine(swatch, { x: item.x, y: size }, { x: item.x, y: 0 }, 2.5, 2)
      } else {
        swatch.fillStyle(color, 1).fillRoundedRect(item.x, 0, 14, 14, 4)
      }
      const label = this.text(item.x + 20, -1, item.label, { fontSize: '11.5px', color: LEGEND_TEXT })
      group.add([swatch, label])
    })

    return group
  }

  // ---------------------------------------------------------------------
  // Camera state
  // ---------------------------------------------------------------------

  private setView(key: CameraKey) {
    const preset = CAMERA_PRESETS[key]
    this.activeView = key
    this.paintCameraPills()

    this.snapTween?.remove()
    const targetYaw = shortestEquivalentAngle(this.camera.yaw, preset.yaw)
    this.snapTween = this.ctx.scene.tweens.add({
      targets: this.camera,
      pitch: preset.pitch,
      yaw: targetYaw,
      duration: 420,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.paintViewport(),
    })
  }

  private clearActiveView() {
    this.snapTween?.remove()
    this.snapTween = undefined
    if (this.activeView === null) return
    this.activeView = null
    this.paintCameraPills()
  }

  // ---------------------------------------------------------------------
  // Repaint
  // ---------------------------------------------------------------------

  private refresh() {
    const dims = computeCasing(this.input)
    this.pcbBadgeValue.setText(`${this.input.pcbLength.toFixed(0)} × ${this.input.pcbWidth.toFixed(0)} × ${this.input.pcbThickness.toFixed(1)} mm`)
    this.dimensionChipText.setText(`Casing: ${fmt(dims.x)} × ${fmt(dims.y)} × ${fmt(dims.z)} mm`)
    this.paintCameraPills()
    this.paintViewport()
  }

  private paintCameraPills() {
    this.cameraPills.forEach(({ gfx, text, width }, key) => {
      const active = key === this.activeView
      gfx.clear()
      if (active) {
        gfx.fillStyle(ACCENT, 1).fillRoundedRect(-width / 2, -PILL_HEIGHT / 2, width, PILL_HEIGHT, PILL_HEIGHT / 2)
      } else {
        gfx.lineStyle(1.5, PILL_BORDER, 0.6).strokeRoundedRect(-width / 2 + 0.5, -PILL_HEIGHT / 2 + 0.5, width - 1, PILL_HEIGHT - 1, PILL_HEIGHT / 2)
      }
      text.setColor(active ? CREAM_TEXT : '#66878e')
    })
  }

  /** Recomputes the box scene and repaints the whole viewport — sliders, camera snap tweens and orbit drag all funnel here. */
  private paintViewport() {
    const casingScene = buildScene(this.input)
    const gfx = this.sceneGfx
    gfx.clear()

    const extent = projectedExtent(casingScene.casing, this.camera)
    const scale = Math.max(Math.min(FIT_WIDTH / Math.max(extent.width, 1), FIT_HEIGHT / Math.max(extent.height, 1)), 0.1)

    // `casingModel.ts` builds every box on a floor at z=0, so the casing's own
    // center sits at z=dims.z/2, not at world (0,0,0). Projecting straight
    // onto `VIEWPORT_ORIGIN` therefore lands (0,0,0) — not the box's actual
    // middle — in the viewport's center, which visibly overflows the casing
    // toward +Z on every camera angle except a dead-on top-down one. Re-anchor
    // by the amount the casing's true center itself projects away from world
    // origin, so what's actually centered is the box, not an arbitrary corner.
    const centerShift = project(casingScene.casing.center, this.camera, scale, { x: 0, y: 0 })
    const drawOrigin = { x: VIEWPORT_ORIGIN.x - centerShift.x, y: VIEWPORT_ORIGIN.y - centerShift.y }

    drawWireBox(gfx, casingScene.casing, this.camera, scale, drawOrigin, { color: CASING_COLOR, alpha: 0.85, lineWidth: 1.5 })
    drawWireBox(gfx, casingScene.void, this.camera, scale, drawOrigin, { color: VOID_COLOR, alpha: 0.55, lineWidth: 1.2, dashed: true })

    const pillars = [...casingScene.pillars].sort((a, b) => depthOf(b, this.camera) - depthOf(a, this.camera))
    pillars.forEach((pillar) => drawSolidBox(gfx, pillar, this.camera, scale, drawOrigin, { fill: PILLAR_COLOR }))
    drawSolidBox(gfx, casingScene.pcb, this.camera, scale, drawOrigin, { fill: PCB_COLOR })
    drawSolidBox(gfx, casingScene.component, this.camera, scale, drawOrigin, { fill: COMPONENT_COLOR })

    // The gizmo stays anchored to its own fixed viewport corner — it marks world
    // orientation, not the box's position, so it does NOT use `drawOrigin`.
    const gizmo = drawAxisGizmo(gfx, this.camera, GIZMO_ORIGIN, GIZMO_ARM)
    AXIS_KEYS.forEach((key) => {
      const tip = gizmo.tips[key]
      const dx = tip.x - gizmo.origin.x
      const dy = tip.y - gizmo.origin.y
      const len = Math.hypot(dx, dy) || 1
      this.gizmoLabels.get(key)?.setPosition(tip.x + (dx / len) * 9, tip.y + (dy / len) * 9)
    })
  }
}

function depthOf(box: Box3, camera: Camera) {
  return project(box.center, camera, 1, { x: 0, y: 0 }).depth
}

/** Trims a computed mm value to one decimal without a trailing ".0" — matches `jalurPcb`'s `boundFormatter` trimming. */
function fmt(value: number) {
  return String(Number(value.toFixed(1)))
}
