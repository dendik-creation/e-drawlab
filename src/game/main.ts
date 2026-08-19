import Phaser from 'phaser'
import { EventBus } from './EventBus'
import { audio } from './audio/AudioDirector'
import { DPR, measureStage, stage, STAGE_RESIZE_EVENT } from './stage'
import { Boot } from './scenes/Boot'
import { Splash } from './scenes/Splash'
import { Home } from './scenes/Home'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#faf3e7',
  scale: {
    // FIT (contain) rather than ENVELOP (cover): ENVELOP crops content, which
    // would eat into the design frame. With the canvas already matching the
    // viewport aspect, FIT fills the screen without cropping anything.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
  },
  scene: [Boot, Splash, Home],
}

let game: Phaser.Game | null = null

function handleResize() {
  const next = measureStage()
  if (next.width === stage.width && next.height === stage.height) return

  stage.width = next.width
  stage.height = next.height
  game?.scale.resize(stage.width * DPR, stage.height * DPR)
  EventBus.emit(STAGE_RESIZE_EVENT, stage)
}

export function StartGame(parent: string | HTMLElement): Phaser.Game {
  if (game) return game

  Object.assign(stage, measureStage())
  game = new Phaser.Game({
    ...config,
    width: stage.width * DPR,
    height: stage.height * DPR,
    parent,
  })
  window.addEventListener('resize', handleResize)
  audio.attach(game)

  return game
}

export function StopGame() {
  window.removeEventListener('resize', handleResize)
  audio.detach()
  game?.destroy(true)
  game = null
}
