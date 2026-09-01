---
title: Render Migration Plan
---

# Render Migration Plan — Phaser canvas → React components

Migrating every scene from Phaser-drawn canvas to React DOM/SVG components,
for performance. Approved scope: **remove Phaser entirely**, foundation
first, with a screenshot + FPS harness as the safety net.

## Why — the root cause

The slowness is not "the simulator code is heavy". It is the render model:

1. **The whole canvas is redrawn every frame**, whether anything changed or
   not. The backing store is `stage.width × DPR`: on a 2.2:1 landscape phone
   that is ~2400×1080 design px × DPR 2 = **~10 MP per frame**. Confirmed in
   the harness — at `deviceScaleFactor: 2` the splash's own progress tween
   stalls before the app is usable.
2. **Every `Phaser.Text` is a canvas texture.** `setText()` on a slider
   readout re-rasterises and re-uploads it. The Jalur PCB and CAD Casing
   panels carry dozens of readouts.
3. **`Graphics.clear()` + rebuild per repaint** — `simulasiStep.refresh()`,
   `paintViewport()`, `updateGhostHighlights()` rebuild geometry from
   scratch, already throttled by hand (see `simSlider.ts`).
4. **A WebGL filter mask** composites the Jalur PCB materi subtree through an
   offscreen render target *every frame*, with hand-written culling on top.

Evidence that it is the model and not the content: in the baseline benchmark
below, **idle Home is as slow as the simulators**.

DOM inverts all four — static content costs nothing once painted, text is
native, scrolling is compositor-driven, and only changed nodes repaint.
Vector work (schematic, trace preview, 3D box) becomes SVG, which React can
diff and which is cheap at these element counts (dozens, not thousands).

## Invariants — what must not change

- **Layout.** Every Figma-authored coordinate stays as-is, in design pixels.
- **Colour palette, fonts, timings.** Taken from the existing constants
  (`uiKit.ts`, scene modules), not re-eyeballed.
- **BGM flow control.** `AudioDirector`'s public API, profiles, crossfade,
  ducking and autoplay unlock stay identical; only its backend changes.
- **Content as data** (ADR-003). `circuits.ts`, `traceModel.ts`,
  `casingModel.ts`, the evaluation banks and their JSON are logic, not
  rendering — they carry over untouched.
- **Landscape-first** (ADR-009) and the portrait guard.

### The mapping that makes it safe

Phaser's stage maths (`stage.width × DPR` → FIT → `camera.setZoom(DPR)`)
reduces to exactly:

```
scale = min(viewportWidth / 1920, viewportHeight / 1080)
```

So the DOM stage is: viewport → `.stage` (sized `vw/scale × vh/scale` design
px, `transform: scale(...)`) → `.design-frame` (1920×1080, centred). Design
coordinates, `stageBounds()` and corner anchoring all carry over one to one.

## Phases

Each phase ends green (`build` + `lint`) and runnable, one commit each.

| # | Phase | Content |
| --- | --- | --- |
| 0 | Harness | Playwright capture + FPS bench, baseline recorded |
| 1 | Shell | DOM stage layer, scene router, Web Audio backend, motion helpers, token/component kit |
| 2 | Splash + Home | First React scenes end to end |
| 3 | Shared chrome | `JourneyHeader`, `EvaluationView` (used by all four journeys), Evaluasi Akhir migrated |
| 4 | Jalur PCB | Native scroll materi, DOM controls + SVG trace preview |
| 5 | CAD Casing | DOM sliders, SVG 3D viewport from a pure `projection` module |
| 6 | Desain Skema | SVG work sheet, pointer-event drag & drop, palette |
| 7 | Cleanup | Drop `phaser`, delete dead scene code, final measurements + docs |

All seven landed. The decision and its consequences are recorded in
[[ADR-011-DOM-First-Rendering]].

## Harness

```
bun run build
node scripts/perf/capture.mjs <label>   # .screenshots/<label>/*.png
node scripts/perf/bench.mjs   <label>   # .screenshots/bench-<label>.json
```

Both drive the app in **design coordinates** (`toViewport` converts), so the
same script works against either renderer. `?probe=1` exposes the current
scene key on `window` (`src/probe.ts`) so the harness waits for real state
changes instead of guessing entrance durations.

Screenshot comparison is by eye, not pixel diff: a canvas renderer and a DOM
renderer never rasterise text identically. What it catches is layout drift.

## Baseline — Phaser build, 2026-09-01

Bundle: **1 718,87 kB JS (463,71 kB gzip)**, CSS 11,05 kB.

FPS, phone viewport (873×393), no CPU throttling:

| Scene | fps | long tasks |
| --- | --- | --- |
| home (idle) | 4,6 | 13 |
| desain-skema, drag komponen | 6,2 | 464 |
| jalur-pcb materi (scroll) | 3,9 | 63 |
| jalur-pcb, drag slider | 6,1 | 463 |
| cad-casing, orbit 3D | 6,6 | 463 |

> Caveat: this container has **no GPU** — Chromium falls back to software
> WebGL, so these absolute numbers are far below what a real phone GPU would
> give. They are a comparative floor for a fill-rate-bound device, and the
> flat profile across scenes (idle Home ≈ the simulators) is the diagnostic
> point.

## Result — React build, 2026-09-01

Bundle: **308,08 kB JS (93,58 kB gzip)**, CSS 52,15 kB — down from 1 718,87 kB
(463,71 kB gzip) once `phaser` came out.

FPS, same viewport and method as the baseline above:

| Scene | Before | After |
| --- | --- | --- |
| home (idle) | 4,6 | 59,2 |
| desain-skema, drag komponen | 6,2 | 59,9 |
| jalur-pcb materi (scroll) | 3,9 | 60,2 |
| jalur-pcb, drag slider | 6,1 | 59,6 |
| cad-casing, orbit 3D | 6,6 | 59,6 |
| evaluasi-akhir (idle) | — | 60,2 |

Long tasks during interaction: **463 → 0**.

Final layout:

```
src/app/      shell: router, scene registry
src/ui/       reusable components + design tokens + the stage layer
src/scenes/   splash, home, desainSkema, jalurPcb, cadCasing, evaluation
src/domain/   pure logic: circuits, traceModel, casingModel, evaluation banks
src/audio/  src/state/
```

## Related

- [[ADR-011-DOM-First-Rendering]] · [[Application-Architecture]] · [[ADR-002-Frontend-Stack]]
- [[ADR-009-Landscape-First-Layout]] · [[Technical-Debt]] · [[Changelog]]
