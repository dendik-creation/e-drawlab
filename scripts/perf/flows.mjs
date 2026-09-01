/**
 * Scripted routes through the app, in design coordinates, so the capture and
 * benchmark scripts always land on the same screens. Kept renderer-agnostic:
 * nothing here reaches into Phaser or the DOM tree, only clicks/drags at
 * design-space positions the layout guarantees.
 */
import {
  clickDesign,
  clickUntilScene,
  dragDesign,
  wheelDesign,
  GO_HOME_ICON,
  HOME_MENU,
  NEXT_BUTTON,
} from './driver.mjs'

/** Scene key each Home menu entry lands on — see HOME_DESTINATIONS in src/game/main.ts. */
const JOURNEY_SCENE = {
  desainSkema: 'DesainSkema',
  jalurPcb: 'JalurPcb',
  cadCasing: 'CadCasing',
  evaluasiAkhir: 'EvaluasiAkhir',
}

/** Splash finishes a mock+real load before the tap gate appears. */
export const SPLASH_READY_MS = 4000

export async function enterHome(page) {
  await page.waitForTimeout(SPLASH_READY_MS)
  // Home enables its menu only after the staggered bubble-in finishes, which
  // is longer than every other scene's entrance.
  await clickUntilScene(page, { x: 960, y: 540 }, 'Home', { settleMs: 2800 })
}

export async function openJourney(page, key) {
  await clickUntilScene(page, HOME_MENU[key], JOURNEY_SCENE[key], { settleMs: 1800 })
}

export async function backToHome(page) {
  await clickUntilScene(page, GO_HOME_ICON, 'Home', { settleMs: 2800 })
}

export async function clickNext(page, settleMs = 1400) {
  await clickDesign(page, NEXT_BUTTON.x, NEXT_BUTTON.y, settleMs)
}

/** Jalur PCB's materi only enables its Lanjut button once scrolled to the end. */
export async function scrollMateriToEnd(page) {
  await wheelDesign(page, 960, 600, 900, 20)
}

/** First slider in the Jalur PCB "Kontrol Input" card — dragged end to end. */
export const JALUR_SLIDER = { from: { x: 300, y: 360 }, to: { x: 600, y: 360 } }

/** Empty space inside the CAD Casing 3D viewport, orbited in a wide arc. */
export const CASING_ORBIT = { from: { x: 1290, y: 560 }, to: { x: 1500, y: 440 } }

/** A palette row in the Desain Skema work sheet, dragged onto the sheet area. */
export const WORKBENCH_DRAG = { from: { x: 217, y: 400 }, to: { x: 900, y: 420 } }

export { dragDesign }
