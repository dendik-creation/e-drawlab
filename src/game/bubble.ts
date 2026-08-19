import Phaser from 'phaser'
import { settings } from './state/settings'

export type BubbleTarget =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.Graphics
  | Phaser.GameObjects.Container

const IN_DURATION = 720
const IN_STAGGER = 150
const IN_EASE = 'Back.easeOut'

const OUT_DURATION = 520
const OUT_STAGGER = 110
const OUT_EASE = 'Back.easeIn'

/** Single flat cross-fade used when the learner has asked for reduced motion. */
const REDUCED_DURATION = 220

/** Scale multiplier an element grows from on entry, and collapses back to on exit. */
const DEFAULT_SCALE_FROM = 0.62

interface BubbleEntry {
  target: BubbleTarget
  baseScaleX: number
  baseScaleY: number
  scaleFrom: number
}

export interface BubbleOptions {
  /**
   * Scale multiplier the element grows from / shrinks to. Full-bleed elements
   * (a background) should stay near 1 so no canvas edge is ever exposed.
   */
  scaleFrom?: number
}

/**
 * Staggered "bubble" entrance/exit for a scene's elements.
 *
 * Elements are registered in visual build order and hidden on the spot, so a
 * scene can lay itself out normally and then reveal itself with playIn().
 * playOut() replays the same list in reverse, unpeeling the scene the way it
 * was assembled — it never changes scenes itself, it only reports when the
 * last element has left so the caller decides what happens next.
 */
export class BubbleSequence {
  private entries: BubbleEntry[] = []
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /** Registers `target` and immediately hides it, ready for playIn(). */
  add<T extends BubbleTarget>(target: T, options: BubbleOptions = {}): T {
    const scaleFrom = options.scaleFrom ?? DEFAULT_SCALE_FROM

    this.entries.push({
      target,
      baseScaleX: target.scaleX,
      baseScaleY: target.scaleY,
      scaleFrom,
    })
    if (!settings.get().reducedMotion) {
      target.setScale(target.scaleX * scaleFrom, target.scaleY * scaleFrom)
    }
    target.setAlpha(0)

    return target
  }

  /**
   * Re-reads an element's current scale as its resting scale. Needed when art is
   * re-fitted after the stage changes size, so playOut() still returns to the
   * right place instead of the scale captured at add() time.
   */
  refreshBase(target: BubbleTarget) {
    const entry = this.entries.find((candidate) => candidate.target === target)
    if (!entry) return

    entry.baseScaleX = target.scaleX
    entry.baseScaleY = target.scaleY
  }

  playIn(onComplete?: () => void) {
    this.run(false, IN_DURATION, IN_STAGGER, IN_EASE, onComplete)
  }

  playOut(onComplete?: () => void) {
    this.run(true, OUT_DURATION, OUT_STAGGER, OUT_EASE, onComplete)
  }

  private run(
    exit: boolean,
    duration: number,
    stagger: number,
    ease: string,
    onComplete?: () => void,
  ) {
    const order = exit ? [...this.entries].reverse() : this.entries
    let pending = order.length

    if (pending === 0) {
      onComplete?.()
      return
    }

    // Reduced motion keeps the transition — losing it entirely would hide that
    // anything changed — but drops the scaling, the stagger and the overshoot,
    // leaving a single quick cross-fade.
    const reduced = settings.get().reducedMotion

    order.forEach((entry, index) => {
      const multiplier = reduced ? 1 : exit ? entry.scaleFrom : 1

      this.scene.tweens.add({
        targets: entry.target,
        scaleX: entry.baseScaleX * multiplier,
        scaleY: entry.baseScaleY * multiplier,
        alpha: exit ? 0 : 1,
        duration: reduced ? REDUCED_DURATION : duration,
        delay: reduced ? 0 : index * stagger,
        ease: reduced ? 'Sine.easeInOut' : ease,
        onComplete: () => {
          pending -= 1
          if (pending === 0) onComplete?.()
        },
      })
    })
  }
}
