import { useEffect, useState } from 'react'
import { settings } from '../../game/state/settings'
import { MASCOT_BOX, MOUTH_FRAMES } from './homeAssets'

/** Irregular on purpose, so the flap doesn't read as a metronome. */
const MIN_DELAY = 90
const MAX_DELAY = 200

/**
 * The mascot's mouth, cycling frames for as long as the greeting voice line
 * plays and then settling for good on frame 1 — a perpetual flap reads as
 * broken rather than as speech once the line is over.
 *
 * Its own component so a flap re-renders one `<img>` instead of the whole
 * Home scene: at ~7 changes a second, re-rendering the menu, mascot and HUD
 * alongside it would be pure waste.
 */
export default function MascotMouth({ talkingForMs }: { talkingForMs: number }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (talkingForMs <= 0 || settings.get().reducedMotion) {
      setIndex(0)
      return
    }

    let timer = 0
    const endAt = performance.now() + talkingForMs
    let last = 0

    const tick = () => {
      if (performance.now() >= endAt) {
        setIndex(0)
        return
      }

      let next = Math.floor(Math.random() * MOUTH_FRAMES.length)
      if (next === last) next = (next + 1) % MOUTH_FRAMES.length
      last = next
      setIndex(next)

      timer = window.setTimeout(tick, MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY))
    }

    tick()
    return () => window.clearTimeout(timer)
  }, [talkingForMs])

  const frame = MOUTH_FRAMES[index]

  return (
    <img
      className="home-mouth"
      src={frame.src}
      alt=""
      draggable={false}
      style={{
        left: frame.x - MASCOT_BOX.x,
        top: frame.y - MASCOT_BOX.y,
        width: frame.width,
        height: frame.height,
      }}
    />
  )
}
