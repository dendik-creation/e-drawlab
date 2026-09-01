/**
 * Frame-rate benchmark for the screens this migration exists to fix.
 *
 * Usage: bun run perf:bench -- <label>   (default label: "current")
 *
 * Runs at 4x CPU throttling on a phone-sized viewport: the container's CPU is
 * far faster than a school lab PC or a student's phone, and an unthrottled
 * run hides exactly the stalls being measured. Numbers are comparative
 * between labels, not absolute device predictions.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { launchBrowser, measureFps, openApp, startServer } from './driver.mjs'
import {
  CASING_ORBIT,
  JALUR_SLIDER,
  WORKBENCH_DRAG,
  backToHome,
  clickNext,
  dragDesign,
  enterHome,
  openJourney,
  scrollMateriToEnd,
} from './flows.mjs'

const label = process.argv[2] ?? 'current'
/**
 * Default 1x: this container renders WebGL in software, which is already a
 * heavy handicap — stacking CPU throttling on top pinned every scene at
 * 3-4 fps, saturating the measurement so no scene could be told apart from
 * another. Raise it with PERF_CPU=4 when comparing two builds that both sit
 * comfortably above 60 fps here.
 */
const CPU_THROTTLE = Number(process.env.PERF_CPU ?? 1)
const SAMPLE_MS = 3000

/** Repeats a drag back and forth for the whole sample window. */
function sweep(page, path, passes = 3) {
  return async () => {
    for (let i = 0; i < passes; i++) {
      await dragDesign(page, path.from, path.to, { steps: 24 })
      await dragDesign(page, path.to, path.from, { steps: 24 })
    }
  }
}

const server = await startServer()
const browser = await launchBrowser()
const results = []

async function record(name, page, interact) {
  const measurement = await measureFps(page, SAMPLE_MS, interact)
  results.push({ scene: name, ...measurement })
  console.log(`  ${name.padEnd(28)} ${String(measurement.fps).padStart(5)} fps   ${measurement.longTasks} long tasks`)
}

try {
  const { context, page } = await openApp(browser, 'phone', { cpuThrottle: CPU_THROTTLE })
  console.log(`[bench] label=${label} cpu=${CPU_THROTTLE}x viewport=phone\n`)

  await enterHome(page)
  await record('home (idle)', page, () => page.waitForTimeout(SAMPLE_MS))

  await openJourney(page, 'desainSkema')
  await clickNext(page, 1800)
  await record('desain-skema drag komponen', page, sweep(page, WORKBENCH_DRAG))
  await backToHome(page)

  await openJourney(page, 'jalurPcb')
  await record('jalur-pcb materi (scroll)', page, () => scrollMateriToEnd(page))
  await clickNext(page, 1800)
  await record('jalur-pcb drag slider', page, sweep(page, JALUR_SLIDER))
  await backToHome(page)

  await openJourney(page, 'cadCasing')
  await clickNext(page, 1800)
  await record('cad-casing orbit 3D', page, sweep(page, CASING_ORBIT))

  await context.close()

  await mkdir('.screenshots', { recursive: true })
  const outFile = `.screenshots/bench-${label}.json`
  await writeFile(outFile, JSON.stringify({ label, cpuThrottle: CPU_THROTTLE, sampleMs: SAMPLE_MS, results }, null, 2))
  console.log(`\nSaved to ${outFile}`)
} finally {
  await browser.close()
  server.stop()
}
