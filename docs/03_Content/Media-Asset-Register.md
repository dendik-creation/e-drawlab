---
title: Media Asset Register
---

# Media Asset Register

Every media asset named by the storyboard, with its budget bucket. Filenames are quoted from the proposal and are the canonical names.

> Source: Approved Proposal — Section `STORYBOARD`, Scenes 01–05

## Visual

| Asset | Scene | Spec | Status |
| --- | --- | --- | --- |
| `bg_studio_menu.png` | 01 | 16×9 illustration of a modern technical-drawing studio, no developer name | Not produced |
| Guide overlay art | 01 | Dark translucent panel, paper table, line specs, etiket, instrument icons | Not produced |
| Instrument icons ×4 | 01 | Jangka, penggaris T, sepasang penggaris segitiga, pensil teknik | Not produced |
| A4 sheet + border frame | 02 | White sheet, printed border, empty etiket | Not produced |
| Component symbols | 02 | IEC/ANSI: resistor, capacitor, transistor, diode, LED, battery, node | Not produced |
| Green PCB board + pads | 03 | Pads `R1, C1, D1, T1` | Not produced |
| Trace burn / flame animation | 03 | Fire along the copper, break | Not produced |
| 3D casing model | 04 | Parametric box, orbitable, crackable | Not produced |
| PCB 3D reference | 04 | The Stage-2 board beside the casing | Not produced |
| Blueprint background | 05 | Dark blue gradient, no creator identity | Not produced |
| Badge / medal | 05 | "EXPERT CAD DESIGNER" gold trophy medal | Not produced |
| Gold particle effect | 05 | Continuous falling light particles | Not produced |
| Star rating art | 05 | Five gold glowing stars | Not produced |

Typography named by the storyboard: **Poppins Bold, 48 pt** for the title block; yellow neon header text "Fase E - Jenjang SMK • Teknik Elektronika". Font licence and subsetting: [[ADR-007-Asset-Budget]].

## Audio

| File | Scene | Role | Volume |
| --- | --- | --- | --- |
| `click.mp3` | 01 | Menu click | full |
| `paper.wav` | 01 | Guide sheet sliding in | full |
| `sfx_hover.mp3` | 01 | Hover shimmer | full |
| `drawing_theme.mp3` | 01–02 | Menu/work music, looping | 15% → 10% ducked |
| `studio_ambience.mp3` | 01 | Studio air-conditioning hiss | 5% |
| `pencil_draw.wav` | 02 | Successful placement | full |
| `buzz.wav` | 02 | Placement error | full |
| `connect.wav` | 03 | Trace connected | full |
| `short.mp3` | 03 | Short circuit, sparks | full |
| `routing_focus.mp3` | 03 | Stage 2 music | 12% |
| `pc_fan_hum.mp3` | 03 | Lab PC fan | 6% |
| `lock_success.wav` | 04 | Press-machine lock, successful fit | full |
| `crash.mp3` | 04 | Plastic shattering | full |
| `cad_tension.mp3` | 04 | Stage 3 music | 12% |
| `3d_printer.mp3` | 04 | 3D printer room ambience | 5% |
| `applause.wav` | 05 | Badge award | full |
| `bell.wav` | 05 | Correct quiz answer | full |
| `sfx_click.wav` | 05 | Button click | full |
| `victory_design.mp3` | 05 | Victory music, looping | volume truncated in source |

19 named audio assets. Behaviour: [[Feature-Audio-System]]. Budget: [[Non-Functional-Requirements]] §Size budget.

## Production constraints

> Source: Engineering Decision

- Backgrounds: WebP or AVIF at 1920×1080, quality tuned to hit the 12 MB art bucket across five scenes.
- Icons and component symbols: SVG. They are line art — raster is both larger and worse here.
- Audio: mono where possible, ~96 kbps for music, lower for short SFX; loops must be gapless.
- Every asset needs a licence entry for the Scene 01 licence icon and the Scene 05 attribution line (REQ-F-026).
- Storyboard art is marked as AI-generated reference ("Sumber: gemini ai", "canva ai") — confirm redistribution rights before treating any of it as a final asset ([[Content-Inventory]] §Attribution).

## Related

- [[Content-Inventory]] · [[Feature-Audio-System]] · [[Asset-Caching-Strategy]] · [[ADR-007-Asset-Budget]]
