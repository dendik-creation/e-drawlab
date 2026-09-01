import { useCallback, useState } from 'react'
import StageRoot from '../ui/stage/StageRoot'
import { REACT_SCENES, type SceneKey } from './scenes'

/** Where the app opens. */
const ENTRY_SCENE: SceneKey = 'Splash'

/**
 * Owns which screen is on show.
 *
 * Replaces Phaser's SceneManager: a scene is a component, and navigation is a
 * state change. Only one scene is mounted at a time, so nothing off screen
 * holds listeners, timers or GPU resources — the canvas build had to stop the
 * previous scene explicitly, and a missed stop meant two full scenes updating
 * and rendering every frame.
 */
export default function SceneRouter() {
  const [scene, setScene] = useState<SceneKey>(ENTRY_SCENE)

  const navigate = useCallback((next: SceneKey) => setScene(next), [])

  const Scene = REACT_SCENES[scene]
  if (!Scene) return null

  return (
    <StageRoot>
      <Scene navigate={navigate} />
    </StageRoot>
  )
}
