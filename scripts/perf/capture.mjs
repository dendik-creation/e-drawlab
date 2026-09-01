/**
 * Screenshots every scene/step at two viewports into `.screenshots/<label>/`.
 *
 * Usage: bun run perf:capture -- <label>   (default label: "current")
 *
 * The point is not pixel-equality — a canvas renderer and a DOM renderer will
 * never rasterise text identically — but catching gross layout drift while
 * the migration moves scene by scene.
 */
import { mkdir } from 'node:fs/promises'
import { launchBrowser, openApp, startServer } from './driver.mjs'
import { backToHome, clickNext, enterHome, openJourney, scrollMateriToEnd } from './flows.mjs'

const label = process.argv[2] ?? 'current'
const viewports = ['desktop', 'phone']

async function captureViewport(browser, viewportName, outDir) {
  const { context, page } = await openApp(browser, viewportName)
  const shot = async (name) => {
    await page.screenshot({ path: `${outDir}/${viewportName}-${name}.png` })
    process.stdout.write(`  ${viewportName}/${name}\n`)
  }

  await page.waitForTimeout(600)
  await shot('01-splash-loading')

  await enterHome(page)
  await shot('02-home')

  await openJourney(page, 'desainSkema')
  await shot('03-desain-skema-materi')
  await clickNext(page, 1800)
  await shot('04-desain-skema-level-1')
  await backToHome(page)

  await openJourney(page, 'jalurPcb')
  await shot('05-jalur-pcb-materi')
  await scrollMateriToEnd(page)
  await shot('06-jalur-pcb-materi-end')
  await clickNext(page, 1800)
  await shot('07-jalur-pcb-simulasi')
  await clickNext(page, 1800)
  await shot('08-jalur-pcb-evaluasi-intro')
  await backToHome(page)

  await openJourney(page, 'cadCasing')
  await shot('09-cad-casing-materi')
  await clickNext(page, 1800)
  await shot('10-cad-casing-simulasi')
  await clickNext(page, 1800)
  await shot('11-cad-casing-evaluasi-intro')
  await backToHome(page)

  await openJourney(page, 'evaluasiAkhir')
  await shot('12-evaluasi-akhir-intro')

  await context.close()
}

const server = await startServer()
const browser = await launchBrowser()
const outDir = `.screenshots/${label}`
await mkdir(outDir, { recursive: true })

try {
  for (const viewportName of viewports) {
    console.log(`[capture] ${viewportName}`)
    await captureViewport(browser, viewportName, outDir)
  }
  console.log(`\nSaved to ${outDir}/`)
} finally {
  await browser.close()
  server.stop()
}
