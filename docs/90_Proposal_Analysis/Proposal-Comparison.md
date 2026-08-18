---
title: Proposal Comparison
status: Complete
---

# Proposal Comparison

Authoritative diff between the two approved documents. Precedence rule: **the revision wins on conflict; the main proposal remains the source for everything the revision does not touch.**

- Original/main: [[Proposal-Main]] — `TMR_TLEKTRO_4_Proposal_Gambar Teknik Elektronika_ok.docx`
- Revision: [[Proposal-Revision]] — `Revisi Materi_TE.docx`

## Summary table

| Area | Main Proposal | Revision | Final Interpretation |
| --- | --- | --- | --- |
| Project identity | "E-DrawLab: Desain CAD Elektronika", virtual lab, `TMR_TLEKTRO_4` | Silent | Unchanged — main proposal governs |
| Background / motivation | Procedural competency measured before physical practicum; avoid material waste | Silent | Unchanged |
| Target users | Murid SMK Kelas X, Teknik Elektronika, Fase E; teacher-facilitated | Silent on learners, but adds teacher-only answer keys and distractor rationales | Learners unchanged; **teacher confirmed as a second audience** with its own material |
| Objectives | Master drawing standards, schematic, PCB layout, 3D casing | Silent at the objective level; sharpens each stage's target competency | Objectives unchanged, now measurable — see [[Learning-Objectives]] |
| Learning content — Stage 1 | Generic "skema catu daya"; symbol library R/C/Transistor/Diode | **Three specified circuits**: 1 LED, 2 LED series, 2 LED parallel, with values (5 V, 220 Ω, 100 Ω) and current-path explanations | **Revision wins.** Stage 1 builds LED circuits, not a generic power supply |
| Learning content — Stage 2 | Trace width slider `0.2–1.5 mm`; rule "≥ 0.3 mm"; 45° corners; DRC | **Copper-weight model** (0.5/1/2 oz → 2/1/0.5 mm per A); `width = current × factor`; etch-safety floor 0.8–1.0 mm for signal traces | **Revision wins on the rule.** 45°-corner and DRC-check mechanics from the main proposal are retained (revision is silent on them) |
| Learning content — Stage 3 | Three L/W/H sliders; PCB fixed at `100×60×15 mm`; rule "casing ≥ PCB" | **Four-variable model**: clearance per side, standoff, component height, wall thickness, with `L_in`/`H_in`/`L_out` formulas and six worked items | **Revision wins.** "casing ≥ PCB" is superseded by explicit formulas |
| Features / interaction | SPA, 5 scenes, drag & drop, sliders, 3D orbit, Immediate Dynamic Feedback, scoring, badge, certificate, redesign | Silent | Unchanged — main proposal governs |
| Technology | Offline `index.html`, SPA, < 25 MB, 16×9, no build tooling named | Silent | Unchanged; technology stack remains an engineering decision — [[ADR-002-Frontend-Stack]] |
| Evaluation | 3 reflective MCQ items at the end; formative score per competency; total 92/100 example | **18 MCQ items** across the three stages, each with a key; teacher answer-and-explanation sections | **Both apply.** Stage-embedded items (revision) + closing reflective quiz (main). See [[Assessment-Strategy]] |
| Scope | 3 stages, 5 scenes, offline single-file delivery | No scope statement | Unchanged — [[Scope]] |
| Delivery / lesson plan | Async pre-learning, 15/45/30 min synchronous, groups of 3–4 | Silent | Unchanged |

## Change records

### CH-01 — Stage 1 subject matter replaced

```text
Original:
Stage 1 asks the student to arrange a logical "skema catu daya" (power-supply
schematic) from a library of Resistor / Capacitor / Transistor / Diode symbols
on a virtual A4 sheet, plus fill the etiket (title block).

Revision:
Stage 1 specifies three concrete circuits with fixed values and a stated current
path: (1) single LED with R1 = 220 Ω on 5 V, (2) two LEDs in series with
R1 = 100 Ω, (3) two LEDs in parallel with R1 = R2 = 220 Ω.

Final interpretation:
Stage 1 delivers three schematic tasks over the LED circuits above. The A4 sheet,
etiket, IEC/ANSI symbol library, drag & drop mechanic and standardisation meter
from the main proposal are retained as the *mechanics*; the revision supplies the
*content*.

Impact:
- Component library must contain battery, resistor, LED (anode/cathode aware),
  junction node — not transistor-centric power-supply parts.
- Validation logic must check series vs. parallel topology and LED polarity,
  and must recognise a junction dot as an electrical connection.
- Three tasks in one stage changes the step counter and scoring split.
  See [[Stage-1-Schematic-Standards]], REQ-EDU-009, REQ-F-005.
```

### CH-02 — Stage 2 trace-width rule replaced

```text
Original:
Trace width is a slider from 0.2 mm to 1.5 mm. The rule taught is a flat
minimum: "lebar lintasan wajib ≥ 0.3 mm". Failure below 0.3 mm or a 90° corner
burns the trace.

Revision:
Trace width is a *calculation*: width = current × factor, where the factor comes
from copper weight (0.5 oz → 2 mm/A, 1 oz → 1 mm/A, 2 oz → 0.5 mm/A). Worked
loads are 5 A, 6 A and 10 A, producing widths from 2.5 mm to 20 mm. Signal
traces keep an etch-safety floor of 0.8–1.0 mm.

Final interpretation:
Stage 2 teaches the copper-weight model. The student picks/receives a copper
weight and a load current, then sets the trace width to the computed value.
The 45°-corner routing rule and the [PERIKSA JALUR] DRC validation from the main
proposal stay.

Impact — HIGH:
- The 0.2–1.5 mm slider range is now unusable; the widest required width is
  20 mm. Slider range must be re-specified. Open decision: see [[Open-Questions]]
  and REQ-F-008 / REQ-F-009.
- A copper-weight control (0.5 / 1 / 2 oz) must be added to the Stage 2 UI —
  it does not exist in the main proposal's storyboard.
- The pass/fail rule changes from a constant to a computed target with a
  tolerance band; the tolerance band itself is not stated by either document.
- "Trace too thin → burns" feedback is still valid, but its threshold is now
  load-dependent rather than the flat 0.3 mm.
```

### CH-03 — Stage 3 fit rule replaced by dimensional formulas

```text
Original:
"Ukuran kemasan harus ≥ ukuran papan PCB". PCB is fixed at 100×60×15 mm.
Setting length to 80 mm (< 100 mm) cracks the casing.

Revision:
Casing size is derived:
  L_in = L_PCB + 2 × clearance          (clearance 1–2 mm per side)
  H_in = H_standoff + T_PCB + H_komponen + top_clearance   (standoff 3–5 mm)
  L_out = L_in + 2 × wall_thickness
Worked boards are 60×40, 75×45, 80×50×30 and 90×55×32 mm.

Final interpretation:
Stage 3 validates against the derived internal/external dimensions, not against
raw "≥ PCB". "Too small" (collision, crack) and "too loose" (excess clearance)
both become failure modes.

Impact:
- The three L/W/H sliders now need supporting inputs: clearance, standoff,
  component height, wall thickness — either as parameters given per task or as
  additional controls. Which of the two is undecided: [[Open-Questions]].
- The fixed 100×60×15 mm PCB from the main proposal conflicts with the
  revision's worked boards. Resolution: treat the PCB dimensions as *task data*,
  not a constant, and carry the Stage-2 board forward. REQ-F-012, REQ-F-014.
- The failure animation must distinguish "PCB hits the wall" from
  "component hits the lid" (height failure) — height is now modelled explicitly.
```

### CH-04 — Assessment expanded from 3 items to 18

```text
Original:
"3 butir soal kuis reflektif pilihan ganda" on manufacturing tolerance, on the
results screen only. Score breakdown: Standardisasi Skema 25, PCB Layout 30,
3D Casing 20, Evaluasi Kuis 25.

Revision:
18 multiple-choice items with keys, attached per stage: 9 for Stage 1,
3 for Stage 2, 3 + 3 supplementary for Stage 3. Each has 3 options and a
teacher explanation.

Final interpretation:
Two assessment layers coexist: in-stage formative items (revision) and the
closing reflective quiz (main proposal). The 25-point "Evaluasi Kuis" band from
the main proposal maps to the closing quiz; the in-stage items feed each stage's
own band.

Impact:
- A quiz engine is required inside the stages, not only on the results screen.
- The score model in the main proposal (92/100 example, per-competency table)
  survives but needs a defined mapping from 18 items to points.
  Mapping is not specified by either document — [[Open-Questions]], REQ-F-017.
```

### CH-05 — Teacher-facing material introduced

```text
Original:
Teacher appears only in the lesson plan (distributes the file, facilitates,
reinforces). No teacher-facing content inside the product.

Revision:
Sections titled "KUNCI JAWABAN & PEMBAHASAN UNTUK GURU" with answer keys,
worked solutions and distractor analysis.

Final interpretation:
Answer keys are teacher material. They must NOT ship as learner-visible content
in the same view as the questions.

Impact:
- Content model needs an audience field (learner / teacher) — see
  [[Content-Architecture]].
- Whether the app exposes a teacher view at all, or the keys stay in a printed
  LKPD-D, is undecided: [[Open-Questions]]. Shipping keys inside a fully
  offline, client-side bundle means they are readable by any student who opens
  the data files; a teacher "mode" is not a security boundary.
```

## Sections identical / untouched by the revision

Identity, general description, interaction flowchart, implementation plan, all five storyboard scenes, all audio/visual asset specifications, all non-functional constraints (< 25 MB, 16×9, offline `index.html`, SPA, no opening video, CC-BY-NC-SA attribution). These remain governed by [[Proposal-Main]].

## Nothing was removed

No requirement present in the main proposal is contradicted-and-deleted by the revision. Every change is a *replacement of subject matter inside an existing stage* or an *addition*.

## Related

- [[Requirements-Matrix]]
- [[Curriculum]]
- [[Open-Questions]]
