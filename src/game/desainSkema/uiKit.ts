import Phaser from 'phaser'
import { audio } from '../audio/AudioDirector'
import { DESIGN_WIDTH } from '../stage'

/**
 * Shared visual language + widget builders for every Desain Skema step
 * (materi, the three CAD work sheets, evaluasi). Splitting this out of
 * DesainSkema.ts means a new step panel gets the same fonts/colors and the
 * same button feel for free, instead of re-deriving them.
 */

export const TEXT_COLOR = '#0c6179'
export const MUTED_TEXT_COLOR = '#7a8a90'
export const BORDER_COLOR = 0x2b909f
export const BADGE_FILL = 0x0c6179
export const BADGE_TEXT_COLOR = '#faf3e7'
export const CARD_FILL = 0xfbf0dc
export const CARD_EDGE = 0xece0c8
export const CARD_SHADOW_ALPHA = 0.1
export const FONT_HEADING = "'Baloo 2 Variable', 'Baloo 2', sans-serif"
export const FONT_BODY = "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif"
export const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 2)

export const FOOTER_Y = 1006

/**
 * Header/intro entrance: fade in while sliding down from above, replacing the
 * bubble (scale) treatment used elsewhere in the app — this scene's own
 * choice, not a change to the shared BubbleSequence other scenes rely on.
 */
export const FADE_DOWN_DISTANCE = 26
export const FADE_DOWN_DURATION = 340
export const FADE_DOWN_STAGGER = 60

/** Leaving the scene: one flat, fast fade — no per-item stagger to sit through. */
export const EXIT_FADE_DURATION = 200

const HOVER_SCALE = 1.05
const HOVER_DURATION = 150
const PRESS_SCALE = 0.92
const PRESS_DOWN_DURATION = 90

export type InteractiveTarget = Phaser.GameObjects.Container | Phaser.GameObjects.Image
export type Animatable = Phaser.GameObjects.Text | Phaser.GameObjects.Container | Phaser.GameObjects.Image

/**
 * What every button/step panel needs from the owning scene, without holding a
 * reference to the whole `DesainSkema` class: where to add tweens, whether
 * input is currently locked (entrance/exit/transition in flight), and where
 * to register/drop an interactive so the scene can mass-disable it later.
 */
export interface UiContext {
  scene: Phaser.Scene
  isLocked: () => boolean
  registerInteractive: (target: InteractiveTarget) => void
  unregisterInteractive: (target: InteractiveTarget) => void
}

/**
 * Shared hover/press choreography for every clickable prop across all four
 * steps — nav icons, the bgm toggle, palette rows, the footer's Lanjut
 * button, evaluasi's pill buttons.
 */
export function attachButtonBehaviour(ctx: UiContext, button: InteractiveTarget, onPress: () => void) {
  ctx.registerInteractive(button)
  if (!button.input) button.setInteractive({ useHandCursor: true })

  const baseScaleX = button.scaleX
  const baseScaleY = button.scaleY
  // Guards the press tween itself: pointerdown can fire twice in quick
  // succession (fast double-click, or duplicate touch+mouse events) well
  // within the ~90ms press animation, before the scene's own lock is ever
  // set — that raced two overlapping transitions and was the intermittent
  // "Lanjut crashes, needs a refresh" report.
  let pressed = false

  const scaleTo = (multiplier: number, duration: number, ease: string) => {
    if (ctx.isLocked()) return
    ctx.scene.tweens.killTweensOf(button)
    ctx.scene.tweens.add({ targets: button, scaleX: baseScaleX * multiplier, scaleY: baseScaleY * multiplier, duration, ease })
  }

  button.on('pointerover', () => {
    if (ctx.isLocked()) return
    audio.play('hover')
    scaleTo(HOVER_SCALE, HOVER_DURATION, 'Sine.easeOut')
  })
  button.on('pointerout', () => scaleTo(1, HOVER_DURATION, 'Sine.easeOut'))
  button.on('pointerdown', () => {
    if (ctx.isLocked() || pressed) return
    pressed = true
    ctx.scene.tweens.killTweensOf(button)
    ctx.scene.tweens.add({
      targets: button,
      scaleX: baseScaleX * PRESS_SCALE,
      scaleY: baseScaleY * PRESS_SCALE,
      duration: PRESS_DOWN_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => {
        onPress()
        pressed = false
      },
    })
  })
}

/** Fades `target` in while sliding it down from `distance` above its authored position. */
export function fadeDownIn(
  scene: Phaser.Scene,
  target: Animatable,
  delay = 0,
  distance = FADE_DOWN_DISTANCE,
  duration = FADE_DOWN_DURATION,
) {
  const originalY = target.y
  target.setAlpha(0)
  target.y = originalY - distance
  scene.tweens.add({ targets: target, y: originalY, alpha: 1, delay, duration, ease: 'Cubic.easeOut' })
}

/** The exit half of the same choreography: fades `target` out while sliding it up and away, then fires `onComplete`. */
export function fadeUpOut(scene: Phaser.Scene, target: Animatable, duration: number, distance: number, onComplete: () => void) {
  scene.tweens.add({
    targets: target,
    y: target.y - distance,
    alpha: 0,
    duration,
    ease: 'Sine.easeIn',
    onComplete,
  })
}

/** Small dash-dot-dash flourish anchored at (x,y); `mirrored` flips it to sit under the opposite corner. */
export function drawCornerOrnament(gfx: Phaser.GameObjects.Graphics, x: number, y: number, mirrored: boolean) {
  const dir = mirrored ? -1 : 1
  gfx
    .lineStyle(2, BADGE_FILL, 0.3)
    .lineBetween(x, y, x + dir * 18, y)
    .lineBetween(x + dir * 30, y, x + dir * 48, y)
    .fillStyle(BADGE_FILL, 0.3)
    .fillCircle(x + dir * 24, y, 3)
}

export type ActionButtonVariant = 'primary' | 'secondary'

/** Pill button shared by evaluasi's "Mulai Evaluasi"/"Soal Berikutnya"/"Lihat Hasil"/"Coba Lagi"/"Ke Beranda". */
export function buildActionButton(
  ctx: UiContext,
  label: string,
  x: number,
  y: number,
  width: number,
  variant: ActionButtonVariant,
  onPress: () => void,
) {
  const scene = ctx.scene
  const height = 68
  const radius = 16
  const fill = variant === 'primary' ? BORDER_COLOR : 0xffffff
  const stroke = variant === 'primary' ? 0x1d6f7c : BORDER_COLOR
  const textColor = variant === 'primary' ? '#ffffff' : TEXT_COLOR

  const bg = scene.add
    .graphics()
    .fillStyle(fill, 1)
    .fillRoundedRect(-width / 2, -height / 2, width, height, radius)
    .lineStyle(2, stroke, 1)
    .strokeRoundedRect(-width / 2, -height / 2, width, height, radius)

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT_BODY,
      fontStyle: '700',
      fontSize: '20px',
      color: textColor,
      resolution: TEXT_RESOLUTION,
    })
    .setOrigin(0.5)

  const container = scene.add.container(x, y, [bg, text])
  container.setSize(width, height)
  attachButtonBehaviour(ctx, container, onPress)

  return container
}

/** Footer "Lanjut →" button shared by materi and every CAD work sheet. Disabled (greyed, non-interactive) until `enabled`. */
export function buildNextButton(ctx: UiContext, enabled: boolean, onPress: () => void) {
  const scene = ctx.scene
  const width = 220
  const height = 68
  const radius = 16
  const fill = enabled ? BORDER_COLOR : 0xcfcac0
  const stroke = enabled ? 0x1d6f7c : 0xb9b1a4
  const textColor = enabled ? '#ffffff' : MUTED_TEXT_COLOR

  const bg = scene.add
    .graphics()
    .fillStyle(fill, 1)
    .fillRoundedRect(-width / 2, -height / 2, width, height, radius)
    .lineStyle(2, stroke, 1)
    .strokeRoundedRect(-width / 2, -height / 2, width, height, radius)

  const label = scene.add
    .text(0, 0, 'Lanjut →', {
      fontFamily: FONT_BODY,
      fontStyle: '700',
      fontSize: '22px',
      color: textColor,
      resolution: TEXT_RESOLUTION,
    })
    .setOrigin(0.5)

  // Fixed screen anchor, independent of whichever step is rendering it.
  const container = scene.add.container(DESIGN_WIDTH - 180, FOOTER_Y, [bg, label])
  container.setSize(width, height)

  if (enabled) attachButtonBehaviour(ctx, container, onPress)

  return container
}
