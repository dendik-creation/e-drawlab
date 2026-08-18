---
title: Open Questions Decision Record
---

# Open Questions — Decision Record

Status: **Proposed decisions for PO/T/BL/ADM review.** Nothing here closes an item in [[Open-Questions]] until owner confirms. Basis: approved proposal + revised teaching material + current vault docs. Anything not supported by those sources marked Open, owner must supply.

## Decision Summary

| ID | Decision | Owner | Status |
| --- | --- | --- | --- |
| Q-01 | Trace-width range task-driven, not global 0.2–1.5 mm. Required width = current × copper factor. | T + BL | Proposed |
| Q-02 | Learner controls Length, Width, Height only. Rest = task data. | T + BL | Proposed |
| Q-03 | Stage 3 encloses Stage-2-produced PCB, not hardcoded 100×60×15. | T | Proposed |
| Q-04 | 100-pt/four-band/star/badge mapping not derivable from sources. | T | Open |
| Q-05 | Separate Stage from Task. Stage 1 = 3 tasks; Stage 2/3 separate; final reflection separate. | T | Proposed |
| Q-06 | Frontend: TypeScript + Vite + Phaser. | BL | Proposed |
| Q-07 | 3D: Three.js alongside Phaser, pending lab hardware check (Q-30). | BL | Proposed |
| Q-08 | No exposed teacher answer-key dataset. Client validation = rules, not secrecy boundary. | T + PO | Proposed |
| Q-09 | Standardisasi Meter at 0% recoverable via remediation, not game-over. | T | Proposed |
| Q-10 | Meter deductions apply Stages 1–3, severity-based. | T | Proposed |
| Q-11 | Wrong quiz answer = retry + feedback, no auto-reveal. Meter impact = T decision. | T | Proposed |
| Q-12 | Undersized casing fails; oversized passes if fit/clearance still valid. | T | Proposed |
| Q-13 | Stage 1 sequential: 1 LED, 2 LED series, 2 LED parallel. | T | Proposed |
| Q-14 | Teach `I = P / V` when P and V given. | T | Proposed |
| Q-15 | IEC/ANSI precedence undecided in sources. | T | Open |
| Q-16 | Completed stages reviewable; historical score untouched unless explicit replay. | T + BL | Proposed |
| Q-17 | Guide reachable from inside stage via overlay, no reload. | T | Proposed |
| Q-18 | Three home entries: Studi Kasus, Panduan Aturan, Masuk Lab. | T | Proposed |
| Q-19 | Certificate: local PDF generation if kept. Format = PO + T. | PO + T | Proposed |
| Q-20 | Trace-temperature curve needs approved data/model, else drop. | T | Open |
| Q-21 | T authors 3 closing quiz stems. | T | Open |
| Q-22 | T authors Studi Kasus narrative. | T | Open |
| Q-23 | T authors 4 manual-instrument descriptions. | T | Open |
| Q-24 | T confirms paper sizes + line-type thickness. | T | Open |
| Q-25 | T confirms Etiket field list. | T | Open |
| Q-26 | T authors one failure message per reason code. | T | Open |
| Q-27 | T re-authors Stage 1/3 instructions to match revision. | T | Open |
| Q-28 | Stage 2 pad layout re-authored for LED circuits; old R1/C1/D1/T1 not final. | T + BL | Open |
| Q-29 | Stage 3 formulas need verification vs original `.docx` images. | T | Open |
| Q-30 | Lab hardware/browser/WebGL/storage inventory required. | BL | Open |
| Q-31 | AI-art CC-BY-NC-SA redistribution not assumable from label. | ADM | Open |
| Q-32 | Exact attribution wording = ADM to supply. | ADM | Open |
| Q-33 | Institution/authors/dates absent from sources; PO decides placement. | PO | Open |
| Q-34 | Accessibility target unspecified. | PO | Open |

---

# Detailed Answers

## Q-01 — [[Stage-2-PCB-Trace-Width]] slider range and pass tolerance

Approved storyboard range `0.2–1.5 mm` inconsistent with revised material's worked examples.

Revised material:

| Copper thickness | Factor |
| --- | ---: |
| 0.5 oz | 2 mm/A |
| 1 oz | 1 mm/A |
| 2 oz | 0.5 mm/A |

`Required Trace Width = Load Current × Copper Factor`

Examples: 5A → 10/5/2.5mm · 6A → 12/6/3mm · 10A → 20/10/5mm. Global 0.2–1.5mm slider cannot express these — matches [[ADR-010-Trace-Width-Model]] finding.

**Recommendation:** no fixed global slider range. Task defines valid range around its required value. Pass: `studentTraceWidth >= requiredTraceWidth`. Exact UI min/max still a build decision post-confirmation.

Status: requires T + BL confirmation.

## Q-02 — [[Stage-3-Casing-Dimensions]] learner-controlled variables

Use three variables from proposal: Length, Width, Height.

Task data (not learner sliders): PCB length/width/thickness, component height, standoff height, clearance, wall thickness.

```text
Learner-controlled: casing.length, casing.width, casing.height
Task data: pcb.length, pcb.width, pcb.thickness, component.height,
           standoff.height, clearance, wallThickness
```

Status: proposed, T + BL confirmation.

## Q-03 — Which PCB does Stage 3 enclose

Stage 3 encloses PCB produced/defined by Stage 2, not fixed 100×60×15mm only.

Flow: Stage 1 → circuit config → Stage 2 → PCB/task state → Stage 3 → casing validation.

100×60×15mm may remain as a task fixture if teacher explicitly selects it.

Status: proposed, T confirmation required.

## Q-04 — [[Assessment-Strategy]] 100-point/four-band

Cannot be safely derived from sources. Proposal example: Standardisasi Skema 24/25, PCB Layout 28/30, 3D Casing 20/20, Evaluasi Kuis 20/25, total 92/100 — but 18 items + performance validation + star bands + badge threshold not fully mapped.

Required: item weights, performance weights, band thresholds, star thresholds, badge threshold, rounding rule.

Status: blocking, T decides.

## Q-05 — Stage/Task terminology

Docs mix "dari 4"/"dari 5"; Stage 1 has 3 circuit activities.

```text
STAGE 1 — Schematic Workbench (Task 1: 1 LED · Task 2: 2 LED Series · Task 3: 2 LED Parallel)
STAGE 2 — PCB Layout
STAGE 3 — 3D Casing
FINAL — Evaluation/Reflection
```

Don't use "Step" for both stage and task. UI: `Stage 1/3` · `Task 2/3`.

Status: proposed, T confirmation required. Resolves [[Technical-Debt]] D-2.

## Q-06 — Frontend stack

Recommended: TypeScript + Vite + Phaser. Reasons: offline-first, SPA-like nav, game-oriented interaction, static asset delivery, drag/drop, canvas rendering, local persistence, no server needed.

Phaser owns game/app runtime instead of adding heavier web framework.

**Conflict flag:** current [[ADR-002-Frontend-Stack]] compares React/vanilla-TS/Next.js/Svelte only — no Phaser option evaluated there. This answer introduces a option ADR-002 doesn't cover. ADR needs update or new option before BL can accept.

Status: proposed BL decision.

## Q-07 — 3D rendering approach

Recommended: Phaser + Three.js. Phaser: app flow, Stage 1, Stage 2, HUD, scoring, feedback, nav. Three.js: Stage 3 casing viewport, PCB/casing 3D, orbit.

Conditional on Q-30. If lab hardware can't support WebGL/3D reliably, Stage 3 falls back to 2.5D — matches [[ADR-006-3D-Rendering-Approach]] option B fallback already on record.

Status: proposed, BL after Q-30.

## Q-08 — Teacher answer keys in client bundle

Don't ship obvious `answers.json`. Prefer `question + validation rule` over `question + answer = B`.

App is offline — client rules aren't a security boundary, technically capable user can inspect. Goal: avoid unnecessary exposure, not guarantee secrecy.

Status: proposed, T + PO confirmation.

## Q-09 — Standardisasi Meter at 0%

```text
Meter 0% → remediation state → corrective explanation → learner completes remediation → meter recovers
```

No permanent lockout. Formative learning favors recoverable state.

Status: proposed, T confirmation.

## Q-10 — Meter deductions Stages 2/3

Yes, only for meaningful errors. Severity: Minor -5% · Moderate -10% · Major -20% · Critical -30%.

Examples: Stage 1 wrong orientation → minor/moderate. Stage 2 invalid routing/unsafe trace → major. Stage 3 casing collision → major.

Status: proposed, T confirmation.

## Q-11 — Wrong quiz answer

```text
Wrong answer → feedback → retry
```

No immediate answer reveal. Meter impact = T decision; recommended default: quiz mistakes affect quiz score, not meter (meter = procedural standardization).

Status: proposed, T confirmation.

## Q-12 — Oversized casing

Oversized passes if it still satisfies required dimensional constraints. Undersized → PCB collision → FAIL. Sufficiently sized → PASS.

If exercise specifically assesses manufacturing efficiency/precision, excessive oversize can produce warning or efficiency-score penalty instead.

Status: proposed, T confirmation.

## Q-13 — Stage 1 circuit order

Sequential: 1. Single LED → 2. Two LEDs series → 3. Two LEDs parallel. Follows revised material ordering. Learner completes each before advancing.

Status: proposed, T confirmation.

## Q-14 — Teach `I = P / V`?

Recommended: teach calculation when task supplies P and V. Example: P=60W, V=12V → I=P/V=5A. Revised material already uses P/V scenarios then supplies current for trace-width calc.

If objective is strictly drawing/layout not electrical calc, current can be supplied directly instead.

Status: proposed, T confirmation.

## Q-15 — IEC vs ANSI precedence

Sources mention both, no precedence rule defined. Don't invent one. T must specify primary standard and fallback when they differ.

Status: open, T.

## Q-16 — Backward review

Completed stages reviewable. Review doesn't silently invalidate recorded completion.

```text
Review mode → learner inspects/replays → original completion stays recorded
```

Redo creates new attempt, doesn't mutate historical attempt.

Status: proposed, T + BL confirmation.

## Q-17 — Guide inside stages

Yes, overlay/panel: `Stage → [Guide] → Guide Overlay → [Close] → Stage resumes`. No reload. Matches proposal's SPA/non-linear nav concept.

Status: proposed, T confirmation.

## Q-18 — Home screen entries

Three: STUDI KASUS, PANDUAN ATURAN, MASUK LAB — per flowchart. Two-button storyboard treated as outdated vs flowchart. Resolves [[Technical-Debt]] D-7.

Status: proposed, T confirmation.

## Q-19 — Certificate format

No server → local generation. `Completion → Generate certificate → PDF`. Wording/metadata/formal-issuance = PO + T.

Status: proposed, PO + T confirmation.

## Q-20 — Trace-temperature curve

Don't invent curve. `Could`-priority requirement, but no dataset/equation/pedagogical interpretation supplied. Required: data source, or approved model, or remove feature. No valid source/model → remove rather than fabricate.

Status: open, T.

---

# Content Authoring (Q-21–Q-28)

- Q-21: T authors 3 closing reflective quiz stems (answer keys already fixed elsewhere).
- Q-22: T authors Studi Kasus narrative.
- Q-23: T authors 4 manual-instrument descriptions — compass, T-square, set square(s), technical pencil.
- Q-24: T authoritative paper-size values + line-type mapping, not generic conventions.
- Q-25: T final Etiket field list, modeled as structured data not hardcoded text boxes.
- Q-26: one educational failure message per reason code, structure: what happened / why wrong / what rule applies / what to try. Example:

```text
Trace too narrow
The selected trace cannot carry the required current
under this task's copper-thickness rule.
Required: 5.0 mm  Selected: 2.0 mm
Increase the trace width and check the DRC again.
```

- Q-27: approved revision = source of truth; don't implement old storyboard where conflicting.
- Q-28: old R1/C1/D1/T1 pad set not final — revised material focuses Stage 1 on LED circuits. Needs T + BL re-authoring.

All: open, T (Q-28 also BL).

---

# Verification (Q-29, Q-30)

**Q-29** — Stage 3 formulas from revised material:

```text
Lin = PCB length + clearance both sides
Win = PCB width + clearance both sides
Hin = Hstandoff + TPCB + Hcomponent + top clearance
Lout = Lin + 2×wall thickness
Wout = Win + 2×wall thickness
Hout = Hin + 2×wall thickness
```

Examples: `60+1.5+1.5=63mm`, `40+1.5+1.5=43mm`, `5+1.6+18+2.4=27mm`. Present in revised doc but re-derived, not quoted — needs verification against original `.docx` images.

Status: blocking, T must verify.

**Q-30** — Before finalizing 3D rendering, collect: browser versions, WebGL support, GPU class, CPU/RAM, screen resolution, aspect ratios, audio availability, offline storage restrictions, max package size. Proposal targets <25MB offline + 16:9 — verify against actual lab.

Status: blocking, BL.

---

# Administrative (Q-31–Q-34)

- Q-31: don't assume `CC-BY-NC-SA` label alone makes AI-generated art ("Sumber: gemini ai" / "Sumber: canva ai") redistributable. ADM confirmation required.
- Q-32: ADM supplies exact attribution wording. Don't invent it.
- Q-33: institution/authors/dates absent from sources. PO decides: where recorded, whether in docs, whether in app metadata, relation to front-page identity restriction (REQ-NF-007).
- Q-34: no accessibility target specified. PO picks target (e.g. Basic / WCAG 2.1 AA / WCAG 2.2 AA), becomes explicit NFR.

All: open, respective owner (ADM/ADM/PO/PO).

---

# Recommended Decision Order

```text
Q-30 Lab inventory
  → Q-06 Frontend stack
  → Q-07 3D approach
  → Q-01 Stage 2 calc/range
  → Q-28 Stage 2 content
  → Q-02 + Q-03 Stage 3 model
  → Q-29 Stage 3 formula verification
  → Q-05 Stage/task structure
  → Q-04 Assessment model
  → Q-08 Answer-key strategy
  → Q-09–Q-20 Pedagogy/UX
  → Q-21–Q-27 Content authoring
  → Q-31–Q-34 Administrative
```

# Proposed Technical Baseline

Until decisions finalized:

```text
Runtime: TypeScript + Vite
Game/App: Phaser
3D: Three.js, conditional on Q-30
Persistence: IndexedDB

Architecture: UI/Game Layer → Domain Rules → Assessment → Local Persistence

Stage 1 — Schematic: Single LED, 2 LED Series, 2 LED Parallel
Stage 2 — PCB Layout: trace-width calc + routing/DRC
Stage 3 — 3D Casing: Length/Width/Height fitting
Final — Evaluation + reflective quiz
```

Marked **proposed** until each owner confirms. See [[Open-Questions]] for the live tracking table, [[Decisions-Index]] for engineering ADRs.
