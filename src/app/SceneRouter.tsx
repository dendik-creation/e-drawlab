import { useCallback, useEffect, useState } from 'react'
import { EventBus } from '../game/EventBus'
import { PHASER_EXIT_EVENT } from '../game/scenes/BridgeScene'
import StageRoot from '../ui/stage/StageRoot'
import PhaserHost from './PhaserHost'
import { REACT_SCENES, isReactScene, type SceneKey } from './scenes'

/**
 * Which renderer is on screen.
 *
 * `startScene` is deliberately part of the phaser state rather than derived:
 * it keys the host, so moving from one *canvas* scene to another leaves this
 * state untouched (Phaser handles that internally, no remount), while moving
 * React → canvas remounts the game pointed at the right entry scene.
 */
type Active = { kind: 'phaser'; startScene?: SceneKey } | { kind: 'react'; scene: SceneKey }

/**
 * Owns which screen is on show and which renderer draws it.
 *
 * The two renderers coexist for the length of the migration. The contract
 * between them is one event each way: a canvas scene navigating to a migrated
 * screen emits `phaser-exit` through its bridge, and a React scene calls
 * `navigate`, which remounts the game when the destination has not migrated
 * yet.
 */
export default function SceneRouter() {
  const [active, setActive] = useState<Active>({ kind: 'phaser' })

  const navigate = useCallback((scene: SceneKey) => {
    setActive(isReactScene(scene) ? { kind: 'react', scene } : { kind: 'phaser', startScene: scene })
  }, [])

  useEffect(() => {
    const onPhaserExit = (scene: string) => {
      if (isReactScene(scene as SceneKey)) setActive({ kind: 'react', scene: scene as SceneKey })
    }

    EventBus.on(PHASER_EXIT_EVENT, onPhaserExit)
    return () => {
      EventBus.off(PHASER_EXIT_EVENT, onPhaserExit)
    }
  }, [])

  if (active.kind === 'phaser') return <PhaserHost startScene={active.startScene} />

  const Scene = REACT_SCENES[active.scene]
  if (!Scene) return <PhaserHost startScene={active.scene} />

  return (
    <StageRoot>
      <Scene navigate={navigate} />
    </StageRoot>
  )
}
