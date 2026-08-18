import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { DESIGN_WIDTH, DESIGN_HEIGHT, DPR } from '../main'
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.png'

const REQUIRED_FONTS = [
  '800 48px "Baloo 2 Variable"',
  '500 24px "Plus Jakarta Sans Variable"',
]

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    this.load.image('main-logo', mainLogoUrl)
  }

  create() {
    this.cameras.main.setZoom(DPR).centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2)
    EventBus.emit('current-scene-ready', this)
    Promise.all(REQUIRED_FONTS.map((font) => document.fonts.load(font))).then(
      () => this.scene.start('Splash'),
    )
  }
}
