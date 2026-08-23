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
} from '../desainSkema/uiKit'

const TITLE_Y = 44
const BADGE_Y = 130

const HOME_ICON_X = 77
const NAV_ICON_Y = 78

const BGM_X = 1810.5
const BGM_Y = 65
const BGM_ON_WIDTH = 147
const BGM_ON_HEIGHT = 66
const BGM_OFF_WIDTH = 157
const BGM_OFF_HEIGHT = 70

/**
 * Title, badge, home icon and bgm toggle for Evaluasi Akhir — same chrome
 * shape as `JalurPcbHeader`/`DesainSkemaHeader`, minus the back icon: this
 * scene is a single step (the combined quiz), so there's never a previous
 * step to go back to, only Home.
 */
export class EvaluasiAkhirHeader {
  container!: Phaser.GameObjects.Container
  private bgmToggle!: Phaser.GameObjects.Image
  private ctx: UiContext
  private onHome: () => void

  constructor(ctx: UiContext, onHome: () => void) {
    this.ctx = ctx
    this.onHome = onHome
  }

  render(entrance: boolean) {
    const scene = this.ctx.scene
    this.container?.destroy()
    this.container = scene.add.container(0, 0)

    const title = scene.add
      .text(DESIGN_WIDTH / 2, TITLE_Y, 'Evaluasi Akhir', {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '44px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)

    const badge = this.buildBadge('Uji Pemahamanmu Seputar Elektronika')
    const home = scene.add.image(HOME_ICON_X, NAV_ICON_Y, 'go-home')
    attachButtonBehaviour(this.ctx, home, () => this.onHome())

    this.bgmToggle = scene.add.image(BGM_X, BGM_Y, 'bgm-on')
    this.syncBgmToggle()
    attachButtonBehaviour(this.ctx, this.bgmToggle, () => {
      toggleMute()
      audio.play('click')
    })

    this.container.add([title, badge, home, this.bgmToggle])

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

  syncBgmToggle() {
    const on = !settings.get().muted

    this.bgmToggle
      .setTexture(on ? 'bgm-on' : 'bgm-off')
      .setDisplaySize(on ? BGM_ON_WIDTH : BGM_OFF_WIDTH, on ? BGM_ON_HEIGHT : BGM_OFF_HEIGHT)
    this.bgmToggle.input?.hitArea.setSize(this.bgmToggle.width, this.bgmToggle.height)
  }
}
