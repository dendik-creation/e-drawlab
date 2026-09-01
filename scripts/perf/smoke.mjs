/**
 * Behavioural smoke test: the things a screenshot cannot see.
 *
 * Usage: node scripts/perf/smoke.mjs
 *
 * Exists because the render migration broke exactly one of them silently —
 * the audio director used to be started by the Phaser bootstrap, and deleting
 * that left the app mute with every screen still looking perfect. Screenshots
 * and frame rates both stayed green.
 */
import { launchBrowser, openApp, startServer } from './driver.mjs'
import { backToHome, clickNext, enterHome, openJourney, scrollMateriToEnd } from './flows.mjs'

const failures = []

function check(label, condition, detail) {
  const ok = Boolean(condition)
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

const server = await startServer()
const browser = await launchBrowser()

try {
  const { page } = await openApp(browser, 'desktop')
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`))

  const probe = () => page.evaluate(() => window.__edrawlab)

  console.log('[smoke] audio')
  await page.waitForTimeout(4000)
  const locked = await probe()
  check('silent before the first gesture', locked.audio.profile === 'silent' && !locked.audio.unlocked)

  await enterHome(page)
  const onHome = await probe()
  check('unlocks on the splash tap', onHome.audio.unlocked)
  check('menu profile on Home', onHome.audio.profile === 'menu', onHome.audio.profile)
  check('BGM playing', onHome.audio.music?.key === 'drawingTheme', onHome.audio.music?.key ?? 'none')

  console.log('[smoke] navigation')
  for (const journey of ['desainSkema', 'jalurPcb', 'cadCasing', 'evaluasiAkhir']) {
    await openJourney(page, journey)
    const scene = (await probe()).scene
    check(`Home -> ${journey}`, scene !== 'Home', scene)
    await backToHome(page)
    check(`${journey} -> Home`, (await probe()).scene === 'Home')
  }

  console.log('[smoke] jalur pcb steps')
  await openJourney(page, 'jalurPcb')
  const gateLocked = await page.evaluate(() => document.querySelector('.jm-footer button')?.disabled)
  check('Lanjut is gated until materi is read', gateLocked === true)
  await scrollMateriToEnd(page)
  const gateOpen = await page.evaluate(() => document.querySelector('.jm-footer button')?.disabled)
  check('Lanjut unlocks at the end of materi', gateOpen === false)

  await clickNext(page, 1600)
  const sim = await page.evaluate(() => ({
    current: document.querySelector('.sim-current-value')?.textContent,
    status: document.querySelector('.sim-status-label')?.textContent,
  }))
  check('simulator computes a current', /A$/.test(sim.current ?? ''), sim.current)
  check('simulator shows a verdict', Boolean(sim.status), sim.status)
} finally {
  await browser.close()
  server.stop()
}

console.log(failures.length === 0 ? '\nall checks passed' : `\n${failures.length} FAILED: ${failures.join(', ')}`)
process.exit(failures.length === 0 ? 0 : 1)
