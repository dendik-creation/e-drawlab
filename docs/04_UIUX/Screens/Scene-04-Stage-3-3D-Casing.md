---
title: "Scene 04 — Stage 3: 3D CAD Casing"
scene: "04"
stage: 3
---

# Scene 04 — Stage 3: 3D CAD Casing

> Source: Approved Proposal — Section `STORYBOARD`, Scene 04. The fit rule is superseded by the revision — see [[Stage-3-Casing-Dimensions]].

## Treatment

Peak mechanical-design mission: manipulate three spatial variables to produce the product's casing.

## Visual

| Zone | Specification |
| --- | --- |
| Left | 3D model of a rectangular plastic casing, floating |
| Right | The PCB produced in Stage 2 |
| Lower right | Three dimension sliders — Panjang (mm), Lebar (mm), Tinggi (mm) — beside the `[UJI KECOCOKAN]` button |
| Top | Step indicator "Langkah 4 dari 5" |

**Inconsistency:** every other scene counts "dari 4"; this one says "dari 5". Unresolved — [[Open-Questions]].

## Narasi

> "Gunakan software CAD! Geser ketiga slider dimensi untuk membentuk ukuran casing yang pas guna membungkus papan PCB secara presisi tanpa menabrak dinding komponen! Ukuran kemasan harus ≥ ukuran papan PCB!"

The final clause is the rule the revision replaces with explicit clearance / standoff / component-height / wall-thickness formulas. Narration must be re-authored — [[Content-Inventory]].

## Suara

| Layer | Asset | Volume |
| --- | --- | --- |
| SFX | `lock_success.wav` (factory press machine, chassis locking into place), `crash.mp3` (hard plastic shattering on a dimensional collision) | full |
| Musik | `cad_tension.mp3` — intense, high-frequency, to drive critical spatial reasoning | 12% |
| Ambience | `3d_printer.mp3` — faint mechanical bustle of a 3D-printing workshop | 5% |

## Interaksi

| Mode | Behaviour |
| --- | --- |
| **Normal** | The 3D box rotates slowly and constantly (auto-orbit); its volume grows and shrinks dynamically as the slider millimetre values change |
| **Hover** | `[UJI KECOCOKAN]` emits a continuous pulsing neon glow under the pointer |
| **Hit** | Left-click `[UJI KECOCOKAN]` to mechanically test inserting the board into the enclosure |
| **Swipe** | Click-hold and swipe over the model to orbit the 3D viewpoint freely |
| **Show** | A miscalculated dimension (e.g. Panjang set to 80.00 mm against a 100 mm board) → Show Simulasi Kegagalan Spasial: `crash.mp3`, dramatic animation of the PCB striking the chassis wall until it cracks, error status shown. Correct size (≥ PCB) → green check, board seats perfectly, automatic transition to Scene 05 |
| **Drag/drop** | disabled |

## Implementation notes

> Source: Engineering Decision

- The fit test must report *which* axis failed so the collision animates on the right one — a short height means the lid hits the tallest component, not the wall ([[Feature-Casing-Modeller]]).
- Auto-rotate must respect `prefers-reduced-motion` ([[Accessibility]] A-7).
- Which PCB is enclosed — the Stage-2 board or the fixed 100×60×15 mm one — is unresolved ([[Stage-3-Casing-Dimensions]]).
- Rendering approach is undecided and constrained by lab hardware — [[ADR-006-3D-Rendering-Approach]].

## Related

- [[Stage-3-Casing-Dimensions]] · [[Feature-Casing-Modeller]] · [[Scene-05-Evaluation-and-Results]]
