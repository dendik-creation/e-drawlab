import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import {
  applyStageCamera,
  stage,
  stageBounds,
  stageOverscan,
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  STAGE_RESIZE_EVENT,
} from '../stage'
import { coverFit } from '../coverFit'
import { BubbleSequence } from '../bubble'
import { audio } from '../audio/AudioDirector'
import { settings, SETTINGS_CHANGED_EVENT, toggleMute } from '../state/settings'
import { session } from '../state/session'
import { isMenuCompleted } from '../state/progress'
import homeBgUrl from '../../../assets/images/05_backgrounds/home_bg.png'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.png'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.png'
import menuDesainSkemaUrl from '../../../assets/images/01_menu_buttons/menu_desain_skema.png'
import menuJalurPcbUrl from '../../../assets/images/01_menu_buttons/menu_jalur_pcb.png'
import menuCadCasingUrl from '../../../assets/images/01_menu_buttons/menu_cad_casing.png'
import menuEvaluasiAkhirUrl from '../../../assets/images/01_menu_buttons/menu_evaluasi_akhir.png'
import menuKeluarUrl from '../../../assets/images/01_menu_buttons/menu_keluar.png'
import badgeChecklistUrl from '../../../assets/images/03_electronic_assets/badge_checklist.png'

/**
 * Textures the Home scene draws, minus `main-logo` which Boot already loads.
 * Splash queues these behind its progress bar so Home can paint on frame one.
 */
const HOME_TEXTURES: Record<string, string> = {
  'home-bg': homeBgUrl,
  'bgm-on': bgmOnUrl,
  'bgm-off': bgmOffUrl,
  'menu-desain-skema': menuDesainSkemaUrl,
  'menu-jalur-pcb': menuJalurPcbUrl,
  'menu-cad-casing': menuCadCasingUrl,
  'menu-evaluasi-akhir': menuEvaluasiAkhirUrl,
  'menu-keluar': menuKeluarUrl,
  'badge-checklist': badgeChecklistUrl,
}

export function queueHomeTextures(scene: Phaser.Scene) {
  Object.entries(HOME_TEXTURES).forEach(([key, url]) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  })
}

/*
 * The menu panel is a clipboard: a board with a printed sheet under a metal
 * clip. It keeps the Figma frame's width and horizontal position, but reaches
 * higher than the original flat rectangle so the sheet can carry the logo too —
 * a clip landing behind the wordmark would read as an accident.
 */

/**
 * Drops board, sheet, logo and menu down the design frame together, evening out
 * the margin above the clip against the one below the board. It appears in both
 * BOARD_Y and every child's coordinate, so it cancels out of the local geometry
 * and only affects where the prop is anchored.
 */
const CLIPBOARD_OFFSET_Y = 40

const BOARD_X = 447.5
const BOARD_Y = 488 + CLIPBOARD_OFFSET_Y
const BOARD_WIDTH = 533
const BOARD_HEIGHT = 820
const BOARD_RADIUS = 30
const BOARD_RIM = 0xb9b1a4
const BOARD_FACE = 0xd9d3c9
/** Face sits inside the rim and nudged up-left, so the wider bottom-right edge reads as thickness. */
const BOARD_RIM_THICKNESS = 5
const BOARD_FACE_OFFSET_X = -2
const BOARD_FACE_OFFSET_Y = -3
const BOARD_SHADOW_OFFSET_X = 4
const BOARD_SHADOW_OFFSET_Y = 7
const BOARD_SHADOW_ALPHA = 0.15

const PAPER_INSET_X = 22
const PAPER_INSET_TOP = 40
const PAPER_INSET_BOTTOM = 26
const PAPER_RADIUS = 10
const PAPER_FILL = 0xfbf0dc
const PAPER_EDGE = 0xece0c8
const PAPER_SHADOW_ALPHA = 0.1

const CLIP_WIDTH = 172
const CLIP_HEIGHT = 98
const CLIP_RADIUS = 14
const CLIP_FILL = 0x2b909f
const CLIP_EDGE = 0x1d6f7c
const CLIP_SHADOW_ALPHA = 0.12
const CLIP_BAR_WIDTH = 156
const CLIP_BAR_HEIGHT = 18
const CLIP_BAR_RADIUS = 7
const CLIP_BAR_OFFSET_Y = 28
const CLIP_HOLE_OFFSET_Y = -22
const CLIP_HOLE_RADIUS = 12
const CLIP_HOLE_FILL = 0x14535e

// Sized to clear the sheet's top edge and the first menu button; the Figma
// dimensions overflowed both once the logo moved onto the paper.
const LOGO_X = 447.5
const LOGO_Y = 208.5 + CLIPBOARD_OFFSET_Y
const LOGO_WIDTH = 447
const LOGO_HEIGHT = 149

// Idle rock: the logo tips to one side, then swings across to the other and
// back, forever, once the entrance has landed. Kept to a few degrees — the
// logo is wide, so its corners travel a long way per degree of rotation.
const LOGO_IDLE_ANGLE = 4
const LOGO_IDLE_SETTLE_DURATION = 1000
const LOGO_IDLE_SWING_DURATION = 2600

const BGM_X = 1810.5
const BGM_Y = 65
const BGM_ON_WIDTH = 147
const BGM_ON_HEIGHT = 66
const BGM_OFF_WIDTH = 157
const BGM_OFF_HEIGHT = 70

const HOVER_SCALE = 1.05
const HOVER_DURATION = 150
const PRESS_SCALE = 0.92
const PRESS_DOWN_DURATION = 90
const PRESS_UP_DURATION = 180

/** Menu entries in design-space geometry, top to bottom, sliced from the Figma frame. */
const MENU_ITEMS = [
  { action: 'desain-skema', texture: 'menu-desain-skema', x: 444.5, y: 343, width: 337, height: 88 },
  { action: 'jalur-pcb', texture: 'menu-jalur-pcb', x: 444.5, y: 452, width: 337, height: 89 },
  { action: 'cad-casing', texture: 'menu-cad-casing', x: 444.5, y: 561.5, width: 341, height: 89 },
  { action: 'evaluasi-akhir', texture: 'menu-evaluasi-akhir', x: 445, y: 672.5, width: 331, height: 89 },
  { action: 'keluar', texture: 'menu-keluar', x: 444.5, y: 782.5, width: 337, height: 95 },
] as const

export type HomeMenuAction = (typeof MENU_ITEMS)[number]['action']

/** "Sudah dipelajari" badge — straddles a completed menu button's top-right corner, same overlap trick as the clip on the sheet. */
const BADGE_SIZE = 44
const BADGE_INSET_X = 14
const BADGE_INSET_Y = 10

// Responsive layout. Everything below is expressed relative to the clipboard's
// centre, which is the content container's origin.
const CLIPBOARD_TOP_EXTENT = BOARD_HEIGHT / 2 + CLIP_HEIGHT / 2
const CLIPBOARD_BOTTOM_EXTENT = BOARD_HEIGHT / 2
/** Breathing room kept between the prop and the stage edge, in design units. */
const CLIPBOARD_MARGIN = 40
/** Share of the stage height the prop may occupy before it stops growing. */
const CLIPBOARD_MAX_HEIGHT_FRACTION = 0.92
/** Ceiling on overscan growth, so a very tall viewport cannot balloon the menu. */
const MAX_CONTENT_SCALE = 1.35

/** HUD anchor distances, measured from the design frame's top-right corner. */
const HUD_INSET_X = DESIGN_WIDTH - BGM_X
const HUD_INSET_Y = BGM_Y

/**
 * Home menu. Every element bubbles in staggered on load, and bubbles back out
 * staggered when a menu item is picked — the scene deliberately does NOT
 * navigate afterwards; it emits `home-exit-complete` with the chosen action so
 * the destination scenes can be wired up later.
 */
export class Home extends Phaser.Scene {
  private bubbles!: BubbleSequence
  private background!: Phaser.GameObjects.Image
  /** Clipboard, logo and menu — one unit, scaled and anchored to the stage. */
  private content!: Phaser.GameObjects.Container
  /** Screen-corner furniture, anchored independently of the menu. */
  private hud!: Phaser.GameObjects.Container
  private interactives: (Phaser.GameObjects.Image | Phaser.GameObjects.Container)[] = []
  private bgmToggle!: Phaser.GameObjects.Image
  private exiting = false

  constructor() {
    super('Home')
  }

  preload() {
    queueHomeTextures(this)
  }

  create() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#faf3e7')

    session.set({ currentScene: 'Home' })
    audio.setProfile('menu')

    // The Scene instance is reused across visits — Phaser calls create() again
    // rather than reconstructing the class — so state left over from a
    // previous visit must be cleared explicitly here.
    this.interactives = []
    this.exiting = false

    // Fitted to the stage, not the design frame, so it bleeds into whatever
    // extra width or height the viewport's aspect ratio adds. Barely scales
    // during the entrance, so no canvas edge is ever exposed behind it.
    this.background = this.add.image(960, 540, 'home-bg')
    this.bubbles = new BubbleSequence(this)
    this.bubbles.add(coverFit(this.background, stage.width, stage.height), {
      scaleFrom: 1.04,
    })

    this.content = this.add.container(0, 0)
    this.hud = this.add.container(0, 0)

    // Children are positioned relative to the clipboard's centre. Both design
    // constants carry CLIPBOARD_OFFSET_Y, so it cancels out of every local
    // coordinate and only the container's own placement decides the framing.
    const clipboard = this.bubbles.add(this.buildClipboard())

    const logo = this.bubbles.add(
      coverFit(
        this.add.image(LOGO_X - BOARD_X, LOGO_Y - BOARD_Y, 'main-logo'),
        LOGO_WIDTH,
        LOGO_HEIGHT,
      ),
    )

    this.bubbles.add(this.buildBgmToggle())

    const buttons = MENU_ITEMS.map((item) => {
      // MENU_ITEMS keeps the raw Figma coordinates so they stay traceable.
      const buttonX = item.x - BOARD_X
      const buttonY = item.y + CLIPBOARD_OFFSET_Y - BOARD_Y
      const button = this.add.image(0, 0, item.texture).setDisplaySize(item.width, item.height)

      // "Sudah dipelajari" badge, straddling the button's top-right corner —
      // only markMenuCompleted() (DesainSkema.ts, on reaching evaluasi) has
      // ever set one so far, but every menu item is checked generically so
      // future steps light up without touching Home again. It rides inside
      // the same wrapper Container as the button rather than sitting beside
      // it as its own bubble/hover target — a badge that scales and fades on
      // its own schedule reads as pasted on; parented like this, it inherits
      // every transform (bubble in/out, hover, press) the button gets, for
      // free, with zero extra tweens.
      const wrapChildren: Phaser.GameObjects.Image[] = [button]
      if (isMenuCompleted(item.action)) {
        const badge = this.add
          .image(item.width / 2 - BADGE_INSET_X, -item.height / 2 + BADGE_INSET_Y, 'badge-checklist')
          .setDisplaySize(BADGE_SIZE, BADGE_SIZE)
        wrapChildren.push(badge)
      }

      const wrap = this.add.container(buttonX, buttonY, wrapChildren)
      wrap.setSize(item.width, item.height)

      this.attachButtonBehaviour(wrap, () => this.exitTo(item.action))
      this.bubbles.add(wrap)

      return wrap
    })

    this.content.add([clipboard, logo, ...buttons])
    this.hud.add(this.bgmToggle)
    this.layoutStage()

    const refit = () => this.fitToStage()
    const syncToggle = () => this.syncBgmToggle()
    EventBus.on(STAGE_RESIZE_EVENT, refit)
    EventBus.on(SETTINGS_CHANGED_EVENT, syncToggle)
    this.events.once('shutdown', () => {
      EventBus.off(STAGE_RESIZE_EVENT, refit)
      EventBus.off(SETTINGS_CHANGED_EVENT, syncToggle)
    })

    EventBus.emit('current-scene-ready', this)

    this.bubbles.playIn(() => {
      if (!settings.get().reducedMotion) this.startLogoIdle(logo)
      this.interactives.forEach((button) => button.setInteractive({ useHandCursor: true }))
    })
  }

  /** Re-centres the design frame, re-bleeds the background and re-lays out after an aspect change. */
  private fitToStage() {
    applyStageCamera(this)
    coverFit(this.background, stage.width, stage.height)
    this.bubbles.refreshBase(this.background)
    this.layoutStage()
  }

  /**
   * Scales and anchors the foreground to the stage rather than the design frame.
   *
   * At exactly 16:9 every number below collapses to its authored value, so the
   * desktop composition is untouched. Wider or taller than that, the menu grows
   * with the background instead of being left behind by it, keeps its
   * proportional margin from the real left edge, and the HUD rides the real
   * top-right corner.
   */
  private layoutStage() {
    const bounds = stageBounds()
    const propHeight = CLIPBOARD_TOP_EXTENT + CLIPBOARD_BOTTOM_EXTENT

    const scale = Math.min(
      stageOverscan(),
      MAX_CONTENT_SCALE,
      (stage.height * CLIPBOARD_MAX_HEIGHT_FRACTION) / propHeight,
    )

    // Start from the authored vertical position, then keep the prop inside the
    // stage. When the two limits cross — a prop taller than the room available —
    // the lower bound wins, which protects the menu's bottom rather than the
    // clip's decorative overhang.
    const centreY = (bounds.top + bounds.bottom) / 2
    const authoredY = centreY + (BOARD_Y - DESIGN_HEIGHT / 2) * scale
    const minY = bounds.top + (CLIPBOARD_MARGIN + CLIPBOARD_TOP_EXTENT) * scale
    const maxY = bounds.bottom - (CLIPBOARD_MARGIN + CLIPBOARD_BOTTOM_EXTENT) * scale

    this.content
      .setScale(scale)
      .setPosition(bounds.left + BOARD_X * scale, Math.min(Math.max(authoredY, minY), maxY))

    this.hud
      .setScale(scale)
      .setPosition(bounds.right - HUD_INSET_X * scale, bounds.top + HUD_INSET_Y * scale)
  }

  /**
   * Board, sheet and clip in one Graphics so the whole prop bubbles as a single
   * object. Everything is drawn around the board's centre; the clip straddles
   * the top edge and overlaps the sheet, which is what makes it read as holding
   * the paper down rather than floating above it.
   */
  private buildClipboard() {
    const halfWidth = BOARD_WIDTH / 2
    const halfHeight = BOARD_HEIGHT / 2

    const paperLeft = -halfWidth + PAPER_INSET_X
    const paperTop = -halfHeight + PAPER_INSET_TOP
    const paperWidth = BOARD_WIDTH - PAPER_INSET_X * 2
    const paperHeight = BOARD_HEIGHT - PAPER_INSET_TOP - PAPER_INSET_BOTTOM

    const clipY = -halfHeight
    const clipLeft = -CLIP_WIDTH / 2
    const clipTop = clipY - CLIP_HEIGHT / 2

    return (
      this.add
        .graphics({ x: 0, y: 0 })

        // Board: cast shadow, rim, then the lit face inset within it.
        .fillStyle(0x000000, BOARD_SHADOW_ALPHA)
        .fillRoundedRect(
          -halfWidth + BOARD_SHADOW_OFFSET_X,
          -halfHeight + BOARD_SHADOW_OFFSET_Y,
          BOARD_WIDTH,
          BOARD_HEIGHT,
          BOARD_RADIUS,
        )
        .fillStyle(BOARD_RIM, 1)
        .fillRoundedRect(-halfWidth, -halfHeight, BOARD_WIDTH, BOARD_HEIGHT, BOARD_RADIUS)
        .fillStyle(BOARD_FACE, 1)
        .fillRoundedRect(
          -halfWidth + BOARD_RIM_THICKNESS + BOARD_FACE_OFFSET_X,
          -halfHeight + BOARD_RIM_THICKNESS + BOARD_FACE_OFFSET_Y,
          BOARD_WIDTH - BOARD_RIM_THICKNESS * 2,
          BOARD_HEIGHT - BOARD_RIM_THICKNESS * 2,
          BOARD_RADIUS - BOARD_RIM_THICKNESS,
        )

        // Sheet, lifted off the board by its own contact shadow.
        .fillStyle(0x000000, PAPER_SHADOW_ALPHA)
        .fillRoundedRect(paperLeft + 2, paperTop + 3, paperWidth, paperHeight, PAPER_RADIUS)
        .fillStyle(PAPER_FILL, 1)
        .fillRoundedRect(paperLeft, paperTop, paperWidth, paperHeight, PAPER_RADIUS)
        .lineStyle(2, PAPER_EDGE, 1)
        .strokeRoundedRect(paperLeft, paperTop, paperWidth, paperHeight, PAPER_RADIUS)

        // Clip: plate, pressure bar, punched hole.
        .fillStyle(0x000000, CLIP_SHADOW_ALPHA)
        .fillRoundedRect(clipLeft + 2, clipTop + 4, CLIP_WIDTH, CLIP_HEIGHT, CLIP_RADIUS)
        .fillStyle(CLIP_FILL, 1)
        .fillRoundedRect(clipLeft, clipTop, CLIP_WIDTH, CLIP_HEIGHT, CLIP_RADIUS)
        .lineStyle(3, CLIP_EDGE, 1)
        .strokeRoundedRect(clipLeft, clipTop, CLIP_WIDTH, CLIP_HEIGHT, CLIP_RADIUS)
        .fillStyle(CLIP_EDGE, 1)
        .fillRoundedRect(
          -CLIP_BAR_WIDTH / 2,
          clipY + CLIP_BAR_OFFSET_Y - CLIP_BAR_HEIGHT / 2,
          CLIP_BAR_WIDTH,
          CLIP_BAR_HEIGHT,
          CLIP_BAR_RADIUS,
        )
        .fillStyle(CLIP_HOLE_FILL, 1)
        .fillCircle(0, clipY + CLIP_HOLE_OFFSET_Y, CLIP_HOLE_RADIUS)
    )
  }

  /**
   * The only audio control on screen, so it drives the master mute rather than
   * just the music layer — a lab full of unmutable ambience is the failure
   * Feature-Audio-System calls out. Swap `toggleMute()` for
   * `settings.set({ musicVolume: … })` if a fuller mixer ever lands.
   */
  private buildBgmToggle() {
    this.bgmToggle = this.add.image(0, 0, 'bgm-on')
    this.syncBgmToggle()

    this.attachButtonBehaviour(this.bgmToggle, () => {
      toggleMute()
      // `sfx_click` in the register, but that file does not exist yet and a
      // silent mute button reads as a broken one.
      audio.play('click')
    })

    return this.bgmToggle
  }

  private syncBgmToggle() {
    const on = !settings.get().muted

    // setTexture resets the display size, so it is re-applied per state: the
    // two pill artworks are not the same pixel size.
    this.bgmToggle
      .setTexture(on ? 'bgm-on' : 'bgm-off')
      .setDisplaySize(
        on ? BGM_ON_WIDTH : BGM_OFF_WIDTH,
        on ? BGM_ON_HEIGHT : BGM_OFF_HEIGHT,
      )
    this.bgmToggle.input?.hitArea.setSize(this.bgmToggle.width, this.bgmToggle.height)
  }

  /**
   * Hover/press feedback shared by every clickable image. Input is only enabled
   * once the entrance finishes, so a hover tween can never fight the bubble in.
   */
  private attachButtonBehaviour(button: Phaser.GameObjects.Image | Phaser.GameObjects.Container, onPress: () => void) {
    this.interactives.push(button)

    const baseScaleX = button.scaleX
    const baseScaleY = button.scaleY

    // Touch has no real hover: a tap can fire pointerover/pointerout in
    // either order around pointerdown, well inside the press tween's
    // PRESS_DOWN_DURATION window — unlike a mouse, which keeps hovering for
    // the whole click. `pressed` blocks every path here (not just the one
    // that seemed likely) from reaching killTweensOf() while the press tween
    // is in flight, since that would discard its onComplete — where
    // onPress() lives — before it runs: the tap would fire pointerdown but
    // silently never navigate.
    let pressed = false

    const scaleTo = (multiplier: number, duration: number, ease: string) => {
      if (this.exiting || pressed) return
      this.tweens.killTweensOf(button)
      this.tweens.add({
        targets: button,
        scaleX: baseScaleX * multiplier,
        scaleY: baseScaleY * multiplier,
        duration,
        ease,
      })
    }

    button.on('pointerover', () => {
      if (this.exiting) return
      audio.play('hover')
      scaleTo(HOVER_SCALE, HOVER_DURATION, 'Sine.easeOut')
    })
    button.on('pointerout', () => scaleTo(1, HOVER_DURATION, 'Sine.easeOut'))
    button.on('pointerdown', () => {
      if (this.exiting || pressed) return
      pressed = true
      this.tweens.killTweensOf(button)
      this.tweens.add({
        targets: button,
        scaleX: baseScaleX * PRESS_SCALE,
        scaleY: baseScaleY * PRESS_SCALE,
        duration: PRESS_DOWN_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => {
          pressed = false
          // onPress first: if it starts the exit, scaleTo bails out instead of
          // spawning a press-up tween that the exit would immediately kill.
          onPress()
          scaleTo(HOVER_SCALE, PRESS_UP_DURATION, 'Back.easeOut')
        },
      })
    })
  }

  private startLogoIdle(logo: Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: logo,
      angle: -LOGO_IDLE_ANGLE,
      duration: LOGO_IDLE_SETTLE_DURATION,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: logo,
          angle: LOGO_IDLE_ANGLE,
          duration: LOGO_IDLE_SWING_DURATION,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      },
    })
  }

  /** Plays the staggered exit, then announces it. Scene switching is left to the caller. */
  private exitTo(action: HomeMenuAction) {
    if (this.exiting) return
    this.exiting = true

    audio.play('click')
    EventBus.emit('home-menu', action)
    this.interactives.forEach((button) => {
      this.tweens.killTweensOf(button)
      button.disableInteractive()
    })

    this.bubbles.playOut(() => EventBus.emit('home-exit-complete', action))
  }
}
