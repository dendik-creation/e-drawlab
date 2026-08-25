import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, stage, stageBounds, STAGE_RESIZE_EVENT } from '../stage'
import { coverFit } from '../coverFit'
import { queueHomeTextures } from './Home'
import { BaseStageScene } from './BaseStageScene'
import { audio } from '../audio/AudioDirector'
import { session, SESSION_CHANGED_EVENT } from '../state/session'
import touchToHomeUrl from '../../../assets/images/05_backgrounds/touch_to_home.webp'

const TEXT_COLOR = '#0c6179'
const BORDER_COLOR = 0x2b909f
const FILL_COLOR = 0xceb5e5
const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 2)
const FONT_HEADING = "'Baloo 2 Variable', 'Baloo 2', sans-serif"
const FONT_BODY = "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif"

const BAR_X = 960
const BAR_Y = 704.5
const BAR_WIDTH = 738
const BAR_HEIGHT = 41
const BAR_RADIUS = 17

const MOCK_DURATION = 1000
const MOCK_TARGET = 0.4
const BUBBLE_OUT_DURATION = 280
const BUBBLE_IN_DURATION = 320
const BUBBLE_IN_DELAY = 140
const ENTRANCE_DURATION = 320
const ENTRANCE_STAGGER = 120
const ENTRANCE_EASE = 'Back.easeOut'

// touch_to_home.webp's native canvas; displayed larger so the tap affordance
// reads at splash scale.
const TOUCH_ICON_NATIVE_WIDTH = 115
const TOUCH_ICON_NATIVE_HEIGHT = 160
const TOUCH_ICON_SCALE = 1.5
const TOUCH_ICON_WIDTH = TOUCH_ICON_NATIVE_WIDTH * TOUCH_ICON_SCALE
const TOUCH_ICON_HEIGHT = TOUCH_ICON_NATIVE_HEIGHT * TOUCH_ICON_SCALE

// Idle affordance: the icon breathes in place. Runs on a loop rather than on
// hover — the whole screen is the hitbox, so there is no single spot to hover.
const TOUCH_PULSE_SCALE = 1.08
const TOUCH_PULSE_DURATION = 700

const PRESS_SCALE = 0.9
const PRESS_DOWN_DURATION = 90
const PRESS_UP_DURATION = 180

// Small hint pill under the touch icon, spelling out the tap affordance for
// anyone who doesn't read the icon alone.
const HINT_LABEL = 'Ketuk dimana saja untuk melanjutkan'
const HINT_GAP_BELOW_ICON = 18
const HINT_BOX_WIDTH = 480
const HINT_BOX_HEIGHT = 48
const HINT_BOX_RADIUS = 16
const HINT_FONT_SIZE = '20px'
const HINT_Y = TOUCH_ICON_HEIGHT / 2 + HINT_GAP_BELOW_ICON + HINT_BOX_HEIGHT / 2

/**
 * Footer bar: drawn as a scene rectangle rather than baked into splash_bg.webp,
 * so it can be re-laid-out against `stageBounds()` on every resize and always
 * span the true viewport edge-to-edge, flush against the bottom, in both
 * windowed and fullscreen. Sized for one line of the small footer text.
 */
const FOOTER_BAR_COLOR = 0x0c6179
const FOOTER_BAR_HEIGHT = 60

// Rotate prompt. Occupies the same slot as the Masuk Lab button, because the
// two are mutually exclusive: the product is landscape-first (ADR-009), and a
// portrait viewport is asked to turn rather than served a reflowed layout.
const GATE_X = 960
const GATE_Y = 770.5
const PHONE_OFFSET_Y = -40
const PHONE_WIDTH = 96
const PHONE_HEIGHT = 160
const PHONE_RADIUS = 18
const PHONE_STROKE = 6
const PHONE_SCREEN_INSET_X = 14
const PHONE_SCREEN_INSET_Y = 22
const PHONE_SCREEN_RADIUS = 8
const PHONE_SCREEN_FILL = 0xdff0f2
const PHONE_DETAIL_WIDTH = 26
const PHONE_DETAIL_HEIGHT = 5
const ROTATE_LABEL_Y = 92
const ROTATE_LABEL = 'Putar perangkat ke mode lanskap'
const ROTATE_TILT_DURATION = 900
const ROTATE_HOLD_DURATION = 700

type BubbleTarget = Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Graphics

/**
 * One of two mutually exclusive things that can occupy the call-to-action slot.
 * Kept as data so the swap logic never needs to know which is which.
 */
interface Gate {
  target: Phaser.GameObjects.Image | Phaser.GameObjects.Container
  baseScaleX: number
  baseScaleY: number
  onShown: () => void
  onHidden: () => void
}

/**
 * Renders both Splash Scene frames (loading / ready) as one persistent scene:
 * the logo and subtitle are created once and never re-rendered — only the bar↔button
 * region bubbles out/in when the loading state changes.
 */
export class Splash extends BaseStageScene {
  private background!: Phaser.GameObjects.Image
  private track!: Phaser.GameObjects.Graphics
  private progressFill!: Phaser.GameObjects.Graphics
  private progressText!: Phaser.GameObjects.Text
  private entranceGroups: { targets: BubbleTarget[]; baseScales: number[] }[] = []
  private entering = false
  private gates?: { button: Gate; rotate: Gate }
  private activeGate: 'button' | 'rotate' | null = null
  private pulseTween?: Phaser.Tweens.Tween
  private phoneTween?: Phaser.Tweens.Tween
  private touchZone?: Phaser.GameObjects.Zone
  private footer?: Phaser.GameObjects.Text
  private footerBar!: Phaser.GameObjects.Graphics

  constructor() {
    super('Splash')
  }

  preload() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#f2ecf5')

    // Full-bleed gradient behind everything else; already resident from
    // Boot's preload, so it paints on the very first frame with no pop-in.
    this.background = coverFit(this.add.image(960, 540, 'splash-bg'), stage.width, stage.height)

    // Drawn, not baked into splash_bg.webp — see FOOTER_BAR_HEIGHT's comment.
    this.footerBar = this.add.graphics()
    this.layoutFooterBar()

    const logo = coverFit(this.add.image(960, 390.5, 'main-logo'), 790, 263)
    this.prepareBubbleGroup([logo])

    const subtitle = this.add
      .text(
        960,
        576,
        'Laboratorium Maya Interaktif\nuntuk Desain CAD Elektronika',
        {
          fontFamily: FONT_HEADING,
          fontStyle: '800',
          fontSize: '48px',
          color: TEXT_COLOR,
          align: 'center',
          lineSpacing: 6,
          resolution: TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5)
    this.prepareBubbleGroup([subtitle])

    this.buildLoadingState()
    this.prepareBubbleGroup([this.track, this.progressFill, this.progressText])
  }

  protected onCreate() {
    session.set({ currentScene: 'Splash' })

    this.onBusEvent(STAGE_RESIZE_EVENT, () => {
      applyStageCamera(this)
      coverFit(this.background, stage.width, stage.height)
      this.touchZone?.setSize(stage.width, stage.height)
      this.layoutFooterBar()
      this.positionFooter()
    })
    this.onBusEvent(SESSION_CHANGED_EVENT, () => this.applyOrientationGate(BUBBLE_IN_DELAY))

    EventBus.emit('current-scene-ready', this)

    this.playEntrance(() => {
      this.tweens.addCounter({
        from: 0,
        to: MOCK_TARGET,
        duration: MOCK_DURATION,
        ease: 'Sine.easeInOut',
        onUpdate: (tween) => this.setProgress(tween.getValue() ?? 0),
        onComplete: () => this.startRealLoad(),
      })
    })
  }

  private prepareBubbleGroup(targets: BubbleTarget[]) {
    const baseScales = targets.map((target) => target.scale)
    targets.forEach((target, i) => target.setScale(baseScales[i] * 0.6).setAlpha(0))
    this.entranceGroups.push({ targets, baseScales })
  }

  private playEntrance(onComplete: () => void) {
    this.entranceGroups.forEach((group, index) => {
      const delay = index * ENTRANCE_STAGGER
      const isLastGroup = index === this.entranceGroups.length - 1

      group.targets.forEach((target, i) => {
        this.tweens.add({
          targets: target,
          scale: group.baseScales[i],
          alpha: 1,
          duration: ENTRANCE_DURATION,
          delay,
          ease: ENTRANCE_EASE,
          onComplete: isLastGroup && i === 0 ? onComplete : undefined,
        })
      })
    })
  }

  private buildLoadingState() {
    this.track = this.add
      .graphics({ x: BAR_X, y: BAR_Y })
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS)
      .lineStyle(3, BORDER_COLOR, 1)
      .strokeRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS)

    this.progressFill = this.add.graphics({ x: BAR_X, y: BAR_Y })

    this.progressText = this.add
      .text(960, 768.5, '0% Memuat Konten', {
        fontFamily: FONT_BODY,
        fontStyle: '500',
        fontSize: '24px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
  }

  private startRealLoad() {
    this.load.on('progress', (progress: number) => {
      this.setProgress(MOCK_TARGET + progress * (1 - MOCK_TARGET))
    })

    this.load.once('complete', () => this.bubbleToReadyState())

    this.load.image('touch-to-home', touchToHomeUrl)
    queueHomeTextures(this)
    // The loops are the heavy half of the audio budget, so they ride the
    // progress bar rather than stalling the first interactive frame.
    audio.queue(this, ['music', 'ambience'])
    this.load.start()
  }

  private setProgress(progress: number) {
    const width = Math.max(BAR_WIDTH * progress, BAR_HEIGHT)
    const radius = Math.min(BAR_RADIUS, width / 2)

    this.progressFill
      .clear()
      .fillStyle(FILL_COLOR, 1)
      .fillRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, width, BAR_HEIGHT, radius)
      .lineStyle(2, BORDER_COLOR, 1)
      .strokeRoundedRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, width, BAR_HEIGHT, radius)

    this.progressText.setText(`${Math.round(progress * 100)}% Memuat Konten`)
  }

  private bubbleToReadyState() {
    const bubbleOutTargets = [this.track, this.progressFill, this.progressText]

    this.tweens.add({
      targets: bubbleOutTargets,
      scale: 1.3,
      alpha: 0,
      duration: BUBBLE_OUT_DURATION,
      ease: 'Cubic.easeIn',
      onComplete: () => bubbleOutTargets.forEach((target) => target.destroy()),
    })

    const touchIcon = coverFit(this.add.image(0, 0, 'touch-to-home'), TOUCH_ICON_WIDTH, TOUCH_ICON_HEIGHT)

    const baseScaleX = touchIcon.scaleX
    const baseScaleY = touchIcon.scaleY

    const hintBox = this.add
      .graphics({ x: 0, y: HINT_Y })
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-HINT_BOX_WIDTH / 2, -HINT_BOX_HEIGHT / 2, HINT_BOX_WIDTH, HINT_BOX_HEIGHT, HINT_BOX_RADIUS)
      .lineStyle(2, BORDER_COLOR, 1)
      .strokeRoundedRect(-HINT_BOX_WIDTH / 2, -HINT_BOX_HEIGHT / 2, HINT_BOX_WIDTH, HINT_BOX_HEIGHT, HINT_BOX_RADIUS)
    const hintLabel = this.add
      .text(0, HINT_Y, HINT_LABEL, {
        fontFamily: FONT_BODY,
        fontStyle: '500',
        fontSize: HINT_FONT_SIZE,
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    // The icon (plus its hint pill) bubbles in/out as one unit, anchored at
    // the same spot the icon used to sit at on its own.
    const buttonGroup = this.add.container(GATE_X, GATE_Y, [touchIcon, hintBox, hintLabel]).setVisible(false)

    // The icon is only the affordance hint — the actual hitbox is the full
    // screen, so a tap anywhere on the splash enters the lab.
    const touchZone = this.add.zone(0, 0, stage.width, stage.height).setOrigin(0)
    touchZone.setInteractive({ useHandCursor: true })
    touchZone.disableInteractive()
    this.touchZone = touchZone

    touchZone.on('pointerdown', () => {
      if (this.entering) return
      this.entering = true

      // Both of these need the press's user-gesture context, so they happen
      // before anything async: fullscreen is only grantable from a gesture,
      // and this press is the browser's autoplay unlock point, which is where
      // the score and room tone are allowed to start.
      this.enterFullscreen()
      audio.play('click')
      audio.setProfile('menu')

      EventBus.emit('masuk-lab')
      touchZone.disableInteractive()
      this.pulseTween?.remove()
      this.pulseTween = undefined
      this.tweens.killTweensOf(touchIcon)
      this.tweens.add({
        targets: touchIcon,
        scaleX: baseScaleX * PRESS_SCALE,
        scaleY: baseScaleY * PRESS_SCALE,
        duration: PRESS_DOWN_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: touchIcon,
            scaleX: baseScaleX,
            scaleY: baseScaleY,
            duration: PRESS_UP_DURATION,
            ease: 'Back.easeOut',
          })
          this.time.delayedCall(PRESS_UP_DURATION, () => this.scene.start('Home'))
        },
      })
    })

    // Sits inside footerBar, so it's white on that dark fill rather than
    // TEXT_COLOR (which was tuned for the cream backdrop). Its y is set by
    // positionFooter() rather than a fixed constant — see FOOTER_BAR_HEIGHT's
    // comment.
    const footer = this.add
      .text(
        960,
        0,
        'Untuk Siswa Kelas X SMK Program Keahlian Teknik Elektronika',
        {
          fontFamily: FONT_BODY,
          fontStyle: '500',
          fontSize: '24px',
          color: '#ffffff',
          resolution: TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0)
    this.footer = footer
    this.positionFooter()

    const rotatePrompt = this.buildRotatePrompt()

    this.gates = {
      button: {
        target: buttonGroup,
        baseScaleX: 1,
        baseScaleY: 1,
        onShown: () => {
          touchZone.setInteractive({ useHandCursor: true })
          this.pulseTween = this.playTouchPulseLoop(touchIcon, baseScaleX, baseScaleY)
        },
        onHidden: () => {
          touchZone.disableInteractive()
          this.pulseTween?.remove()
          this.pulseTween = undefined
          touchIcon.setScale(baseScaleX, baseScaleY)
        },
      },
      rotate: {
        target: rotatePrompt.container,
        baseScaleX: 1,
        baseScaleY: 1,
        onShown: () => {
          this.phoneTween = this.playPhoneTiltLoop(rotatePrompt.phone)
        },
        onHidden: () => {
          this.phoneTween?.remove()
          this.phoneTween = undefined
          rotatePrompt.phone.setAngle(0)
        },
      },
    }

    this.applyOrientationGate(BUBBLE_IN_DELAY)

    this.tweens.add({
      targets: footer,
      scale: 1,
      alpha: 1,
      duration: BUBBLE_IN_DURATION,
      delay: BUBBLE_IN_DELAY,
      ease: 'Back.easeOut',
    })
  }

  /**
   * Swaps the call-to-action for whichever gate the current orientation calls
   * for. In portrait the tap-to-enter zone is never merely hidden — it is left
   * without input, so a stray tap cannot enter the lab.
   */
  private applyOrientationGate(delay: number) {
    if (!this.gates) return

    const wanted = session.get().portrait ? 'rotate' : 'button'
    if (this.activeGate === wanted) return

    const previous = this.activeGate
    this.activeGate = wanted

    if (previous) this.hideGate(this.gates[previous])
    this.showGate(this.gates[wanted], previous ? BUBBLE_IN_DELAY : delay)
  }

  private showGate(gate: Gate, delay: number) {
    this.tweens.killTweensOf(gate.target)
    gate.target
      .setScale(gate.baseScaleX * 0.6, gate.baseScaleY * 0.6)
      .setAlpha(0)
      .setVisible(true)

    this.tweens.add({
      targets: gate.target,
      scaleX: gate.baseScaleX,
      scaleY: gate.baseScaleY,
      alpha: 1,
      duration: BUBBLE_IN_DURATION,
      delay,
      ease: 'Back.easeOut',
      onComplete: gate.onShown,
    })
  }

  /** Redraws the footer bar flush against the live stage bounds — see FOOTER_BAR_HEIGHT's comment. */
  private layoutFooterBar() {
    const bounds = stageBounds()
    this.footerBar
      .clear()
      .fillStyle(FOOTER_BAR_COLOR, 1)
      .fillRect(bounds.left, bounds.bottom - FOOTER_BAR_HEIGHT, bounds.right - bounds.left, FOOTER_BAR_HEIGHT)
  }

  /** Keeps the footer text centred inside the footer bar. */
  private positionFooter() {
    this.footer?.setY(stageBounds().bottom - FOOTER_BAR_HEIGHT / 2)
  }

  private hideGate(gate: Gate) {
    gate.onHidden()
    this.tweens.killTweensOf(gate.target)

    this.tweens.add({
      targets: gate.target,
      scaleX: gate.baseScaleX * 1.3,
      scaleY: gate.baseScaleY * 1.3,
      alpha: 0,
      duration: BUBBLE_OUT_DURATION,
      ease: 'Cubic.easeIn',
      onComplete: () => gate.target.setVisible(false),
    })
  }

  /** A phone that keeps turning itself from portrait to landscape, plus the instruction. */
  private buildRotatePrompt() {
    const halfWidth = PHONE_WIDTH / 2
    const halfHeight = PHONE_HEIGHT / 2

    const phone = this.add
      .graphics({ x: 0, y: PHONE_OFFSET_Y })
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-halfWidth, -halfHeight, PHONE_WIDTH, PHONE_HEIGHT, PHONE_RADIUS)
      .fillStyle(PHONE_SCREEN_FILL, 1)
      .fillRoundedRect(
        -halfWidth + PHONE_SCREEN_INSET_X,
        -halfHeight + PHONE_SCREEN_INSET_Y,
        PHONE_WIDTH - PHONE_SCREEN_INSET_X * 2,
        PHONE_HEIGHT - PHONE_SCREEN_INSET_Y * 2,
        PHONE_SCREEN_RADIUS,
      )
      .lineStyle(PHONE_STROKE, BORDER_COLOR, 1)
      .strokeRoundedRect(-halfWidth, -halfHeight, PHONE_WIDTH, PHONE_HEIGHT, PHONE_RADIUS)
      // Earpiece and home indicator: without them a rotated rounded rectangle
      // reads as an abstract shape rather than a device.
      .fillStyle(BORDER_COLOR, 1)
      .fillRoundedRect(
        -PHONE_DETAIL_WIDTH / 2,
        -halfHeight + (PHONE_SCREEN_INSET_Y - PHONE_DETAIL_HEIGHT) / 2,
        PHONE_DETAIL_WIDTH,
        PHONE_DETAIL_HEIGHT,
        PHONE_DETAIL_HEIGHT / 2,
      )
      .fillRoundedRect(
        -PHONE_DETAIL_WIDTH / 2,
        halfHeight - (PHONE_SCREEN_INSET_Y + PHONE_DETAIL_HEIGHT) / 2,
        PHONE_DETAIL_WIDTH,
        PHONE_DETAIL_HEIGHT,
        PHONE_DETAIL_HEIGHT / 2,
      )

    const label = this.add
      .text(0, ROTATE_LABEL_Y, ROTATE_LABEL, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '34px',
        color: TEXT_COLOR,
        align: 'center',
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    const container = this.add.container(GATE_X, GATE_Y, [phone, label]).setVisible(false)

    return { container, phone }
  }

  private playPhoneTiltLoop(phone: Phaser.GameObjects.Graphics) {
    return this.tweens.add({
      targets: phone,
      angle: -90,
      duration: ROTATE_TILT_DURATION,
      ease: 'Cubic.easeInOut',
      hold: ROTATE_HOLD_DURATION,
      yoyo: true,
      repeat: -1,
      repeatDelay: ROTATE_HOLD_DURATION,
    })
  }

  /**
   * Takes the lab fullscreen on the way in. Deliberately silent: no prompt
   * before, no notice after, and no fallback UI where the API is missing
   * (iPhone Safari has no `Element.requestFullscreen`) — there the lab simply
   * opens windowed. The resulting viewport change is picked up by the app's
   * existing resize listeners, same as a rotation.
   */
  private enterFullscreen() {
    if (!this.scale.fullscreen.available || this.scale.isFullscreen) return

    try {
      this.scale.startFullscreen()
    } catch {
      // Request refused (permissions policy, or a gesture the browser did not
      // count) — entering the lab must not depend on it.
    }

    // Best-effort: most browsers only grant Screen Orientation lock inside an
    // active fullscreen session, and several (iOS Safari) never expose the
    // API at all. Silently swallowed either way — the manual "please rotate"
    // gate (applyOrientationGate) already covers the case where this fails.
    screen.orientation?.lock?.('landscape').catch(() => {})
  }

  private playTouchPulseLoop(icon: Phaser.GameObjects.Image, baseScaleX: number, baseScaleY: number) {
    return this.tweens.add({
      targets: icon,
      scaleX: baseScaleX * TOUCH_PULSE_SCALE,
      scaleY: baseScaleY * TOUCH_PULSE_SCALE,
      duration: TOUCH_PULSE_DURATION,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }
}
