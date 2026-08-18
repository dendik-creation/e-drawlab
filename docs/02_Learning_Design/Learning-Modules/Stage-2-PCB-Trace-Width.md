---
title: "Stage 2 — CAD PCB Layout"
stage: 2
scene: "03"
---

# Stage 2 — CAD PCB Layout

Authoritative content for Stage 2. Screen behaviour: [[Scene-03-Stage-2-PCB-Layout]]. Items: [[Question-Bank]] §Stage 2. Decision: [[ADR-010-Trace-Width-Model]].

## The trace-width model

> Source: Approved Revision — Section `STAGE 2`. Supersedes the flat "≥ 0.3 mm" rule (REQ-EDU-010, [[Proposal-Comparison]] CH-02).

| Ketebalan tembaga (T) | Tebal | Faktor pengali praktis | Penggunaan |
| --- | --- | --- | --- |
| 0,5 oz | 17,5 µm | **2 mm/A** | Komponen kecil |
| 1 oz | 35 µm | **1 mm/A** | Standar umum / modul elektronik |
| 2 oz | 70 µm | **0,5 mm/A** | Rangkaian daya tinggi (power supply, motor) |

```text
trace_width_mm = current_A × factor_mm_per_A(copper_weight)
```

Principle, verbatim: *"semakin tebal lapisan, semakin sempit lebar jalur yang dibutuhkan untuk mengalirkan arus listrik"*.

**Etch-safety floor (REQ-EDU-011).** However small the computed width, a drawn trace has a manual-drawing minimum of **0.8–1.0 mm** so it is not eaten away by the etching solution (ferric chloride). A 0.05 A signal trace computes to 0.1 mm but is drawn at 0.8–1.0 mm.

## Worked exercise set

Source energy is a 12 V accu in all three; current is derived as `P / V`.

| Soal | Beban | Power | Current |
| --- | --- | --- | --- |
| 1 | Lampu halogen 12V/60W | 60 W | 5 A |
| 2 | Modul Peltier pendingin 12V/72W | 72 W | 6 A |
| 3 | Motor DC power window 12V/120W | 120 W | 10 A |

Answer grid, verbatim from the revision:

| Arus beban | 0,5 oz (2 mm/A) | 1 oz (1 mm/A) | 2 oz (0,5 mm/A) |
| --- | --- | --- | --- |
| 5 A | 10 mm | 5 mm | 2,5 mm |
| 6 A | 12 mm | 6 mm | 3 mm |
| 10 A | 20 mm | 10 mm | 5 mm |

Note for content authors: the derivation `I = P / V` is *used* by the exercise set but never *taught* in either document. Whether Stage 2 must teach it, or hand the learner the current directly, is **To Be Decided** — [[Open-Questions]].

## Retained mechanics from the main proposal

> Source: Approved Proposal — Sections `ALUR INTERAKSI`, `STORYBOARD` Scene 03

- Simulated PCB-design software interface; green board with pads `R1, C1, D1, T1`.
- Trace-width slider showing a live millimetre readout (REQ-F-008).
- Drag routing from pad to pad; corners at **45°, never 90°** (REQ-F-010).
- `[PERIKSA JALUR]` runs the DRC and reports pass/fail (REQ-F-011).
- Failure: `short.mp3`, flames along the trace, break from induced overcurrent, learner must correct and resubmit (REQ-F-015).
- Pass → Stage 3.

## Conflict to resolve before build

`Status: To Be Decided`

```text
Question:
What is the Stage 2 slider range and pass tolerance?

Context:
- Main proposal slider: 0.2 mm – 1.5 mm, with a hard floor of 0.3 mm.
- Revision results span 2.5 mm – 20 mm.
  The main proposal's range cannot express a single revision answer.
- Neither document states a tolerance band for "correct" width.

Candidates:
A. Range 0.1–20 mm, non-linear (log) slider, tolerance ±5% of target.
B. Range fixed per task from the task's own answer (target ×2 headroom),
   tolerance ±0.1 mm.
C. Replace the free slider with a numeric input plus a coarse slider.

Decision:
Pending. Blocks REQ-F-008 / REQ-F-009 implementation.
Owner: subject teacher + build lead.
```

A second open item: the copper-weight control (0.5 / 1 / 2 oz) required by REQ-F-009 does not exist in the main proposal's Scene 03 layout. It must be added to the right-hand panel next to the DRC rules box — [[Scene-03-Stage-2-PCB-Layout]].

Third: the main proposal's "0.3 mm minimum" is not simply wrong — it is the *signal-trace* case, and the revision's etch floor of 0.8–1.0 mm is stricter. Recommendation: teach the etch floor, drop the 0.3 mm constant. Recorded in [[ADR-010-Trace-Width-Model]].

## Related

- [[Learning-Objectives]] (LO-4, LO-5) · [[Question-Bank]] · [[Stage-3-Casing-Dimensions]]
- [[Feedback-Model]] · [[Scene-03-Stage-2-PCB-Layout]]
