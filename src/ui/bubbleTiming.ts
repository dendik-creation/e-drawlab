import { settings } from '../state/settings'

/**
 * How long a staggered bubble sequence takes, start to finish.
 *
 * Its own module rather than living beside the components: a file that
 * exports both components and plain helpers loses React Fast Refresh.
 */
export const IN_STAGGER = 150
export const OUT_STAGGER = 110
export const IN_DURATION = 720
export const OUT_DURATION = 520
export const REDUCED_DURATION = 220

export function bubbleDuration(count: number, exiting: boolean, stagger?: number, duration?: number) {
  if (settings.get().reducedMotion) return REDUCED_DURATION
  return (
    (duration ?? (exiting ? OUT_DURATION : IN_DURATION)) +
    (stagger ?? (exiting ? OUT_STAGGER : IN_STAGGER)) * Math.max(count - 1, 0)
  )
}
