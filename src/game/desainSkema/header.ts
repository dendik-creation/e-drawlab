import Phaser from 'phaser'
import { DESIGN_WIDTH } from '../stage'
import { audio } from '../audio/AudioDirector'
import { settings, toggleMute } from '../state/settings'
import {
  attachButtonBehaviour,
  fadeDownIn,
  BADGE_FILL,
  BADGE_TEXT_COLOR,
  TEXT_COLOR,
  FONT_HEADING,
  TEXT_RESOLUTION,
  FADE_DOWN_STAGGER,
  type UiContext,
} from './uiKit'

const TITLE_Y = 58
const BADGE_Y = 116

const HOME_ICON_X = 68
const BACK_ICON_X = 194
const NAV_ICON_Y = 64

const BGM_X = 1810.5
const BGM_Y = 65
const BGM_ON_WIDTH = 147
const BGM_ON_HEIGHT = 66
const BGM_OFF_WIDTH = 157
const BGM_OFF_HEIGHT = 70

/**
 * Title, "Langkah N" badge, home/back icons, and the bgm toggle. Cheap enough
 * to rebuild whole on every step change rather than patched in place — `render`
 * tears down its previous container itself, so the scene just calls it again.
 */
export class DesainSkemaHeader {
  container!: Phaser.GameObjects.Container
  private bgmToggle!: Phaser.GameObjects.Image
  private ctx: UiContext
  private onHome: () => void
  private onBack: () => void

  constructor(ctx: UiContext, onHome: () => void, onBack: () => void) {
    this.ctx = ctx
    this.onHome = onHome
    this.onBack = onBack
  }

  /** (Re)builds the header for `badgeLabel`. Only the scene's first paint fades it down — step transitions cross-fade the body while the header just sits there, already visible. */
  render(badgeLabel: string, showBack: boolean, entrance: boolean) {
    const scene = this.ctx.scene
    this.container?.destroy()
    this.container = scene.add.container(0, 0)

    const title = scene.add
      .text(DESIGN_WIDTH / 2, TITLE_Y, 'Desain Skema Elektronika', {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '44px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    const badge = this.buildBadge(badgeLabel)
    const home = this.buildNavIcon('go-home', HOME_ICON_X, this.onHome)

    this.container.add([title, badge, home])

    if (showBack) {
      const back = this.buildNavIcon('go-back', BACK_ICON_X, this.onBack)
      this.container.add(back)
    }

    this.bgmToggle = scene.add.image(BGM_X, BGM_Y, 'bgm-on')
    this.syncBgmToggle()
    attachButtonBehaviour(this.ctx, this.bgmToggle, () => {
      toggleMute()
      audio.play('click')
    })
    this.container.add(this.bgmToggle)

    if (entrance) {
      fadeDownIn(scene, title, 0)
      fadeDownIn(scene, badge, FADE_DOWN_STAGGER)
      fadeDownIn(scene, home, FADE_DOWN_STAGGER * 2)
      fadeDownIn(scene, this.bgmToggle, FADE_DOWN_STAGGER * 3)
    }
  }

  private buildBadge(label: string) {
    const scene = this.ctx.scene
    const text = scene.add
      .text(0, 0, label, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '22px',
        color: BADGE_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    const paddingX = 32
    const paddingY = 14
    const width = text.width + paddingX * 2
    const height = text.height + paddingY * 2

    const pill = scene.add.graphics().fillStyle(BADGE_FILL, 1).fillRoundedRect(-width / 2, -height / 2, width, height, height / 2)

    return scene.add.container(DESIGN_WIDTH / 2, BADGE_Y, [pill, text])
  }

  private buildNavIcon(texture: string, x: number, onPress: () => void) {
    const icon = this.ctx.scene.add.image(x, NAV_ICON_Y, texture)
    attachButtonBehaviour(this.ctx, icon, onPress)
    return icon
  }

  syncBgmToggle() {
    const on = !settings.get().muted

    this.bgmToggle
      .setTexture(on ? 'bgm-on' : 'bgm-off')
      .setDisplaySize(on ? BGM_ON_WIDTH : BGM_OFF_WIDTH, on ? BGM_ON_HEIGHT : BGM_OFF_HEIGHT)
    this.bgmToggle.input?.hitArea.setSize(this.bgmToggle.width, this.bgmToggle.height)
  }
}
