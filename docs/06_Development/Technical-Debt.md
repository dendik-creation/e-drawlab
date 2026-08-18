---
title: Technical Debt
---

# Technical Debt

No code exists, so there is no implementation debt yet. What follows is **inherited debt** — inconsistencies and gaps already present in the approved source material that will become technical debt the moment they are built around.

Recording them now prevents a future developer from treating a workaround as a design.

## D-1 — Storyboard contradicts the approved revision

Scene 03 specifies a 0.2–1.5 mm slider and a 0.3 mm rule that the revision supersedes; Scene 04's narration still states "casing ≥ PCB"; Scene 02's instruction text still says "skema catu daya". The screens are approved artefacts, so they cannot be edited — the corrections live in the screen notes and in [[Proposal-Comparison]].

**Debt**: anyone reading the storyboard alone will build the wrong rule.
**Mitigation**: every screen note carries an explicit correction block; content text is re-authored in Phase 6.

## D-2 — Step counter is inconsistent in the source

"Langkah 1/2/3 dari 4" in Scenes 01–03, "Langkah 4 dari 5" in Scene 04. Add three Stage-1 circuits and neither total is obviously right.

**Debt**: a hard-coded total will be wrong for someone.
**Mitigation**: the total comes from content ([[Feature-Scoring-and-Progress]]); the real answer is still owed — [[Open-Questions]].

## D-3 — Scoring model does not close

"+20 per valid placement" cannot fit inside a 25-point band across multiple placements, and the 18 revision items have no defined point value. The 92/100 example is illustrative, not a specification.

**Debt**: any implementation must invent numbers.
**Mitigation**: scoring constants live in content, marked as engineering defaults until the teacher settles them ([[Assessment-Strategy]]).

## D-4 — Formulas re-derived rather than quoted

The Stage 3 formula rows did not survive text extraction from the `.docx` (likely images). They were reconstructed and verified against all six worked answers, but not read directly.

**Debt**: a small chance of a discrepancy in an unexercised edge case.
**Mitigation**: verification task in [[Tasks]]; the derivation and its checks are shown in [[Stage-3-Casing-Dimensions]].

## D-5 — Two distributions, one of them unmonitored

The `file://` artefact has no service worker, no update channel and no error reporting. Regressions there are invisible until a classroom hits them.

**Debt**: the environment used for the *graded* session is the least observable one.
**Mitigation**: `file://` smoke test in CI from Phase 0; visible version strings ([[Deployment-Architecture]]).

## D-6 — Pad set predates the revision's circuits

Scene 03 names pads `R1, C1, D1, T1`, but the revision's circuits contain no capacitor or transistor.

**Debt**: Stage 2's board may not correspond to what Stage 1 built, breaking the design-chain continuity that is goal G-2.
**Mitigation**: pad layout is content; align it with the LED circuits in Phase 1.

## D-7 — Home screen button count differs between two approved sections

The flowchart specifies three buttons; the Scene 01 storyboard draws two.

**Debt**: minor, but the case study is load-bearing for the lesson plan and could silently disappear.
**Mitigation**: three buttons proposed in [[Feature-Guide-and-Case-Study]]; flagged for confirmation.

## D-8 — Failure loops have no exit

No skip, no hint escalation, and no defined behaviour when the Standardisasi Meter reaches 0%. A group can stall inside a 45-minute lesson.

**Debt**: a pedagogical dead end that will surface first in a real classroom.
**Mitigation**: anti-frustration rules proposed in [[Feedback-Model]]; needs a decision.

## Rules for this note

Add an entry when a workaround is chosen over a fix. Every entry states what breaks if it is ignored, and links the note that would need to change.

## Related

- [[Proposal-Comparison]] · [[Open-Questions]] · [[Tasks]] · [[Changelog]]
