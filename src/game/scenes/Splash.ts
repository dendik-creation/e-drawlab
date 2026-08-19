import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, STAGE_RESIZE_EVENT } from '../stage'
import { coverFit } from '../coverFit'
import { queueHomeTextures } from './Home'
import { audio } from '../audio/AudioDirector'
import { session, SESSION_CHANGED_EVENT } from '../state/session'
import btnMasukLabUrl from '../../../assets/images/01_menu_buttons/btn_masuklab.png'

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

const BUTTON_WIDTH = 460
const BUTTON_HEIGHT = 123

// Idle affordance: a short bright segment that continuously chases around the
// button's outline (an outset "trail" box, so it clears the button art).
const TRAIL_WIDTH = BUTTON_WIDTH + 16
const TRAIL_HEIGHT = BUTTON_HEIGHT + 16
const TRAIL_RADIUS = 24
const TRAIL_DURATION = 1800
const TRAIL_LENGTH = 0.22
const TRAIL_SEGMENTS = 12
const TRAIL_STROKE_WIDTH = 4
const TRAIL_ALPHA = 0.85

const HOVER_SCALE = 1.05
const HOVER_DURATION = 150
const PRESS_SCALE = 0.92
const PRESS_DOWN_DURATION = 90
const PRESS_UP_DURATION = 180

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
export class Splash extends Phaser.Scene {
  private track!: Phaser.GameObjects.Graphics
  private progressFill!: Phaser.GameObjects.Graphics
  private progressText!: Phaser.GameObjects.Text
  private entranceGroups: { targets: BubbleTarget[]; baseScales: number[] }[] = []
  private entering = false
  private gates?: { button: Gate; rotate: Gate }
  private activeGate: 'button' | 'rotate' | null = null
  private trailTween?: Phaser.Tweens.Tween
  private phoneTween?: Phaser.Tweens.Tween

  constructor() {
    super('Splash')
  }

  preload() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#faf3e7')

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

  create() {
    session.set({ currentScene: 'Splash' })

    const recentre = () => applyStageCamera(this)
    const syncGate = () => this.applyOrientationGate(BUBBLE_IN_DELAY)
    EventBus.on(STAGE_RESIZE_EVENT, recentre)
    EventBus.on(SESSION_CHANGED_EVENT, syncGate)
    this.events.once('shutdown', () => {
      EventBus.off(STAGE_RESIZE_EVENT, recentre)
      EventBus.off(SESSION_CHANGED_EVENT, syncGate)
    })

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

    this.load.image('btn-masuklab', btnMasukLabUrl)
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

    // Sits behind the button; drawn every frame by playTrailLoop() once the button is in.
    const trail = this.add.graphics({ x: 960, y: 770.5 })

    const button = coverFit(this.add.image(960, 770.5, 'btn-masuklab'), BUTTON_WIDTH, BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true })

    const baseScaleX = button.scaleX
    const baseScaleY = button.scaleY
    button.setScale(baseScaleX * 0.6, baseScaleY * 0.6).setAlpha(0).setVisible(false)
    button.disableInteractive()

    const setButtonScale = (multiplier: number, duration: number, ease: string) => {
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
      audio.play('hover')
      setButtonScale(HOVER_SCALE, HOVER_DURATION, 'Sine.easeOut')
    })
    button.on('pointerout', () => setButtonScale(1, HOVER_DURATION, 'Sine.easeOut'))
    button.on('pointerdown', () => {
      if (this.entering) return
      this.entering = true

      // This press is the browser's autoplay unlock point, so it is also where
      // the score and room tone are allowed to start.
      audio.play('click')
      audio.setProfile('menu')

      EventBus.emit('masuk-lab')
      button.disableInteractive()
      this.tweens.killTweensOf(button)
      this.tweens.add({
        targets: button,
        scaleX: baseScaleX * PRESS_SCALE,
        scaleY: baseScaleY * PRESS_SCALE,
        duration: PRESS_DOWN_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => {
          setButtonScale(HOVER_SCALE, PRESS_UP_DURATION, 'Back.easeOut')
          this.time.delayedCall(PRESS_UP_DURATION, () => this.scene.start('Home'))
        },
      })
    })

    const footer = this.add
      .text(
        960,
        1016.5,
        'Untuk Siswa Kelas X SMK Program Keahlian Teknik Elektronika',
        {
          fontFamily: FONT_BODY,
          fontStyle: '500',
          fontSize: '24px',
          color: TEXT_COLOR,
          resolution: TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0)

    const rotatePrompt = this.buildRotatePrompt()

    this.gates = {
      button: {
        target: button,
        baseScaleX,
        baseScaleY,
        onShown: () => {
          button.setInteractive({ useHandCursor: true })
          this.trailTween = this.playTrailLoop(trail)
        },
        onHidden: () => {
          button.disableInteractive()
          this.trailTween?.remove()
          this.trailTween = undefined
          trail.clear()
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
   * for. In portrait the Masuk Lab button is never merely hidden — it is left
   * without input, so a stray tap on its old position cannot enter the lab.
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

  private playTrailLoop(trail: Phaser.GameObjects.Graphics) {
    return this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: TRAIL_DURATION,
      repeat: -1,
      ease: 'Linear',
      onUpdate: (tween) => this.drawBorderTrail(trail, tween.getValue() ?? 0),
    })
  }

  /** Draws a fading comet of short segments trailing behind `headT` along the outline. */
  private drawBorderTrail(trail: Phaser.GameObjects.Graphics, headT: number) {
    trail.clear()

    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const t0 = headT - (i / TRAIL_SEGMENTS) * TRAIL_LENGTH
      const t1 = headT - ((i + 1) / TRAIL_SEGMENTS) * TRAIL_LENGTH
      const p0 = this.roundedRectPoint(t0, TRAIL_WIDTH, TRAIL_HEIGHT, TRAIL_RADIUS)
      const p1 = this.roundedRectPoint(t1, TRAIL_WIDTH, TRAIL_HEIGHT, TRAIL_RADIUS)
      const alpha = TRAIL_ALPHA * (1 - i / TRAIL_SEGMENTS)

      trail
        .lineStyle(TRAIL_STROKE_WIDTH, BORDER_COLOR, alpha)
        .beginPath()
        .moveTo(p0.x, p0.y)
        .lineTo(p1.x, p1.y)
        .strokePath()
    }
  }

  /** Walks a point clockwise around a rounded rect's perimeter, `t` in [0, 1) starting at top-left. */
  private roundedRectPoint(t: number, width: number, height: number, radius: number) {
    const halfWidth = width / 2
    const halfHeight = height / 2
    const straightX = width - 2 * radius
    const straightY = height - 2 * radius
    const arc = (Math.PI / 2) * radius
    const segments = [straightX, arc, straightY, arc, straightX, arc, straightY, arc]
    const total = segments.reduce((sum, length) => sum + length, 0)

    let distance = (((t % 1) + 1) % 1) * total
    let segmentIndex = 0
    while (distance > segments[segmentIndex]) {
      distance -= segments[segmentIndex]
      segmentIndex++
    }

    switch (segmentIndex) {
      case 0:
        return { x: -halfWidth + radius + distance, y: -halfHeight }
      case 1: {
        const angle = -Math.PI / 2 + distance / radius
        return { x: halfWidth - radius + Math.cos(angle) * radius, y: -halfHeight + radius + Math.sin(angle) * radius }
      }
      case 2:
        return { x: halfWidth, y: -halfHeight + radius + distance }
      case 3: {
        const angle = distance / radius
        return { x: halfWidth - radius + Math.cos(angle) * radius, y: halfHeight - radius + Math.sin(angle) * radius }
      }
      case 4:
        return { x: halfWidth - radius - distance, y: halfHeight }
      case 5: {
        const angle = Math.PI / 2 + distance / radius
        return { x: -halfWidth + radius + Math.cos(angle) * radius, y: halfHeight - radius + Math.sin(angle) * radius }
      }
      case 6:
        return { x: -halfWidth, y: halfHeight - radius - distance }
      default: {
        const angle = Math.PI + distance / radius
        return { x: -halfWidth + radius + Math.cos(angle) * radius, y: -halfHeight + radius + Math.sin(angle) * radius }
      }
    }
  }
}
