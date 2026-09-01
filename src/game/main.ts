import Phaser from 'phaser'
import { EventBus } from './EventBus'
import { audio } from './audio/AudioDirector'
import { DPR, measureStage, stage, STAGE_RESIZE_EVENT, updateDPR } from './stage'
import { LANDSCAPE_ONLY_EXEMPT_SCENES, session } from './state/session'
import { Boot } from './scenes/Boot'
import { createBridgeScene } from './scenes/BridgeScene'
import { setBootTarget } from './bootTarget'
import { Splash } from './scenes/Splash'
import { Home, type HomeMenuAction } from './scenes/Home'
import { DesainSkema } from './scenes/DesainSkema'
import { JalurPcb } from './scenes/JalurPcb'
import { CadCasing } from './scenes/CadCasing'
import { EvaluasiAkhir } from './scenes/EvaluasiAkhir'

/** Where each Home menu action lands. Actions missing here have no destination scene yet. */
const HOME_DESTINATIONS: Partial<Record<HomeMenuAction, string>> = {
  'desain-skema': 'DesainSkema',
  'jalur-pcb': 'JalurPcb',
  'cad-casing': 'CadCasing',
  'evaluasi-akhir': 'EvaluasiAkhir',
}

/** Scene classes by key, so a migrated scene can be swapped for a bridge without touching this list's order. */
const SCENE_CLASSES: Record<string, new () => Phaser.Scene> = {
  Splash,
  Home,
  DesainSkema,
  JalurPcb,
  CadCasing,
  EvaluasiAkhir,
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
    // Lets low-end mobile GPUs (limited to one texture unit per draw call)
    // still batch draws from the atlases in src/game/textures.ts — without
    // it Phaser assumes desktop-class multi-texture batching everywhere.
    autoMobileTextures: true,
  },
}

let game: Phaser.Game | null = null
let containerEl: HTMLElement | null = null
let syncFrame = 0
let syncTimer = 0

/**
 * `#phaser-container`'s CSS (`100dvh`, falling back to `100vh`) can't be
 * trusted: `100dvh` silently no-ops on any browser that doesn't parse it —
 * confirmed on the WebView shipped with Android 12 and older — leaving
 * `100vh` in effect, and Android Chrome's `100vh` has long measured the
 * *largest* possible viewport (chrome hidden), not the current one. With the
 * address bar visible that overshoots the real visible height, so Phaser's
 * CENTER_BOTH canvas ends up letterboxed inside a container taller than the
 * screen — an empty band up top, and the bottom of the game scrolled out of
 * view under `overflow: hidden`, with no error to signal it.
 *
 * `measureStage` already reads the one number every browser agrees on —
 * `window.innerWidth`/`innerHeight` — so the container is sized from that
 * directly instead of trusting any viewport-unit keyword.
 */
function applyContainerSize() {
  if (!containerEl) return
  containerEl.style.width = `${window.innerWidth}px`
  containerEl.style.height = `${window.innerHeight}px`
}

/**
 * A rotation is not one event: mobile browsers fire `orientationchange` and
 * `resize` while `innerWidth`/`innerHeight` still report the old box, and some
 * settle again once the browser chrome finishes animating. Measuring once, on
 * the event, locks in the wrong aspect ratio.
 */
const ORIENTATION_SETTLE_DELAY = 350

function syncStage() {
  applyContainerSize()

  const portrait = window.innerHeight > window.innerWidth
  session.set({ portrait })

  // Home and every scene after it are landscape-only (ADR-009): the stage
  // must never actually reshape to portrait, even while OrientationGuard's
  // overlay is covering it — a merely-hidden portrait stage would still be
  // portrait underneath. Freeze at the last landscape geometry instead.
  // Splash is the one scene reachable while portrait (it gates Masuk Lab
  // itself), so there's always a landscape stage already in place to freeze.
  if (portrait && !LANDSCAPE_ONLY_EXEMPT_SCENES.has(session.get().currentScene)) {
    game?.scale.refresh()
    return
  }

  const next = measureStage()

  if (next.width === stage.width && next.height === stage.height) {
    // Aspect unchanged, but the viewport box may still have moved — mobile
    // browser chrome appearing, say. Re-fit against the new parent bounds.
    game?.scale.refresh()
    return
  }

  stage.width = next.width
  stage.height = next.height
  updateDPR(stage.width, stage.height)

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
  if (!target) return

  // `game.scene` here is the SceneManager, not a scene's own ScenePlugin —
  // unlike `this.scene.start(...)` called from inside a scene (which stops
  // its caller as a side effect), SceneManager.start() only starts the given
  // key. Without this explicit stop, Home kept running forever underneath
  // every journey — two full scenes updating/rendering every frame, which is
  // why entering Desain Skema or Jalur Pcb dropped frames on mobile while
  // Home alone stayed smooth.
  game?.scene.stop('Home')
  game?.scene.start(target)
}

export interface StartGameOptions {
  /** Scene to open after Boot. Defaults to Splash. */
  startScene?: string
  /**
   * Keys that have migrated to React. Each is registered as a bridge scene
   * (see BridgeScene.ts) so a Phaser scene navigating to one hands control
   * back to the React router instead of rendering a canvas version.
   */
  reactScenes?: string[]
}

export function StartGame(parent: string | HTMLElement, options: StartGameOptions = {}): Phaser.Game {
  if (game) return game

  setBootTarget(options.startScene ?? null)
  const reactScenes = new Set(options.reactScenes ?? [])
  const scenes = Object.entries(SCENE_CLASSES).map(([key, sceneClass]) =>
    reactScenes.has(key) ? createBridgeScene(key) : sceneClass,
  )

  containerEl = typeof parent === 'string' ? document.getElementById(parent) : parent
  applyContainerSize()

  Object.assign(stage, measureStage())
  updateDPR(stage.width, stage.height)
  session.set({ portrait: window.innerHeight > window.innerWidth })

  game = new Phaser.Game({
    ...config,
    scene: [Boot, ...scenes],
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
  containerEl = null
  setBootTarget(null)
}
