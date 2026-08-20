import Phaser from 'phaser'
import { EventBus } from './EventBus'
import { audio } from './audio/AudioDirector'
import { DPR, measureStage, stage, STAGE_RESIZE_EVENT } from './stage'
import { session } from './state/session'
import { Boot } from './scenes/Boot'
import { Splash } from './scenes/Splash'
import { Home, type HomeMenuAction } from './scenes/Home'
import { DesainSkema } from './scenes/DesainSkema'
import { JalurPcb } from './scenes/JalurPcb'

/** Where each Home menu action lands. Actions missing here have no destination scene yet. */
const HOME_DESTINATIONS: Partial<Record<HomeMenuAction, string>> = {
  'desain-skema': 'DesainSkema',
  'jalur-pcb': 'JalurPcb',
}

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
  scene: [Boot, Splash, Home, DesainSkema, JalurPcb],
}

let game: Phaser.Game | null = null
let syncFrame = 0
let syncTimer = 0

/**
 * A rotation is not one event: mobile browsers fire `orientationchange` and
 * `resize` while `innerWidth`/`innerHeight` still report the old box, and some
 * settle again once the browser chrome finishes animating. Measuring once, on
 * the event, locks in the wrong aspect ratio.
 */
const ORIENTATION_SETTLE_DELAY = 350

function syncStage() {
  session.set({ portrait: window.innerHeight > window.innerWidth })

  const next = measureStage()

  if (next.width === stage.width && next.height === stage.height) {
    // Aspect unchanged, but the viewport box may still have moved — mobile
    // browser chrome appearing, say. Re-fit against the new parent bounds.
    game?.scale.refresh()
    return
  }

  stage.width = next.width
  stage.height = next.height

  // setGameSize, NOT resize. Under FIT the ScaleManager's `displaySize` is
  // aspect-locked, and `resize()` feeds it through `setSize()`, which re-fits
  // to the aspect ratio it already held. The canvas backing store then takes
  // the new dimensions while the CSS box keeps the old shape — the content
  // comes out stretched after a rotation. `setGameSize()` re-declares the
  // aspect ratio, which is what FIT needs. Phaser's own docs limit `resize()`
  // to the NONE scale mode.
  game?.scale.setGameSize(stage.width * DPR, stage.height * DPR)
  EventBus.emit(STAGE_RESIZE_EVENT, stage)
}

function scheduleStageSync() {
  window.cancelAnimationFrame(syncFrame)
  window.clearTimeout(syncTimer)

  // Next frame catches the common case; the delayed pass catches viewports that
  // are still animating. `syncStage` is idempotent, so running twice is free.
  syncFrame = window.requestAnimationFrame(() => {
    syncStage()
    syncTimer = window.setTimeout(syncStage, ORIENTATION_SETTLE_DELAY)
  })
}

function bindViewportListeners(bind: boolean) {
  const method = bind ? 'addEventListener' : 'removeEventListener'

  window[method]('resize', scheduleStageSync)
  window[method]('orientationchange', scheduleStageSync)
  window.visualViewport?.[method]('resize', scheduleStageSync)
}

// Home deliberately never navigates itself (see Home.ts's exitTo docstring) — it
// only announces the chosen menu action once its exit animation has finished.
// This is the one place that turns that announcement into a scene switch.
function onHomeExitComplete(action: HomeMenuAction) {
  if (action === 'keluar') {
    // Browsers only allow window.close() on tabs opened by script; if it's a
    // no-op (e.g. a normally-navigated tab), there's no further fallback.
    window.close()
    return
  }

  const target = HOME_DESTINATIONS[action]
  if (target) game?.scene.start(target)
}

export function StartGame(parent: string | HTMLElement): Phaser.Game {
  if (game) return game

  Object.assign(stage, measureStage())
  session.set({ portrait: window.innerHeight > window.innerWidth })

  game = new Phaser.Game({
    ...config,
    width: stage.width * DPR,
    height: stage.height * DPR,
    parent,
  })
  bindViewportListeners(true)
  audio.attach(game)
  EventBus.on('home-exit-complete', onHomeExitComplete)

  return game
}

export function StopGame() {
  bindViewportListeners(false)
  EventBus.off('home-exit-complete', onHomeExitComplete)
  window.cancelAnimationFrame(syncFrame)
  window.clearTimeout(syncTimer)
  audio.detach()
  game?.destroy(true)
  game = null
}
