import Phaser from 'phaser'
import { Boot } from './scenes/Boot'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1d1d1d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot],
}

let game: Phaser.Game | null = null

export function StartGame(parent: string | HTMLElement): Phaser.Game {
  if (game) return game
  game = new Phaser.Game({ ...config, parent })
  return game
}

export function StopGame() {
  game?.destroy(true)
  game = null
}
