---
title: "Scene 02 — Stage 1: Standardisasi Skema Manual"
scene: "02"
stage: 1
---

# Scene 02 — Stage 1: Standardisasi Skema Manual

> Source: Approved Proposal — Section `STORYBOARD`, Scene 02. Content values are superseded by the revision — see [[Stage-1-Schematic-Standards]].

## Treatment

First experiment: precise placement of electronics circuit symbols on a manual drawing sheet using drag and drop.

## Visual

| Zone | Specification |
| --- | --- |
| Centre | Empty white A4 sheet with a printed border frame; the etiket block in the lower-right corner and the drawing area are both empty |
| Right — component library | Rack of international (IEC/ANSI) symbols in random order — Resistor, Kapasitor, Transistor, Diode — alongside project text-data cards |
| Top — HUD | Horizontal progress bar "Langkah 2 dari 4", score board, Standardisasi Meter at 100% |

Content correction: per [[Proposal-Revision]], the circuits built here are the three LED circuits, so the library must also contain a battery/source, an LED with distinguishable polarity, and a junction node. The capacitor and transistor remain as identification distractors (LO-2).

## Narasi

> "Seret simbol komponen ke area kertas untuk membentuk skema rangkaian catu daya yang logis, serta susun data identitas proyek secara presisi pada kolom etiket!"

This instruction text says "catu daya" (power supply) and must be re-authored for the LED circuits — [[Content-Inventory]].

## Suara

| Layer | Asset | Volume |
| --- | --- | --- |
| SFX | `pencil_draw.wav` (pencil stroke on successful placement), `buzz.wav` (heavy error buzz when a component is wrong or reversed) | full |
| Musik | `drawing_theme.mp3` continuing, ducked | 10% |
| Ambience | — | — |

## Interaksi

| Mode | Behaviour |
| --- | --- |
| **Normal** | A4 sheet static; symbols lined up in the library drawer awaiting a drag |
| **Hover** | Cursor over a Diode or Transistor symbol → thin glowing yellow outline around the object |
| **Hit** | disabled |
| **Swipe** | disabled |
| **Show** | Reversed diode, or an invalid etiket scale (e.g. 5:1 on A4) → Red Flash, `buzz.wav`, Standardisasi Meter −20%, educational warning text. All placements valid → forward button unlocks |
| **Drag/drop** | Press and drag a symbol from the rack onto the sheet, release. If the coordinate is logically correct for the circuit, the object locks permanently with `pencil_draw.wav` and +20 points |

## Implementation notes

> Source: Engineering Decision

- "Posisi koordinat sirkuit logis" is implemented as named slots per circuit — [[Feature-Schematic-Workbench]].
- Three circuits in this stage vs. one progress step ("Langkah 2 dari 4") is unresolved — [[Open-Questions]].
- Library order is stated as random ("simbol acak"); randomisation must be seeded per task so a group's retry is reproducible for the teacher.
- The library is a drag *source* on desktop and must also work as tap-select → tap-slot on touch and keyboard (REQ-UX-003, REQ-UX-004).

## Related

- [[Stage-1-Schematic-Standards]] · [[Feature-Schematic-Workbench]] · [[Feedback-Model]] · [[Scene-03-Stage-2-PCB-Layout]]
