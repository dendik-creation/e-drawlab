---
title: Scope
---

# Scope

## In scope — confirmed by the approved documents

| Area | Detail | Requirements |
| --- | --- | --- |
| Five screens | Home + guide, three stages, evaluation | REQ-F-001…004, [[Screens]] |
| Standards guide | Paper A4–A0, line thickness 0.13–1.00 mm, etiket, manual instruments | REQ-EDU-003, REQ-EDU-004, REQ-F-003 |
| Case-study trigger | Assembly failure from tolerance miscalculation | REQ-F-004 |
| Stage 1 | Three LED circuits, drag & drop on A4, etiket validation | REQ-EDU-009, REQ-F-005…007 |
| Stage 2 | Copper-weight trace-width model, 45° routing, DRC check | REQ-EDU-010, REQ-EDU-011, REQ-F-008…011 |
| Stage 3 | Casing dimension model, three sliders, 3D orbit, fit test | REQ-EDU-012, REQ-F-012…014 |
| Feedback | Visual consequence animations, error audio, standardisation meter | REQ-EDU-015, REQ-F-015, REQ-F-016 |
| Assessment | 18 stage-embedded items + 3 closing reflective items | REQ-EDU-013, REQ-EDU-014, REQ-F-020 |
| Results | Per-competency score, stars, badge, certificate, redesign | REQ-EDU-016, REQ-EDU-017, REQ-F-019, REQ-F-021, REQ-F-022 |
| Media | SFX, music, ambience per scene; 16×9 art | REQ-F-023, REQ-NF-002 |
| Licensing | CC-BY-NC-SA line, asset-licence icon, no developer identity on the front page | REQ-F-026, REQ-NF-007 |

## In scope — confirmed by the Project Brief

Web-based delivery, local-first data, installable PWA, full offline operation after install, responsive layout, landscape-first design, deployable online, single codebase for both modes. Requirements REQ-NF-008…010, REQ-PWA-001…010, REQ-UX-001.

## Out of scope

- Real netlist/Gerber export or any manufacturable artefact.
- Free-form schematic capture. Stage 1 validates against the three specified circuits, not arbitrary designs.
- Component libraries beyond what the stages need (battery, resistor, LED, junction, plus the pads named in Scene 03: `R1, C1, D1, T1`).
- Teacher dashboard, class management, LMS grade sync, analytics, telemetry.
- Accounts, authentication, cloud storage of learner work.
- Multi-language UI. Source content is Indonesian; nothing asks for translation.
- Native mobile or desktop packaging.
- Content for elements other than `TMR_TLEKTRO_4`.

## Scope boundaries that are undecided

Each one is a real fork in the build, not a detail:

1. **Stage 2 slider range.** The main proposal's `0.2–1.5 mm` cannot express the revision's `2.5–20 mm` results. Range and tolerance band are unspecified. → [[Open-Questions]], [[Stage-2-PCB-Trace-Width]]
2. **Stage 3 input surface.** Whether clearance / standoff / component height / wall thickness are given as task data or manipulated by the learner. → [[Stage-3-Casing-Dimensions]]
3. **Teacher material in-product.** Whether answer keys ship inside the app at all. → [[Proposal-Comparison]] CH-05
4. **Certificate format.** "Downloadable certificate" with no stated format; a fully offline client can generate an image or a print view, not a signed document.
5. **Score mapping.** 18 items → the 100-point per-competency table is not defined by either document.
6. **Step counter.** "dari 4" vs "dari 5", and where three Stage-1 circuits fit into it.

## Related

- [[Goals]] · [[Requirements]] · [[Roadmap]] · [[Open-Questions]]
