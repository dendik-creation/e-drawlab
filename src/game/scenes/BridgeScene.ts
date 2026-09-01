import Phaser from 'phaser'
import { EventBus } from '../EventBus'

/**
 * Stand-in for a scene that now lives in React.
 *
 * During the migration the two renderers coexist: a Phaser journey scene
 * still navigates with `this.scene.start('Home')`, and Home may already be a
 * React component. Registering a bridge under that key means those calls stay
 * untouched — the bridge simply announces the requested destination and lets
 * the React router take over, which unmounts the game.
 *
 * Delete this file once every scene has migrated and `main.ts` is gone.
 */
export const PHASER_EXIT_EVENT = 'phaser-exit'

export function createBridgeScene(key: string) {
  return class BridgeScene extends Phaser.Scene {
    constructor() {
      super(key)
    }

    create() {
      EventBus.emit(PHASER_EXIT_EVENT, key)
    }
  }
}
