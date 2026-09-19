/**
 * Regression test for the mobile fullscreen handshake.
 *
 * A number of mobile browsers only allow `screen.orientation.lock()` after
 * the fullscreen request has completed. Keep the request pending here, then
 * assert that the lock follows its success rather than racing it.
 */
import { chromium } from 'playwright'
import { launchBrowser, startServer } from './driver.mjs'

const remoteDebugUrl = process.env.BRAVE_DEBUG_URL
const browser = remoteDebugUrl ? await chromium.connectOverCDP(remoteDebugUrl) : await launchBrowser()
const server = await startServer()
let failure
let context

try {
  context = await browser.newContext({ viewport: { width: 873, height: 393 } })
  await context.addInitScript(() => {
    const probe = { requests: 0, locks: 0, active: false, finish: undefined }
    Object.defineProperty(window, '__fullscreenProbe', { configurable: true, value: probe })

    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value() {
        probe.requests += 1
        return new Promise((resolve) => {
          probe.finish = () => {
            probe.active = true
            resolve()
          }
        })
      },
    })

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => (probe.active ? document.documentElement : null),
    })

    Object.defineProperty(screen, 'orientation', {
      configurable: true,
      value: {
        lock: () => {
          probe.locks += 1
          return Promise.resolve()
        },
      },
    })
  })

  const page = await context.newPage()
  await page.goto(`${server.origin}/?probe=1`, { waitUntil: 'load' })
  await page.locator('.splash-tap-zone').waitFor({ state: 'visible', timeout: 30000 })
  await page.locator('.splash-tap-zone').click()

  const pending = await page.evaluate(() => window.__fullscreenProbe)
  if (pending.requests !== 1) throw new Error(`expected one fullscreen request, got ${pending.requests}`)
  if (pending.locks !== 0) throw new Error('orientation lock raced the pending fullscreen request')

  await page.evaluate(() => window.__fullscreenProbe.finish?.())
  await page.waitForFunction(() => window.__fullscreenProbe.locks === 1)
} catch (error) {
  failure = error
} finally {
  await context?.close()
  if (!remoteDebugUrl) await browser.close()
  server.stop()
}

if (failure) {
  console.error(`[fullscreen] FAIL: ${failure.message}`)
  process.exit(1)
}

console.log('[fullscreen] passed')
