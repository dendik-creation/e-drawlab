---
title: Tasks
---

# Tasks

Actionable work items. Phases and acceptance criteria: [[Roadmap]]. Requirement text: [[Requirements-Matrix]].

Status: `[ ]` open · `[~]` in progress · `[x]` done. Nothing is done — no application code exists.

## Blocking — must clear before building

- [ ] Decide the frontend stack — [[ADR-002-Frontend-Stack]]
- [ ] Inventory the school lab hardware (WebGL, browser versions, screen sizes, audio availability)
- [ ] Decide the 3D rendering approach — [[ADR-006-3D-Rendering-Approach]]
- [ ] Settle the Stage 2 slider range and pass tolerance — [[Stage-2-PCB-Trace-Width]]
- [ ] Settle which Stage 3 variables the learner controls — [[Stage-3-Casing-Dimensions]]
- [ ] Settle the score mapping, star bands and badge threshold — [[Assessment-Strategy]]
- [ ] Settle the step count ("dari 4" vs "dari 5", plus three Stage-1 circuits) — [[Open-Questions]]
- [ ] Decide whether teacher keys ship inside the client bundle — [[Proposal-Comparison]] CH-05

## Content authoring — owner: subject teacher

- [ ] Write the three closing reflective quiz stems (answers already fixed: ±0.1 mm, 45°, functional conformity)
- [ ] Write the Studi Kasus narrative
- [ ] Write the four manual-instrument descriptions
- [ ] Complete the paper-size table values and the per-line-type thickness assignment
- [ ] Define the etiket field list
- [ ] Write one educational failure message per reason code — [[Feedback-Model]]
- [ ] Re-author Stage 1 and Stage 3 on-screen instruction text, which still describes the pre-revision content
- [ ] Confirm the Stage 3 formulas against the original `.docx` images — [[Stage-3-Casing-Dimensions]]
- [ ] Decide whether Stage 2 teaches `I = P / V` or supplies the current

## Foundation

- [ ] Repository skeleton and tooling
- [ ] Dual-artefact build — [[ADR-005-Dual-Distribution]]
- [ ] CI: unit tests, schema validation, size gate, `file://` smoke test
- [ ] Version strings surfaced in the UI

## Content model

- [ ] JSON Schemas per [[Content-Architecture]]
- [ ] Startup + CI validation
- [ ] Populate the pack with all specified content
- [ ] Media manifest with sizes and licences

## Shell

- [ ] Scene state machine
- [ ] HUD: step indicator, meter, score, audio control
- [ ] Overlay layer with focus trapping
- [ ] Progress engine + persistence with fallback — [[ADR-004-Local-Persistence]]
- [ ] Layout system: scaled 16×9 stage, responsive chrome, portrait guard
- [ ] Home, guide overlay, case study

## Domain models

- [ ] Schematic: slots, topology, polarity, etiket/scale validation
- [ ] PCB: width check, 45° corners, connectivity, etch floor, located violations
- [ ] Casing: internal/external dimensions, per-axis fit result
- [ ] Reason-code vocabulary
- [ ] Tests reproducing every worked example in [[Question-Bank]]

## Stage interfaces

- [ ] Stage 1 workbench (drag/touch/keyboard)
- [ ] Stage 2 router incl. the new copper-weight control
- [ ] Stage 3 modeller incl. orbit and its keyboard alternative

## Feedback, audio, assessment

- [ ] Consequence choreography per failure mode
- [ ] Live-region announcements
- [ ] Meter and scoring from content configuration
- [ ] Quiz engine
- [ ] Audio layers, ducking, autoplay unlock, persisted mute

## Results

- [ ] Score dashboard, stars, badge, competency table
- [ ] Certificate — decide the format first ([[Feature-Results-Dashboard]])
- [ ] Trace-temperature chart (priority `Could`)
- [ ] `[DESAIN ULANG]` full reset including storage
- [ ] Attribution line and licence icon

## Offline / PWA

- [ ] Manifest and icons
- [ ] Service worker with precache and update flow
- [ ] Verify every `file://` constraint in [[Offline-Strategy]]
- [ ] Quota, eviction and corrupt-state recovery

## Validation

- [ ] Usability test with 3–4 students per screen
- [ ] Timing test against the 45-minute core phase
- [ ] Educational item analysis
- [ ] Accessibility review

## Administrative

- [ ] Confirm redistribution rights for AI-generated reference art — [[Content-Inventory]]
- [ ] Confirm the exact CC-BY-NC-SA attribution wording
- [ ] Confirm no developer identity appears anywhere in the shipped build

## Related

- [[Roadmap]] · [[Milestones]] · [[Technical-Debt]] · [[Open-Questions]]
