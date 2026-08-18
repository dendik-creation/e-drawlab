---
title: "Scene 01 — Laman Muka & Panduan"
scene: "01"
---

# Scene 01 — Laman Muka (Main Menu) & Panduan

> Source: Approved Proposal — Section `STORYBOARD`, Scene 01

## Treatment

Single-page entry screen. The main menu responds to cursor movement and can transition to reveal the drawing-standards guide sheet non-linearly, without any external page reload.

## Visual

| Element | Specification |
| --- | --- |
| Background | `bg_studio_menu.png` — sharp digital illustration of a modern technical-drawing studio, 16×9, free of any developer name |
| Header branding (top left) | Yellow neon text: "Fase E - Jenjang SMK • Teknik Elektronika" |
| Title block (centre) | "E-DrawLab" — Poppins Bold, 48 pt, hard shadow, high contrast; sub-text "Laboratorium Maya Skema Rangkaian dan Desain CAD Elektronika" |
| Navigation | Two rounded rectangular buttons side by side below: solid dark blue `btn_masuk_lab` ("MASUK LAB") and `btn_panduan` ("PANDUAN ATURAN") |
| Licence icon | Small circular asset-licence info icon, bottom right |
| Guide overlay | Dark translucent grey panel: paper-size table (A4–A0), standard line-thickness spec (0.13 mm – 1.00 mm), etiket column format, manual-instrument icons (jangka, penggaris T, sepasang penggaris segitiga, pensil teknik) |

The `ALUR INTERAKSI` section specifies a **third** entry — Studi Kasus — which this storyboard does not draw. Resolution proposed in [[Feature-Guide-and-Case-Study]].

## Narasi

> "Aturan Main: Pelajari standardisasi ukuran kertas, etiket gambar, dan fungsi peralatan manual sebelum mengonstruksi skema rangkaian serta model 3D CAD! Pertahankan bar Standardisasi Meter jangan sampai habis!"

Note: the Standardisasi Meter is introduced here, in narration, before Stage 1 ever displays it.

## Suara

| Layer | Asset | Volume |
| --- | --- | --- |
| SFX | `click.mp3` (mechanical digital menu click), `paper.wav` (paper sheet sliding in as the guide opens), `sfx_hover.mp3` (high-frequency micro-shimmer on hover) | full |
| Musik | `drawing_theme.mp3` — calm mid-tempo electronic, design-studio mood, looping | 15% |
| Ambience | `studio_ambience.mp3` — constant soft air-conditioning hiss of a closed drawing studio | 5% |

## Interaksi

| Mode | Behaviour |
| --- | --- |
| **Normal** | Standard white triangular arrow cursor. All menu buttons static; the instruction panel hidden |
| **Hover** | Cursor over MASUK LAB or PANDUAN ATURAN → button scales +5%, brightness shifts to bright neon blue, plays `sfx_hover.mp3` |
| **Hit** | 1. MASUK LAB → `click.mp3`, menu music stops, main elements hide, Stage 1 shows directly as Scene 02. 2. PANDUAN ATURAN → opens the cognitive explanation overlay ("Langkah 1 dari 4") instantly with `paper.wav` |
| **Swipe** | Vertical scroll or swipe on the right-hand guide text panel to read the industrial line-thickness detail |
| **Show** | On first load → background, title and menu cards all fade in together over 0.5 s, no ministry opening video. Clicking an instrument icon shows a pop-up explaining its mechanical function |
| **Drag/drop** | disabled |

## Implementation notes

> Source: Engineering Decision

- "Menu music stops" on entering Stage 1 conflicts with Scene 02, which continues `drawing_theme.mp3` at 10%. Read as: the menu *mix* ends, the track ducks and continues.
- Audio cannot start before a user gesture; ambience and music begin on first interaction ([[Feature-Audio-System]]).
- The neon-yellow header over an illustrated background needs a scrim to meet contrast (A-4 in [[Accessibility]]).

## Related

- [[Feature-Guide-and-Case-Study]] · [[Feature-Application-Shell]] · [[Navigation]] · [[Scene-02-Stage-1-Schematic]]
