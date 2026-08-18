import Phaser from 'phaser'
import { Boot } from './scenes/Boot'
import { Splash } from './scenes/Splash'

/** Design-space resolution every scene's coordinates are authored in. */
export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1080

/**
 * Phaser 4's ScaleManager has no `resolution`/DPI option — the canvas backing
 * store is always exactly `width`x`height`, then CSS-stretched to fill the
 * viewport (via ENVELOP), which upscales and blurs on HiDPI screens. We
 * supersample instead: render to a canvas `DPR` times bigger than the design
 * resolution, and every scene compensates with `cameras.main.setZoom(DPR)` so
 * game-object coordinates stay in the 1920x1080 design space.
 */
export const DPR = Math.min(window.devicePixelRatio || 1, 2)

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: DESIGN_WIDTH * DPR,
  height: DESIGN_HEIGHT * DPR,
  backgroundColor: '#faf3e7',
  scale: {
    // FIT (contain) instead of ENVELOP (cover): ENVELOP crops content on
    // aspect ratios far from 16:9 (e.g. wide mobile landscape), risking the
    // footer getting cut off. FIT always shows every element; the letterbox
    // bars are invisible since the canvas and page share the same bg color.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
  },
  scene: [Boot, Splash],
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
