import Phaser from 'phaser'
import { EventBus } from '../EventBus'

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create() {
    EventBus.emit('current-scene-ready', this)
  }
}
