---
title: Assessment Strategy
---

# Assessment Strategy

How performance is measured and reported. Items live in [[Question-Bank]]; outcomes in [[Learning-Outcomes]].

## Two layers

| Layer | Source | Where | Purpose |
| --- | --- | --- | --- |
| **Performance validation** | Approved Proposal | Inside each stage | The manipulated model is itself the assessment — placement validity, DRC pass, fit test |
| **Item assessment** | Revision (18 items) + Main (3 closing items) | Stage-embedded and Scene 05 | Checks the reasoning behind the manipulation |

Performance validation is what makes this a lab rather than a quiz: a learner who guesses their way through MCQs still has to make a board that does not burn.

## Scoring, as stated

> Source: Approved Proposal — Sections `STORYBOARD` Scene 02, Scene 05

- `+20` points per valid Stage-1 placement.
- Standardisasi Meter starts at 100%, `−20%` per invalid action.
- Final table with four bands: Standardisasi Skema 25, PCB Layout 30, 3D Casing 20, Evaluasi Kuis 25 → 100.
- Example result shown: 24 / 28 / 20 / 20 = 92/100, five gold stars, "EXPERT CAD DESIGNER" medal.

## Scoring, undefined

`Status: To Be Decided`

```text
Question:
How do the 18 stage items and the performance validations combine into the
four bands of 100 points?

Unspecified by both documents:
- Points per MCQ item.
- Split between performance validation and item score inside each band.
- Whether a retry after a failure scores less than a first-time pass.
- Star-rating thresholds (5 stars shown at 92/100 — the band edges are unknown).
- Badge threshold for "EXPERT CAD DESIGNER".
- Whether the Standardisasi Meter reaching 0% ends the run, and what happens then.
- Whether a wrong MCQ answer also costs meter percentage.
- Interaction of "+20 per placement" with the 25-point Standardisasi Skema band —
  a 25-point band cannot hold more than one 20-point placement.

Candidate model (Engineering proposal, not approved):
  Standardisasi Skema 25 = 15 performance + 10 items (9 items, ~1.1 pt each)
  PCB Layout        30 = 21 performance + 9 items (3 items, 3 pt each)
  3D Casing         20 = 14 performance + 6 items (6 items, 1 pt each)
  Evaluasi Kuis     25 = 3 closing items, ~8.3 pt each
  First-time pass scores full; each retry −25% of that item's performance points.
  Stars: 5 ≥ 90, 4 ≥ 80, 3 ≥ 70, 2 ≥ 60, 1 below.
  Badge at ≥ 75 with all three stages passed.

Decision: Pending. Owner: subject teacher.
Blocks: REQ-F-017, REQ-F-019, REQ-EDU-016.
```

Note the arithmetic conflict above: "+20 per valid placement" cannot coexist with a 25-point band across multiple placements. One of the two numbers has to give. Recommendation: treat `+20` as an in-stage motivational counter, and normalise it into the 25-point band at the end.

## Feedback timing

Immediate and consequence-bearing during stages ([[Feedback-Model]]); deferred and summative on Scene 05. The closing quiz shows a green check as each item is answered, so it is immediate too but non-punitive.

## Teacher-facing assessment

The revision supplies keys and worked explanations, plus at least one explicit distractor analysis. These belong in the LKPD-D or a teacher print view, not beside the learner's questions (REQ-EDU-021). Distribution mechanism: **To Be Decided** — [[Open-Questions]].

## Validity concerns worth stating

> Source: Engineering Decision

1. **Three-option items** have a 33% guess floor. With 18 items this is acceptable formatively, not for a gate.
2. **The gate claim** (REQ-EDU-018 — pre-requisite for the workshop) means the score has real consequences for a student. The performance validations, not the MCQs, should carry the gate weight.
3. **Group work** (3–4 per screen) means the recorded score is a group score. The device-local progress model ([[Local-First-Architecture]]) cannot attribute it to an individual, and nothing in the proposal asks it to.

## Related

- [[Question-Bank]] · [[Learning-Outcomes]] · [[Curriculum]] · [[Educational-Testing]]
