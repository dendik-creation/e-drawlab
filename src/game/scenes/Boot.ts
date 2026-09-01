import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { bootTarget } from '../bootTarget'
import { applyStageCamera } from '../stage'
import { audio } from '../audio/AudioDirector'
import { session } from '../state/session'
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.webp'
import splashBgUrl from '../../../assets/images/05_backgrounds/splash_bg.webp'

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
    // Splash's background must be resident before its first frame — loaded
    // here rather than in Splash.preload() so there is never a pop-in gap.
    this.load.image('splash-bg', splashBgUrl)
    // SFX ship with the shell: tiny, and needed the instant anything is touched.
    audio.queue(this, ['sfx'])
  }

  create() {
    applyStageCamera(this)
    session.set({ currentScene: 'Boot' })
    EventBus.emit('current-scene-ready', this)
    // Usually Splash; the React router can ask for a different entry point
    // when the scene that would have navigated here has already migrated.
    Promise.all(REQUIRED_FONTS.map((font) => document.fonts.load(font))).then(() =>
      this.scene.start(bootTarget()),
    )
  }
}
