---
title: "Stage 3 — 3D CAD Casing"
stage: 3
scene: "04"
---

# Stage 3 — 3D CAD Casing

Authoritative content for Stage 3. Screen behaviour: [[Scene-04-Stage-3-3D-Casing]]. Items: [[Question-Bank]] §Stage 3.

## The dimensional model

> Source: Approved Revision — Section `STAGE 3`. Supersedes the "casing ≥ PCB" rule (REQ-EDU-012, [[Proposal-Comparison]] CH-03).

Four variables the student must account for, verbatim from the revision:

| Variable | Meaning | Typical range stated |
| --- | --- | --- |
| `L_PCB × W_PCB × T_PCB` | Board length, width, thickness | task data |
| `H_komponen` | Tallest component (elco, relay, heatsink) | task data |
| `H_standoff` | Mounting pillar the board screws onto | 3 – 5 mm |
| `clearance` | Safety gap so the board is not pinched | 1 – 2 mm per side |

Plus `wall_thickness` for the external shell.

```text
L_in = L_PCB + 2 × clearance
W_in = W_PCB + 2 × clearance
H_in = H_standoff + T_PCB + H_komponen + top_clearance

L_out = L_in + 2 × wall_thickness
W_out = W_in + 2 × wall_thickness
H_out = H_in + 2 × wall_thickness
```

**Provenance warning.** The revision contains the headings `Ukuran Dalam Casing (Lin, Win, Hin)` and `Ukuran Luar Casing (Lout, Wout, Hout)` but the formula bodies did not survive text extraction — they are likely images in the source file. The formulas above were **re-derived from the worked answers and verified against all six of them**:

| Check | Given | Formula result | Revision key |
| --- | --- | --- | --- |
| Item 1 | 60×40, clearance 1.5 | 63.0 / 43.0 | B. 63,0 & 43,0 ✔ |
| Item 2 | standoff 5, T 1.6, komponen 18, top 2.4 | 27.0 | C. 27,0 ✔ |
| Item 3 | in 80×50×30, wall 2 | 84×54×34 | B. 84×54×34 ✔ |
| Extra 1 | 75×45, clearance 2.0 | 79.0 / 49.0 | B. 79,0 & 49,0 ✔ |
| Extra 2 | `H_in` 23.0, standoff 4, T 1.5, komponen 15 → top | 2.5 | B. 2,5 ✔ |
| Extra 3 | in 90×55×32, wall 2.5 | 95×60×37 | B. 95×60×37 ✔ |

Extra 2 also confirms the model runs backwards: `top_clearance = H_in − (H_standoff + T_PCB + H_komponen)`. Extra 3 confirms wall thickness is added **twice to the height as well** — the lid and the floor.

Before content freeze, confirm the printed formulas in the original `.docx` match these — [[Open-Questions]].

## Retained mechanics from the main proposal

> Source: Approved Proposal — Sections `ALUR INTERAKSI`, `STORYBOARD` Scene 04

- 3D box model floating left, the Stage-2 PCB shown right (REQ-F-029).
- Three sliders — Panjang, Lebar, Tinggi — resizing the model live (REQ-F-012).
- Constant slow auto-rotate plus manual click-drag orbit (REQ-F-013).
- `[UJI KECOCOKAN]` runs the fit test (REQ-F-014).
- Undersize failure: `crash.mp3`, the PCB slams into the wall and the shell cracks (REQ-F-015).
- Success: green check, the board seats, auto-transition to Scene 05.

## Conflicts and open specification

`Status: To Be Decided`

```text
Question 1:
Which of the four variables does the learner control?

Context:
The main proposal gives exactly three sliders (L/W/H). The revision's model needs
clearance, standoff, component height and wall thickness as well. Four extra
sliders would drown the screen; hard-coding them hides the very arithmetic the
revision was written to teach.

Candidates:
A. Task data panel shows PCB size, standoff, component height, wall thickness;
   learner sets only L/W/H — matching the storyboard exactly.
B. Learner sets L/W/H plus a single "clearance" control.
C. Two sub-steps: compute internal dimensions, then add walls.

Recommendation: A for Stage 3's main task, with the arithmetic assessed by the
six MCQ items. Preserves the approved storyboard and still targets LO-6.

Decision: Pending. Owner: subject teacher + build lead.
```

```text
Question 2:
Which PCB does Stage 3 enclose?

Context:
The main proposal fixes 100×60×15 mm; the revision's worked boards are 60×40,
75×45, 80×50 and 90×55 mm. REQ-F-029 requires carrying the Stage-2 board forward.

Candidates:
A. Carry the Stage-2 board forward and treat its dimensions as task data.
B. Keep the fixed 100×60×15 mm board from the main proposal.

Recommendation: A — the whole design chain (G-2) depends on continuity, and the
revision's boards demonstrate the model is meant to be parameterised.

Decision: Pending.
```

Also unspecified: whether an over-large casing fails. The revision's model produces an *exact* target, so "too loose" is now a defensible failure mode ("terlalu longgar"), but neither document describes its animation or penalty. Recommend a soft warning rather than a crack — [[Feedback-Model]].

## Related

- [[Learning-Objectives]] (LO-6) · [[Question-Bank]] · [[Stage-2-PCB-Trace-Width]]
- [[Scene-04-Stage-3-3D-Casing]] · [[ADR-006-3D-Rendering-Approach]]
