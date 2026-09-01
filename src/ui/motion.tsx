import { createContext, useContext, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { settings } from '../game/state/settings'
import { bubbleDuration, IN_DURATION, IN_STAGGER, OUT_DURATION, OUT_STAGGER, REDUCED_DURATION } from './bubbleTiming'
import './motion.css'

/**
 * The staggered "bubble" entrance/exit the canvas build ran through
 * `BubbleSequence`: elements grow in from 62% scale one after another, and
 * leave the same way in reverse.
 *
 * Here it is a CSS animation with a per-item delay, so the whole sequence
 * runs on the compositor and the main thread does nothing per frame — the
 * old version drove one tween per element through the game loop.
 */

interface BubbleContextValue {
  exiting: boolean
  /** Total registered items, so the exit can play in reverse order. */
  count: number
  reduced: boolean
  stagger: number
  duration: number
}

const BubbleContext = createContext<BubbleContextValue>({
  exiting: false,
  count: 0,
  reduced: false,
  stagger: IN_STAGGER,
  duration: IN_DURATION,
})

export interface BubbleStageProps {
  /** Number of BubbleItems below, needed to reverse the exit order. */
  count: number
  exiting?: boolean
  /** Fires once the entrance has finished — where a scene enables its input. */
  onEntered?: () => void
  /** Fires once the exit has finished — where a scene navigates away. */
  onExited?: () => void
  /** Per-item delay, ms. Splash uses a brisker sequence than the shared default. */
  stagger?: number
  /** One item's animation length, ms. */
  duration?: number
  children: ReactNode
}

export function BubbleStage({
  count,
  exiting = false,
  onEntered,
  onExited,
  stagger,
  duration,
  children,
}: BubbleStageProps) {
  const reduced = settings.get().reducedMotion
  const enteredRef = useRef(false)

  useEffect(() => {
    if (enteredRef.current) return
    enteredRef.current = true
    const timer = window.setTimeout(() => onEntered?.(), bubbleDuration(count, false, stagger, duration))
    return () => window.clearTimeout(timer)
  }, [count, duration, onEntered, stagger])

  useEffect(() => {
    if (!exiting) return
    const timer = window.setTimeout(() => onExited?.(), bubbleDuration(count, true, stagger, duration))
    return () => window.clearTimeout(timer)
  }, [count, duration, exiting, onExited, stagger])

  return (
    <BubbleContext.Provider
      value={{
        exiting,
        count,
        reduced,
        stagger: stagger ?? (exiting ? OUT_STAGGER : IN_STAGGER),
        duration: duration ?? (exiting ? OUT_DURATION : IN_DURATION),
      }}
    >
      {children}
    </BubbleContext.Provider>
  )
}

export interface BubbleItemProps {
  /** Position in the sequence, 0-based — the order elements were built in. */
  index: number
  /**
   * The element's own design-space box.
   *
   * Not optional decoration: the item is what carries the scale transform, and
   * a transformed element is the containing block for anything absolutely
   * positioned inside it. Without a real box the item collapses to a zero-size
   * point at the frame's origin, and every child then grows in from the
   * top-left corner instead of from its own centre.
   */
  box?: { x: number; y: number; w?: number; h?: number }
  /** `center` pivots on the box's point, matching Phaser's setOrigin(0.5). */
  origin?: 'topleft' | 'center'
  /**
   * Scale the element grows from. Full-bleed art (a background) should stay
   * near 1 so no stage edge is ever exposed mid-animation.
   */
  scaleFrom?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function BubbleItem({ index, box, origin = 'topleft', scaleFrom = 0.62, className, style, children }: BubbleItemProps) {
  const { exiting, count, reduced, stagger, duration } = useContext(BubbleContext)
  // Exit unpeels the scene the way it was assembled: last element first.
  const delay = reduced ? 0 : (exiting ? count - 1 - index : index) * stagger

  return (
    <div
      className={className ? `edl-bubble ${className}` : 'edl-bubble'}
      data-phase={exiting ? 'out' : 'in'}
      data-origin={origin}
      style={
        {
          ...(box === undefined
            ? {}
            : {
                '--box-x': `${box.x}px`,
                '--box-y': `${box.y}px`,
                ...(box.w === undefined ? {} : { '--box-w': `${box.w}px` }),
                ...(box.h === undefined ? {} : { '--box-h': `${box.h}px` }),
              }),
          '--bubble-delay': `${delay}ms`,
          '--bubble-scale-from': reduced ? 1 : scaleFrom,
          [exiting ? '--t-bubble-out' : '--t-bubble-in']: `${reduced ? REDUCED_DURATION : duration}ms`,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}

