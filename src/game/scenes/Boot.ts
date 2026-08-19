import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera } from '../stage'
import { audio } from '../audio/AudioDirector'
import { session } from '../state/session'
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
    // SFX ship with the shell: tiny, and needed the instant anything is touched.
    audio.queue(this, ['sfx'])
  }

  create() {
    applyStageCamera(this)
    session.set({ currentScene: 'Boot' })
    EventBus.emit('current-scene-ready', this)
    Promise.all(REQUIRED_FONTS.map((font) => document.fonts.load(font))).then(
      () => this.scene.start('Splash'),
    )
  }
}
