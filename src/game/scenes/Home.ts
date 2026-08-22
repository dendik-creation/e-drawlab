import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { BaseStageScene } from './BaseStageScene'
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
import homeGradientUrl from '../../../assets/images/05_backgrounds/home_gradient.webp'
import homeBgUrl from '../../../assets/images/05_backgrounds/home_bg.webp'
import mascotUrl from '../../../assets/images/00_identity/mascot.webp'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.webp'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.webp'
import menuDesainSkemaUrl from '../../../assets/images/01_menu_buttons/menu_desain_skema.webp'
import menuJalurPcbUrl from '../../../assets/images/01_menu_buttons/menu_jalur_pcb.webp'
import menuCadCasingUrl from '../../../assets/images/01_menu_buttons/menu_cad_casing.webp'
import menuEvaluasiAkhirUrl from '../../../assets/images/01_menu_buttons/menu_evaluasi_akhir.webp'
import menuKeluarUrl from '../../../assets/images/01_menu_buttons/menu_keluar.webp'
import badgeChecklistUrl from '../../../assets/images/03_electronic_assets/badge_checklist.webp'

/**
 * Textures the Home scene draws, minus `main-logo` which Boot already loads.
 * Splash queues these behind its progress bar so Home can paint on frame one.
 */
const HOME_TEXTURES: Record<string, string> = {
  'home-gradient': homeGradientUrl,
  'home-bg': homeBgUrl,
  mascot: mascotUrl,
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
 * The menu panel is a frosted-glass card — a translucent white rounded
 * rectangle over the backdrop, with a small tab straddling its top edge
 * (the same overlap trick the old clipboard's clip used, now a plain purple
 * pill instead of a clip). Coordinates are sliced straight from the Figma
 * frame's "Group 7" (node 98:21).
 */
const BOARD_X = 444.5
const BOARD_Y = 565
const BOARD_WIDTH = 529
const BOARD_HEIGHT = 856
const BOARD_RADIUS = 56
const BOARD_FILL = 0xffffff
const BOARD_FILL_ALPHA = 0.35
const BOARD_SHADOW_OFFSET_X = 4
const BOARD_SHADOW_OFFSET_Y = 4
const BOARD_SHADOW_ALPHA = 0.12
/** No real backdrop-blur in Phaser's Graphics — a soft light stroke stands in for the CSS inset glow. */
const BOARD_GLOW_ALPHA = 0.5

const TAB_WIDTH = 270
const TAB_HEIGHT = 87
const TAB_RADIUS = 15
const TAB_FILL = 0xdfb1e0

const GROOVE_WIDTH = 236
const GROOVE_HEIGHT = 11
const GROOVE_FILL = 0xb881b9

// Sliced from the Figma frame directly (Group 7 is anchored at BOARD_X/Y).
const LOGO_X = 445
const LOGO_Y = 279.5
const LOGO_WIDTH = 398
const LOGO_HEIGHT = 133

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

/** Every button sits on a uniform 337x85 + 110px-pitch grid (Figma "Frame 7", node 98:18). */
const MENU_BUTTON_WIDTH = 337
const MENU_BUTTON_HEIGHT = 85
const MENU_ITEM_PITCH = 110
const MENU_FIRST_ITEM_Y = 427.5
/**
 * menu_*.webp bakes its drop shadow into the canvas (same as btn_masuklab.webp
 * in Splash), so the exported asset is slightly larger than the button itself —
 * display it at its native size rather than cropping the shadow away.
 */
const MENU_BUTTON_ASSET_WIDTH = 351
const MENU_BUTTON_ASSET_HEIGHT = 99

/** Menu entries in design-space geometry, top to bottom, sliced from the Figma frame. */
const MENU_ITEMS = [
  { action: 'desain-skema', texture: 'menu-desain-skema' },
  { action: 'jalur-pcb', texture: 'menu-jalur-pcb' },
  { action: 'cad-casing', texture: 'menu-cad-casing' },
  { action: 'evaluasi-akhir', texture: 'menu-evaluasi-akhir' },
  { action: 'keluar', texture: 'menu-keluar' },
] as const

export type HomeMenuAction = (typeof MENU_ITEMS)[number]['action']

/** "Sudah dipelajari" badge — straddles a completed menu button's top-right corner, same overlap trick as the tab on the panel. */
const BADGE_SIZE = 44
const BADGE_INSET_X = 14
const BADGE_INSET_Y = 10

// Responsive layout. Everything below is expressed relative to the glass
// panel's centre, which is the content container's origin.
/** Design-space y of the tab's top edge (101), the highest point the prop reaches. */
const TAB_TOP_Y = 101
/** Design-space y of the groove's top edge, sitting near the tab's bottom. */
const GROOVE_TOP_Y = 164
const CLIPBOARD_TOP_EXTENT = BOARD_Y - TAB_TOP_Y
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
 * Photo overlay + mascot both hug the design frame's right edge (Figma nodes
 * 102:28 and 101:23), so they're anchored from DESIGN_WIDTH rather than from
 * the panel like `content` — same bleed-with-the-stage treatment as the HUD.
 */
const PHOTO_OVERLAY_WIDTH = 1700
const PHOTO_OVERLAY_HEIGHT = 1080

const MASCOT_WIDTH = 474
const MASCOT_HEIGHT = 840
const MASCOT_TOP = 195
const MASCOT_RIGHT_INSET = DESIGN_WIDTH - 1654 // 1180 + 474

/** Mascot's own entrance: slides + fades in from off-screen right, instead of the shared bubble-in. */
const MASCOT_ENTER_OFFSET_X = 900
const MASCOT_ENTER_DURATION = 720
const MASCOT_ENTER_DELAY = 600
const MASCOT_ENTER_EASE = 'Cubic.easeOut'
/** Reverse of MASCOT_ENTER_EASE, for a symmetric slide back out. */
const MASCOT_EXIT_EASE = 'Cubic.easeIn'
/** Matches BubbleSequence's own reduced-motion cross-fade duration. */
const REDUCED_MOTION_DURATION = 220

/**
 * Home menu. Every element bubbles in staggered on load, and bubbles back out
 * staggered when a menu item is picked — the scene deliberately does NOT
 * navigate afterwards; it emits `home-exit-complete` with the chosen action so
 * the destination scenes can be wired up later.
 */
export class Home extends BaseStageScene {
  private bubbles!: BubbleSequence
  private background!: Phaser.GameObjects.Image
  /** Glass panel, logo and menu — one unit, scaled and anchored to the stage. */
  private content!: Phaser.GameObjects.Container
  /** Screen-corner furniture, anchored independently of the menu. */
  private hud!: Phaser.GameObjects.Container
  /** Photo overlay + mascot — anchored to the design frame's right edge, bleeding with the stage like the HUD. */
  private backdrop!: Phaser.GameObjects.Container
  private mascot!: Phaser.GameObjects.Image
  private interactives: (Phaser.GameObjects.Image | Phaser.GameObjects.Container)[] = []
  private bgmToggle!: Phaser.GameObjects.Image
  private exiting = false

  constructor() {
    super('Home')
  }

  preload() {
    queueHomeTextures(this)
  }

  protected onCreate() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#f2ecf5')

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
    this.background = this.add.image(960, 540, 'home-gradient')
    this.bubbles = new BubbleSequence(this)
    this.bubbles.add(coverFit(this.background, stage.width, stage.height), {
      scaleFrom: 1.04,
    })

    // Created before `content` so it renders behind the glass panel — the
    // photo overlay's left edge fades under the panel rather than over it.
    this.backdrop = this.add.container(0, 0)
    this.content = this.add.container(0, 0)
    this.hud = this.add.container(0, 0)

    // Children are positioned relative to the glass panel's centre.
    const panel = this.bubbles.add(this.buildGlassPanel())

    const logo = this.bubbles.add(
      coverFit(
        this.add.image(LOGO_X - BOARD_X, LOGO_Y - BOARD_Y, 'main-logo'),
        LOGO_WIDTH,
        LOGO_HEIGHT,
      ),
    )

    this.bubbles.add(this.buildBgmToggle())

    const buttons = MENU_ITEMS.map((item, index) => {
      const buttonX = 0
      const buttonY = MENU_FIRST_ITEM_Y + index * MENU_ITEM_PITCH - BOARD_Y
      const button = this.add
        .image(0, 0, item.texture)
        .setDisplaySize(MENU_BUTTON_ASSET_WIDTH, MENU_BUTTON_ASSET_HEIGHT)

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
          .image(MENU_BUTTON_WIDTH / 2 - BADGE_INSET_X, -MENU_BUTTON_HEIGHT / 2 + BADGE_INSET_Y, 'badge-checklist')
          .setDisplaySize(BADGE_SIZE, BADGE_SIZE)
        wrapChildren.push(badge)
      }

      const wrap = this.add.container(buttonX, buttonY, wrapChildren)
      wrap.setSize(MENU_BUTTON_WIDTH, MENU_BUTTON_HEIGHT)

      this.attachButtonBehaviour(wrap, () => this.exitTo(item.action))
      this.bubbles.add(wrap)

      return wrap
    })

    this.content.add([panel, logo, ...buttons])
    this.hud.add(this.bgmToggle)

    const photoOverlay = this.bubbles.add(this.buildPhotoOverlay(), { scaleFrom: 1.04 })
    this.mascot = this.buildMascot()
    this.backdrop.add([photoOverlay, this.mascot])

    this.layoutStage()

    this.onBusEvent(STAGE_RESIZE_EVENT, () => this.fitToStage())
    this.onBusEvent(SETTINGS_CHANGED_EVENT, () => this.syncBgmToggle())
    // No texture release registered here on purpose: home-bg and main-logo
    // are only this scene's own, but Home is the hub every journey exits
    // back to — freeing them here would force a network refetch + re-decode
    // on every single return trip. Leaving them resident is the better trade
    // for a scene visited this often; see JalurPcb.ts's releaseJalurPcbTextures
    // for the shutdown-release pattern where it does pay off.

    EventBus.emit('current-scene-ready', this)

    this.bubbles.playIn(() => {
      if (!settings.get().reducedMotion) this.startLogoIdle(logo)
      this.interactives.forEach((button) => button.setInteractive({ useHandCursor: true }))
    })
    this.playMascotEntrance()
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

    // Anchored to the design frame's top-right corner, same as the HUD, so the
    // photo overlay and mascot bleed with the stage instead of drifting away
    // from the composition's right edge on a non-16:9 viewport.
    this.backdrop.setScale(scale).setPosition(bounds.right, bounds.top)
  }

  /**
   * Frosted-glass panel and its top tab in one Graphics so the whole prop
   * bubbles as a single object. Everything is drawn around the panel's
   * centre; the tab straddles the top edge, the same overlap trick the old
   * clipboard's clip used to read as attached rather than floating above it.
   * Phaser's Graphics has no backdrop-blur equivalent, so the CSS
   * `backdrop-blur` behind the translucent fill is dropped — a flat
   * semi-transparent white reads close enough over this soft a background.
   */
  private buildGlassPanel() {
    const halfWidth = BOARD_WIDTH / 2
    const halfHeight = BOARD_HEIGHT / 2

    // TAB_TOP_Y/GROOVE_TOP_Y are the Figma frame's absolute y for each edge;
    // subtracting BOARD_Y re-expresses them relative to the panel's centre.
    const tabTop = TAB_TOP_Y - BOARD_Y
    const grooveTop = GROOVE_TOP_Y - BOARD_Y

    return (
      this.add
        .graphics({ x: 0, y: 0 })

        // Panel: cast shadow, then the translucent glass face with an inset glow.
        .fillStyle(0x000000, BOARD_SHADOW_ALPHA)
        .fillRoundedRect(
          -halfWidth + BOARD_SHADOW_OFFSET_X,
          -halfHeight + BOARD_SHADOW_OFFSET_Y,
          BOARD_WIDTH,
          BOARD_HEIGHT,
          BOARD_RADIUS,
        )
        .fillStyle(BOARD_FILL, BOARD_FILL_ALPHA)
        .fillRoundedRect(-halfWidth, -halfHeight, BOARD_WIDTH, BOARD_HEIGHT, BOARD_RADIUS)
        .lineStyle(2, 0xffffff, BOARD_GLOW_ALPHA)
        .strokeRoundedRect(-halfWidth + 1, -halfHeight + 1, BOARD_WIDTH - 2, BOARD_HEIGHT - 2, BOARD_RADIUS - 1)

        // Tab: solid pill straddling the panel's top edge, plus its groove.
        .fillStyle(TAB_FILL, 1)
        .fillRoundedRect(-TAB_WIDTH / 2, tabTop, TAB_WIDTH, TAB_HEIGHT, TAB_RADIUS)
        .fillStyle(GROOVE_FILL, 1)
        .fillRoundedRect(-GROOVE_WIDTH / 2, grooveTop, GROOVE_WIDTH, GROOVE_HEIGHT, GROOVE_HEIGHT / 2)
    )
  }

  /**
   * The workshop photo, faded into the gradient by an alpha mask baked into
   * home_bg.webp (Figma's "Mask group", node 102:28). Anchored to the
   * backdrop's origin (the design frame's top-right corner) with a
   * top-right origin, so it sits flush against the frame's right edge same
   * as it does in Figma, and bleeds outward with the stage like the HUD.
   */
  private buildPhotoOverlay() {
    return this.add
      .image(0, 0, 'home-bg')
      .setOrigin(1, 0)
      .setDisplaySize(PHOTO_OVERLAY_WIDTH, PHOTO_OVERLAY_HEIGHT)
  }

  /** Figma's "chr 1" (node 101:23) — same top-right anchoring as the photo overlay. */
  private buildMascot() {
    return this.add
      .image(-MASCOT_RIGHT_INSET, MASCOT_TOP, 'mascot')
      .setOrigin(1, 0)
      .setDisplaySize(MASCOT_WIDTH, MASCOT_HEIGHT)
  }

  /**
   * The mascot's own entrance — slides and fades in from off-screen right,
   * instead of the shared bubble-in every other element gets. Its exit
   * (playMascotExit()) just reverses this, sliding back out to the right
   * rather than shrinking like the rest of the bubble-out.
   */
  private playMascotEntrance() {
    const restX = this.mascot.x
    const reduced = settings.get().reducedMotion

    if (!reduced) this.mascot.setPosition(restX + MASCOT_ENTER_OFFSET_X, this.mascot.y)
    this.mascot.setAlpha(0)

    this.tweens.add({
      targets: this.mascot,
      x: restX,
      alpha: 1,
      duration: reduced ? REDUCED_MOTION_DURATION : MASCOT_ENTER_DURATION,
      delay: reduced ? 0 : MASCOT_ENTER_DELAY,
      ease: reduced ? 'Sine.easeInOut' : MASCOT_ENTER_EASE,
    })
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
    this.playMascotExit()
  }

  /** Reverse of playMascotEntrance(): slides back out to the right and fades, no scale. */
  private playMascotExit() {
    const reduced = settings.get().reducedMotion

    this.tweens.killTweensOf(this.mascot)
    this.tweens.add({
      targets: this.mascot,
      x: this.mascot.x + MASCOT_ENTER_OFFSET_X,
      alpha: 0,
      duration: reduced ? REDUCED_MOTION_DURATION : MASCOT_ENTER_DURATION,
      ease: reduced ? 'Sine.easeInOut' : MASCOT_EXIT_EASE,
    })
  }
}
