import { useEffect, useRef } from 'react'
import { StartGame, StopGame } from '../game/main'
import { REACT_SCENE_KEYS, type SceneKey } from './scenes'

/**
 * Mounts the Phaser game for the scenes that have not migrated yet.
 *
 * Mounted only while such a scene is on screen, and unmounted the moment the
 * app moves to a React one — a hidden canvas would keep its render loop (and
 * its full-screen redraw) running behind the DOM. Every migrated key is
 * registered as a bridge, so a canvas scene navigating to one lands back in
 * the router instead of drawing a stale copy.
 */
export default function PhaserHost({ startScene }: { startScene?: SceneKey }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    StartGame(containerRef.current, {
      startScene,
      reactScenes: REACT_SCENE_KEYS(),
    })

    return () => StopGame()
  }, [startScene])

  return <div ref={containerRef} id="phaser-container" />
}
