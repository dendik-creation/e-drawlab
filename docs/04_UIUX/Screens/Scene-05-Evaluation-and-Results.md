---
title: "Scene 05 — Laman Evaluasi & Hasil Akhir"
scene: "05"
---

# Scene 05 — Laman Evaluasi & Hasil Akhir

> Source: Approved Proposal — Section `STORYBOARD`, Scene 05

## Treatment

Closing screen of the single-page application: transparent formative score recap, industry badge award, reflective case-study quiz, and a clean asset-attribution line at the very bottom.

## Visual

| Zone | Specification |
| --- | --- |
| Background | Digital blueprint look, dark blue gradient, informative, free of any creator identity |
| Left — score panel | Circular "Total Skor: 92/100", five glowing gold stars, "EXPERT CAD DESIGNER" trophy-medal badge |
| Right — score detail | Standardisasi Skema 24/25, PCB Layout 28/30, 3D Casing 20/20, Evaluasi Kuis 20/25 |
| Quiz block | Interactive form, 3 multiple-choice items on real manufacturing dimensional-tolerance limits — stated answers: `± 0.1 mm`, `45°`, "menjamin kesesuaian fungsi" |
| Controls | Grey circular `[DESAING ULANG]` *(sic — DESAIN ULANG)* at lower left, bright green `[SELESAI]` at lower right |

The scores shown are an **example run**, not thresholds. Star bands and badge threshold are undefined — [[Assessment-Strategy]].

## Narasi

> "Selamat! Kamu berhasil menuntaskan seluruh standarisasi perancangan produk elektronika. Jawablah kuis studi kasus di bawah ini untuk memvalidasi kesiapan kerja industrimu!"

## Suara

| Layer | Asset | Volume |
| --- | --- | --- |
| SFX | `applause.wav` (applause when the gold medal first appears), `bell.wav` (bright bell on each correct quiz answer), `sfx_click.wav` (button click) | full |
| Musik / Ambience | `victory_design.mp3` — grand, spirited closing victory theme, looping | stated but truncated in the source |

## Interaksi

| Mode | Behaviour |
| --- | --- |
| **Normal** | Gold light particles fall continuously across the screen; the final score counts up dynamically from 0 and locks at its value |
| **Hover** | Quiz option boxes (A, B, C, D) bold their text and lighten their background under the cursor; `[DESAIN ULANG]` micro-vibrates on hover |
| **Hit** | 1. Click a quiz option → `bell.wav`, answer locks. 2. Click `[DESAIN ULANG]` → `sfx_click.wav`, the system clears the data log, resets the score, and returns to Scene 01 as a clean workbench instantly, with no application reload |
| **Swipe** | Vertical swipe or wheel scroll to read the full industrial case-study question text |
| **Show** | A large green check appears beside a validly answered item. The Creative Commons (CC-BY-NC-SA) attribution line is displayed neatly on the bottom row |
| **Drag/drop** | disabled |

## Implementation notes

> Source: Engineering Decision

- The storyboard shows options "(A, B, C, D)" but every authored item in [[Question-Bank]] has three options. Build for three, render whatever the content declares.
- The `bell.wav`-on-answer behaviour is written for the correct case only; the wrong-answer path is unspecified — [[Feature-Quiz-Engine]].
- `[DESAIN ULANG]` must also clear persisted local state, not just in-memory state, so the next group on a shared lab machine starts clean ([[Feature-Scoring-and-Progress]]).
- Falling particles and micro-vibration respect `prefers-reduced-motion` ([[Accessibility]] A-7).
- Certificate download is specified in `RENCANA IMPLEMENTASI` but not drawn on this screen; it belongs here — [[Feature-Results-Dashboard]].

## Related

- [[Feature-Results-Dashboard]] · [[Feature-Quiz-Engine]] · [[Assessment-Strategy]] · [[Scene-01-Home-and-Guide]]
