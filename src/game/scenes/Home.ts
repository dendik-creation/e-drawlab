import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { BaseStageScene } from './BaseStageScene'
import {
  applyStageCamera,
  stage,
  stageBounds,
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
import homeBgUrl from '../../../assets/images/05_backgrounds/home_bg.webp'
import mascotUrl from '../../../assets/images/00_identity/mascot.webp'
import mascotMouth1Url from '../../../assets/images/00_identity/mascout_mouth_1.webp'
import mascotMouth2Url from '../../../assets/images/00_identity/mascout_mouth_2.webp'
import mascotMouth3Url from '../../../assets/images/00_identity/mascout_mouth_3.webp'
import greetingAppUrl from '../../../assets/images/05_backgrounds/greeting_app.webp'
import greetingMascotUrl from '../../../assets/images/05_backgrounds/greeting_mascot.webp'
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
  'home-bg': homeBgUrl,
  mascot: mascotUrl,
  'mascot-mouth-1': mascotMouth1Url,
  'mascot-mouth-2': mascotMouth2Url,
  'mascot-mouth-3': mascotMouth3Url,
  'greeting-app': greetingAppUrl,
  'greeting-mascot': greetingMascotUrl,
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

/**
 * Every coordinate below is sliced straight from the Figma frame "Home"
 * (node 164:3, 1920x1080) and expressed as (x, y, width, height) with x/y
 * being the element's top-left corner in design space. Unlike the old
 * clipboard-era layout, this composition already runs edge-to-edge in the
 * 1920x1080 frame (the logo sits 1px from the top, the mascot fills nearly
 * the full height) with no slack to absorb growth — so `content` is capped
 * to whichever of `stageOverscan()`'s two ratios is *tighter*
 * (`layoutStage()`), not the full overscan `home-bg` itself grows by. On a
 * wider-than-16:9 viewport (a landscape phone, an ultrawide monitor) that
 * keeps content at its authored size, centred, with `home-bg` bleeding to
 * fill the extra width behind it — the same trade coverFit already makes for
 * the background, just applied so the foreground never grows past the
 * visible frame and off the top/bottom edge.
 */
const LOGO_BOX = { x: 213.74, y: 1.1, width: 707.45, height: 239.75 }
const GREETING_APP_BOX = { x: 165.7, y: 275.15, width: 816.3, height: 169.42 }

/** Menu entries in design-space geometry, sliced from the Figma frame's 2x2 grid plus the standalone exit button. */
const MENU_ITEMS = [
  { action: 'desain-skema', texture: 'menu-desain-skema', x: 74.81, y: 475.83, width: 487.45, height: 228.91 },
  { action: 'jalur-pcb', texture: 'menu-jalur-pcb', x: 585.43, y: 475.83, width: 487.45, height: 228.91 },
  { action: 'cad-casing', texture: 'menu-cad-casing', x: 74.81, y: 726.71, width: 487.46, height: 228.91 },
  { action: 'evaluasi-akhir', texture: 'menu-evaluasi-akhir', x: 585.43, y: 723.74, width: 487.45, height: 231.87 },
  { action: 'keluar', texture: 'menu-keluar', x: 76.81, y: 982.47, width: 200.8, height: 72.78 },
] as const

export type HomeMenuAction = (typeof MENU_ITEMS)[number]['action']

/** "Sudah dipelajari" badge — straddles a completed menu button's top-right corner, same overlap trick as the tab used to. */
const BADGE_SIZE = 44
const BADGE_INSET_X = 14
const BADGE_INSET_Y = 10

/** Ceiling on foreground content growth is deliberately absent: it must track home-bg's own coverFit scale exactly, or the mascot drifts off its spot on the workbench art. */
const MASCOT_BOX = { x: 1178.16, y: 247.55, width: 513.35, height: 773.06 }

/** Mouth overlay frames, positioned in the same design space as MASCOT_BOX (converted to mascot-local offsets below). Talking is simulated by randomly cycling between them — there is no "closed" frame, mascot.webp ships with no mouth at all. */
const MOUTH_FRAMES = [
  { texture: 'mascot-mouth-1', x: 1382.4331, y: 577.65, width: 50.3657, height: 26.7431 },
  { texture: 'mascot-mouth-2', x: 1389.5085, y: 570.54, width: 44.1135, height: 34.5587 },
  { texture: 'mascot-mouth-3', x: 1387.04, y: 568.2236, width: 47.7795, height: 33.3701 },
] as const

const GREETING_MASCOT_BOX = { x: 1104.13, y: 127.38, width: 289.73, height: 170.42 }

const BGM_BOX = { x: 1711.06, y: 33.27, width: 157, height: 70 }
const BGM_ON_WIDTH = 147
const BGM_ON_HEIGHT = 66
const BGM_OFF_WIDTH = 157
const BGM_OFF_HEIGHT = 70

/** HUD anchor distances, measured from the design frame's top-right corner to the BGM toggle's centre. */
const HUD_INSET_X = DESIGN_WIDTH - (BGM_BOX.x + BGM_BOX.width / 2)
const HUD_INSET_Y = BGM_BOX.y + BGM_BOX.height / 2

// Idle rock: the logo tips to one side, then swings across to the other and
// back, forever, once the entrance has landed. Kept to a few degrees — the
// logo is wide, so its corners travel a long way per degree of rotation.
const LOGO_IDLE_ANGLE = 4
const LOGO_IDLE_SETTLE_DURATION = 1000
const LOGO_IDLE_SWING_DURATION = 2600

const HOVER_SCALE = 1.05
const HOVER_DURATION = 150
const PRESS_SCALE = 0.92
const PRESS_DOWN_DURATION = 90
const PRESS_UP_DURATION = 180

/** Mascot's own entrance: slides + fades in from off-screen right, instead of the shared bubble-in. Trimmed a bit faster than the old clipboard-era timings. */
const MASCOT_ENTER_OFFSET_X = 900
const MASCOT_ENTER_DURATION = 600
const MASCOT_ENTER_DELAY = 450
const MASCOT_ENTER_EASE = 'Cubic.easeOut'
/** Reverse of MASCOT_ENTER_EASE, for a symmetric slide back out. */
const MASCOT_EXIT_EASE = 'Cubic.easeIn'
/** Matches BubbleSequence's own reduced-motion cross-fade duration. */
const REDUCED_MOTION_DURATION = 220

/** Random talk-flap cadence for the mouth cycle — irregular on purpose so it doesn't read as a metronome. */
const MOUTH_CYCLE_MIN_DELAY = 90
const MOUTH_CYCLE_MAX_DELAY = 200
/** Swaps fired once the entrance lands, before settling on mascot-mouth-1 for good. */
const MOUTH_CYCLE_REPEATS = 3

/**
 * Home menu. Every element bubbles in staggered on load, and bubbles back out
 * staggered when a menu item is picked — the scene deliberately does NOT
 * navigate afterwards; it emits `home-exit-complete` with the chosen action so
 * the destination scenes can be wired up later.
 */
export class Home extends BaseStageScene {
  private bubbles!: BubbleSequence
  private background!: Phaser.GameObjects.Image
  /** Logo, greeting card, menu grid and mascot group — one unit, scaled and anchored to the stage in lockstep with `home-bg`. */
  private content!: Phaser.GameObjects.Container
  /** BGM toggle — anchored independently to the top-right corner. */
  private hud!: Phaser.GameObjects.Container
  private mascotGroup!: Phaser.GameObjects.Container
  private mascotMouth!: Phaser.GameObjects.Image
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
    // extra width or height the viewport's aspect ratio adds.
    this.background = coverFit(this.add.image(960, 540, 'home-bg'), stage.width, stage.height)
    this.bubbles = new BubbleSequence(this)

    this.content = this.add.container(0, 0)
    this.hud = this.add.container(0, 0)

    const logo = this.bubbles.add(this.buildBoxImage(LOGO_BOX, 'main-logo', 0.5))
    const greetingApp = this.bubbles.add(this.buildBoxImage(GREETING_APP_BOX, 'greeting-app', 0))

    const menuWraps = MENU_ITEMS.map((item) => {
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

      const centreX = item.x + item.width / 2 - DESIGN_WIDTH / 2
      const centreY = item.y + item.height / 2 - DESIGN_HEIGHT / 2
      const wrap = this.add.container(centreX, centreY, wrapChildren)
      wrap.setSize(item.width, item.height)

      this.attachButtonBehaviour(wrap, () => this.exitTo(item.action))
      this.bubbles.add(wrap)

      return wrap
    })

    this.mascotGroup = this.buildMascotGroup()

    this.content.add([greetingApp, logo, ...menuWraps, this.mascotGroup])
    this.hud.add(this.buildBgmToggle())

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
   * Scales and anchors the foreground to the stage rather than the design
   * frame. `content` is pinned to the design frame's centre and grown only by
   * whichever of the stage's two axes needs *less* growth to cover — i.e. it
   * never scales past what still fits inside `stage.height` (or `.width`),
   * so a wider-or-taller-than-16:9 viewport can't push the logo off the top
   * or the menu grid off the bottom the way tracking `stageOverscan()`
   * (which follows the *more* demanding axis, same as `home-bg`'s coverFit)
   * did. The BGM toggle stays independently pinned to the true top-right
   * corner, uncapped, since it's meant to hug that corner at any aspect.
   */
  private layoutStage() {
    const bounds = stageBounds()
    const scale = Math.min(stage.width / DESIGN_WIDTH, stage.height / DESIGN_HEIGHT)

    this.content.setScale(scale).setPosition(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2)

    this.hud
      .setScale(scale)
      .setPosition(bounds.right - HUD_INSET_X * scale, bounds.top + HUD_INSET_Y * scale)
  }

  /** Places `texture` at a Figma-authored (x, y, width, height) box, pivoted on the design frame's centre. `originX` picks the anchor within the box (0 = left/top edge, 0.5 = centre). */
  private buildBoxImage(box: { x: number; y: number; width: number; height: number }, texture: string, originX: number) {
    const anchorX = box.x + box.width * originX - DESIGN_WIDTH / 2
    const anchorY = box.y + box.height * originX - DESIGN_HEIGHT / 2
    return this.add
      .image(anchorX, anchorY, texture)
      .setOrigin(originX)
      .setDisplaySize(box.width, box.height)
  }

  /**
   * Mascot, its mouth overlay and the speech bubble, grouped so the entrance
   * slide and the mouth-talk cycle move as one unit. Mouth and bubble
   * coordinates are converted to mascot-local offsets since MASCOT_BOX's
   * top-left is this group's local origin.
   */
  private buildMascotGroup() {
    const mascot = this.add.image(0, 0, 'mascot').setOrigin(0).setDisplaySize(MASCOT_BOX.width, MASCOT_BOX.height)

    const bubble = this.add
      .image(GREETING_MASCOT_BOX.x - MASCOT_BOX.x, GREETING_MASCOT_BOX.y - MASCOT_BOX.y, 'greeting-mascot')
      .setOrigin(0)
      .setDisplaySize(GREETING_MASCOT_BOX.width, GREETING_MASCOT_BOX.height)

    const firstFrame = MOUTH_FRAMES[0]
    this.mascotMouth = this.add
      .image(firstFrame.x - MASCOT_BOX.x, firstFrame.y - MASCOT_BOX.y, firstFrame.texture)
      .setOrigin(0)
      .setDisplaySize(firstFrame.width, firstFrame.height)

    const groupX = MASCOT_BOX.x - DESIGN_WIDTH / 2
    const groupY = MASCOT_BOX.y - DESIGN_HEIGHT / 2
    return this.add.container(groupX, groupY, [mascot, bubble, this.mascotMouth])
  }

  /**
   * The mascot's own entrance — slides and fades in from off-screen right,
   * instead of the shared bubble-in every other element gets. Its exit
   * (playMascotExit()) just reverses this, sliding back out to the right
   * rather than shrinking like the rest of the bubble-out.
   */
  private playMascotEntrance() {
    const restX = this.mascotGroup.x
    const reduced = settings.get().reducedMotion

    if (!reduced) this.mascotGroup.setPosition(restX + MASCOT_ENTER_OFFSET_X, this.mascotGroup.y)
    this.mascotGroup.setAlpha(0)

    this.tweens.add({
      targets: this.mascotGroup,
      x: restX,
      alpha: 1,
      duration: reduced ? REDUCED_MOTION_DURATION : MASCOT_ENTER_DURATION,
      delay: reduced ? 0 : MASCOT_ENTER_DELAY,
      ease: reduced ? 'Sine.easeInOut' : MASCOT_ENTER_EASE,
      onComplete: () => this.startMouthCycle(),
    })
  }

  /**
   * Random mouth-flap that simulates the mascot speaking its greeting bubble.
   * Fires MOUTH_CYCLE_REPEATS times once the entrance slide has landed, then
   * settles for good on mascot-mouth-1 — a perpetual flap read as broken/
   * looping rather than a one-off greeting once the "Halo!" bubble has had
   * its moment.
   */
  private startMouthCycle() {
    if (settings.get().reducedMotion) return

    let lastIndex = 0
    let remaining = MOUTH_CYCLE_REPEATS
    const tick = () => {
      if (remaining <= 0) {
        this.setMouthFrame(0)
        return
      }
      remaining -= 1

      let index = Phaser.Math.Between(0, MOUTH_FRAMES.length - 1)
      if (MOUTH_FRAMES.length > 1 && index === lastIndex) {
        index = (index + 1) % MOUTH_FRAMES.length
      }
      lastIndex = index
      this.setMouthFrame(index)

      this.time.delayedCall(Phaser.Math.Between(MOUTH_CYCLE_MIN_DELAY, MOUTH_CYCLE_MAX_DELAY), tick)
    }

    tick()
  }

  private setMouthFrame(index: number) {
    const frame = MOUTH_FRAMES[index]
    this.mascotMouth
      .setTexture(frame.texture)
      .setPosition(frame.x - MASCOT_BOX.x, frame.y - MASCOT_BOX.y)
      .setDisplaySize(frame.width, frame.height)
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

    this.tweens.killTweensOf(this.mascotGroup)
    this.tweens.add({
      targets: this.mascotGroup,
      x: this.mascotGroup.x + MASCOT_ENTER_OFFSET_X,
      alpha: 0,
      duration: reduced ? REDUCED_MOTION_DURATION : MASCOT_ENTER_DURATION,
      ease: reduced ? 'Sine.easeInOut' : MASCOT_EXIT_EASE,
    })
  }
}
