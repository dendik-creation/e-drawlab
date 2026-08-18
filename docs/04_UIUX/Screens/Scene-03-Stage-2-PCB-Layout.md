---
title: "Scene 03 — Stage 2: CAD PCB Layout"
scene: "03"
stage: 2
---

# Scene 03 — Stage 2: CAD PCB Layout

> Source: Approved Proposal — Section `STORYBOARD`, Scene 03. The trace-width rule is superseded by the revision — see [[Stage-2-PCB-Trace-Width]].

## Treatment

Two-way digital experiment: the learner controls the trace-width variable to connect component legs on a virtual PCB.

## Visual

| Zone | Specification |
| --- | --- |
| Centre | Simulated PCB design-software interface; green board with pad points `R1, C1, D1, T1` ready to connect |
| Right panel | Trace Width slider marked 0.2 mm to 1.5 mm, beside a compact Design Rule Check (DRC) rules box |
| Top overlay | Step indicator "Langkah 3 dari 4" |

Two corrections required by [[Proposal-Revision]]:
1. The slider range cannot express the revision's results (2.5–20 mm) — range unresolved, [[Open-Questions]].
2. A copper-weight control (0.5 / 1 / 2 oz) must be added to this panel; it does not exist in the original storyboard.

The pad set `R1, C1, D1, T1` also predates the revision's LED circuits, which contain no capacitor or transistor. Pad layout is a content task — [[Content-Inventory]].

## Narasi

> "Ubah variabel slider untuk menentukan ketebalan jalur tembaga, lalu lakukan penarikan garis (trace routing) antar kaki komponen dengan sudut lintasan belokan 45°, bukan 90°! Klik Periksa Jalur untuk melakukan validasi DRC!"

## Suara

| Layer | Asset | Volume |
| --- | --- | --- |
| SFX | `connect.wav` (clear digital connection on a successful route), `short.mp3` (short-circuit pop and electrical sparks on a wrong path) | full |
| Musik | `routing_focus.mp3` — problem-solving instrumental with a constant beat, to drive precision | 12% |
| Ambience | `pc_fan_hum.mp3` — constant CPU fan hum of a school lab computer | 6% |

## Interaksi

| Mode | Behaviour |
| --- | --- |
| **Normal** | The millimetre readout changes dynamically in real time as the slider moves. Pads glow dim yellow |
| **Hover** | Over the board routing area the arrow cursor becomes a trace-pen icon; `[Periksa Jalur]` scales up slightly on hover |
| **Hit** | Learner drags the width slider to the safe industrial value (source states: width must be ≥ 0.3 mm, example set to 0.40 mm) and clicks `[Periksa Jalur]` to run the automatic DRC audit |
| **Swipe** | disabled |
| **Show** | Trace too thin, or a sharp 90° corner → on validation, Show Simulasi Kegagalan: `short.mp3`, flames along the burning/broken trace from induced overcurrent, learner must fix the route. Valid → advance to Stage 3 |
| **Drag/drop** | Click-hold and drag a route from one component pad to another across the green board to connect the pads logically |

The "≥ 0.3 mm, example 0.40 mm" values in the **Hit** row are exactly what the revision replaces — see [[ADR-010-Trace-Width-Model]].

## Implementation notes

> Source: Engineering Decision

- Routing snaps each segment to a 45° multiple; the DRC still catches an illegal corner formed by chaining turns — [[Feature-PCB-Router]].
- The DRC returns located violations so flames play at the offending segment, not screen-wide.
- Trace-pen cursor has no hover equivalent on touch; use a persistent tool indicator instead.

## Related

- [[Stage-2-PCB-Trace-Width]] · [[Feature-PCB-Router]] · [[Feedback-Model]] · [[Scene-04-Stage-3-3D-Casing]]
