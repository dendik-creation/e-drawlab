/**
 * Shared Playwright plumbing for the render-migration harness.
 *
 * Every scene in this app is authored in a 1920x1080 design space that is
 * centre-fitted into the viewport, so the harness drives it in *design*
 * coordinates and converts to viewport pixels here. That mapping is the one
 * thing both renderers agree on (see src/game/stage.ts, and the DOM stage
 * layer that replaces it), which is what lets the same script capture the
 * Phaser build and the React build without a rewrite.
 */
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

/** Repo root, so the preview server serves `dist/` no matter where the script is invoked from. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1080

/** The container image ships one Chromium; Playwright's own pinned revision is not installed. */
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

export const VIEWPORTS = {
  desktop: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  /**
   * A 2.2:1 landscape phone at its real CSS size — the aspect the layout is
   * most stressed by.
   *
   * deviceScaleFactor stays 1 even though a real phone reports 2-3. This
   * container has no GPU: Chromium falls back to software GL, and the Phaser
   * build's canvas at DSF 2 is 4800x2160 (~10 MP) per frame, which stalls the
   * splash's own progress tween before the app is even usable. That number is
   * itself evidence for this migration — a real low-end phone GPU is asked for
   * the same fill rate — but it makes the run unmeasurable, so the harness
   * compares both renderers at DSF 1 instead.
   */
  phone: { width: 873, height: 393, deviceScaleFactor: 1 },
}

const PORT = 4173
const ORIGIN = `http://127.0.0.1:${PORT}`

/** Serves `dist/`. Build first — this deliberately measures the production bundle, not the dev server. */
export async function startServer() {
  const server = spawn('bunx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Own process group: `bunx` forks vite as a child, and signalling only
    // the wrapper leaves the real server holding the port — which then makes
    // every later run 404 against a stale working directory.
    detached: true,
  })

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('vite preview did not start in time')), 30000)
    const onData = (chunk) => {
      if (String(chunk).includes(String(PORT))) {
        clearTimeout(timer)
        resolve()
      }
    }
    server.stdout.on('data', onData)
    server.stderr.on('data', onData)
    server.on('exit', (code) => reject(new Error(`vite preview exited with ${code}`)))
  })

  return {
    origin: ORIGIN,
    stop: () => {
      try {
        process.kill(-server.pid, 'SIGTERM')
      } catch {
        server.kill('SIGTERM')
      }
    },
  }
}

export async function launchBrowser() {
  return chromium.launch({ executablePath: CHROMIUM_PATH })
}

/**
 * Opens the app and waits for the splash to finish its load, leaving the
 * "tap to enter" gate on screen. `cpuThrottle` emulates a slower device via
 * CDP — the lab machines and phones this runs on are nowhere near the
 * container's CPU, and an unthrottled desktop hides exactly the stalls this
 * migration is meant to remove.
 */
export async function openApp(browser, viewportName, { cpuThrottle = 1 } = {}) {
  const context = await browser.newContext({
    viewport: { width: VIEWPORTS[viewportName].width, height: VIEWPORTS[viewportName].height },
    deviceScaleFactor: VIEWPORTS[viewportName].deviceScaleFactor,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()

  if (cpuThrottle > 1) {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle })
  }

  // `?probe=1` exposes the current scene key on `window` (see src/probe.ts) so
  // the harness can wait for a real state change instead of guessing entrance
  // durations. Deliberately not `?debug=1`, which paints a log overlay.
  await page.goto(`${ORIGIN}/?probe=1`, { waitUntil: 'load' })
  return { context, page }
}

/** Design-space (1920x1080, centred) -> viewport pixels. */
export async function toViewport(page, x, y) {
  return page.evaluate(
    ([dx, dy, dw, dh]) => {
      const scale = Math.min(window.innerWidth / dw, window.innerHeight / dh)
      return {
        x: window.innerWidth / 2 + (dx - dw / 2) * scale,
        y: window.innerHeight / 2 + (dy - dh / 2) * scale,
      }
    },
    [x, y, DESIGN_WIDTH, DESIGN_HEIGHT],
  )
}

export async function clickDesign(page, x, y, settleMs = 900) {
  const point = await toViewport(page, x, y)
  await page.mouse.click(point.x, point.y)
  await page.waitForTimeout(settleMs)
}

/** Drags in design space, in `steps` moves, so pointermove handlers see a real gesture. */
export async function dragDesign(page, from, to, { steps = 40, holdMs = 60 } = {}) {
  const start = await toViewport(page, from.x, from.y)
  const end = await toViewport(page, to.x, to.y)

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.waitForTimeout(holdMs)
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * i) / steps,
      start.y + ((end.y - start.y) * i) / steps,
    )
  }
  await page.mouse.up()
}

/** Wheel-scrolls over a design-space point — the Jalur PCB materi gate needs the page scrolled to its end. */
export async function wheelDesign(page, x, y, deltaY, ticks = 12) {
  const point = await toViewport(page, x, y)
  await page.mouse.move(point.x, point.y)
  for (let i = 0; i < ticks; i++) {
    await page.mouse.wheel(0, deltaY)
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(400)
}

/**
 * Counts animation frames the page actually served during `durationMs` while
 * `interact` runs. Both renderers are measured the same way: a starved main
 * thread cannot serve rAF, so this reflects the jank a learner feels
 * regardless of whether the pixels come from WebGL or the compositor.
 */
export async function measureFps(page, durationMs, interact) {
  await page.evaluate(() => {
    window.__frames = 0
    window.__longTasks = 0
    const tick = () => {
      window.__frames += 1
      window.__rafId = requestAnimationFrame(tick)
    }
    window.__rafId = requestAnimationFrame(tick)
    window.__observer = new PerformanceObserver((list) => {
      window.__longTasks += list.getEntries().length
    })
    try {
      window.__observer.observe({ entryTypes: ['longtask'] })
    } catch {
      /* longtask unsupported — frame count alone still tells the story */
    }
  })

  const started = Date.now()
  await interact()
  const elapsed = Date.now() - started
  if (elapsed < durationMs) await page.waitForTimeout(durationMs - elapsed)

  const result = await page.evaluate(() => {
    cancelAnimationFrame(window.__rafId)
    window.__observer?.disconnect()
    return { frames: window.__frames, longTasks: window.__longTasks }
  })

  const seconds = Math.max(Date.now() - started, durationMs) / 1000
  return { fps: +(result.frames / seconds).toFixed(1), longTasks: result.longTasks }
}

/**
 * Waits until the probe reports `sceneKey` is on screen, then lets its
 * entrance animation land — a scene is live (and `currentScene` already set)
 * well before its buttons accept input.
 */
export async function waitForScene(page, sceneKey, settleMs = 2200) {
  await page.waitForFunction((key) => window.__edrawlab?.scene === key, sceneKey, { timeout: 30000 })
  await page.waitForTimeout(settleMs)
}

/**
 * Clicks a design-space point until the app actually lands on `sceneKey`.
 *
 * Every clickable thing in this app enables its input only after an entrance
 * animation whose length varies with the asset load, so a single click on a
 * fixed timer is a coin flip — the first baseline run silently clicked a menu
 * that was still animating in and captured Home three times. Re-clicking is
 * safe: each scene guards its own transitions, so a click that lands during
 * one is ignored rather than queued.
 */
export async function clickUntilScene(page, point, sceneKey, { tries = 20, intervalMs = 700, settleMs = 2200 } = {}) {
  const target = await toViewport(page, point.x, point.y)

  for (let attempt = 0; attempt < tries; attempt++) {
    if (await page.evaluate((key) => window.__edrawlab?.scene === key, sceneKey)) {
      await page.waitForTimeout(settleMs)
      return
    }
    await page.mouse.click(target.x, target.y)
    await page.waitForTimeout(intervalMs)
  }

  const actual = await page.evaluate(() => window.__edrawlab?.scene)
  throw new Error(`never reached scene "${sceneKey}" (still on "${actual}")`)
}

/** Home menu button centres, in design space (mirrors MENU_ITEMS in the Home scene). */
export const HOME_MENU = {
  desainSkema: { x: 318.5, y: 590.3 },
  jalurPcb: { x: 829.2, y: 590.3 },
  cadCasing: { x: 318.5, y: 841.2 },
  evaluasiAkhir: { x: 829.2, y: 839.7 },
}

/** Shared journey chrome, in design space. */
export const NEXT_BUTTON = { x: DESIGN_WIDTH - 180, y: 1006 }
export const GO_HOME_ICON = { x: 68, y: 64 }
