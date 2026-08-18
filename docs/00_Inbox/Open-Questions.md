---
title: Open Questions
---

# Open Questions

Everything that requires a human decision. Nothing here has been guessed into a fact elsewhere in the vault.

Draft answers for every item below: [[Open-Questions-Decision-Record]]. All **Proposed**, none close an item here until owner confirms.

Owners: **PO** = project owner · **T** = subject teacher · **BL** = build lead · **ADM** = administrative

## Blocking — build cannot proceed correctly without these

| # | Question | Owner | Impact | Detail |
| --- | --- | --- | --- | --- |
| Q-01 | What is the Stage 2 slider range and pass tolerance? The approved 0.2–1.5 mm cannot express the revision's 2.5–20 mm answers | T + BL | Blocks REQ-F-008, REQ-F-009 | [[Stage-2-PCB-Trace-Width]] |
| Q-02 | Which Stage 3 variables does the learner control — three sliders with the rest as task data, or more? | T + BL | Blocks REQ-F-012, REQ-F-014 | [[Stage-3-Casing-Dimensions]] |
| Q-03 | Which PCB does Stage 3 enclose — the Stage-2 board, or the fixed 100×60×15 mm one? | T | Blocks REQ-F-029 continuity | [[Stage-3-Casing-Dimensions]] |
| Q-04 | How do 18 items plus performance validation map onto the 100-point, four-band score? Including star bands and the badge threshold | T | Blocks REQ-F-017, REQ-F-019 | [[Assessment-Strategy]] |
| Q-05 | What is the step total — "dari 4", "dari 5", and where do three Stage-1 circuits fit? | T | Blocks REQ-F-018 | [[Technical-Debt]] D-2 |
| Q-06 | Which frontend stack? | BL | Blocks all build phases | [[ADR-002-Frontend-Stack]] |
| Q-07 | Which 3D rendering approach — pending a lab hardware inventory? | BL | Blocks Stage 3 | [[ADR-006-3D-Rendering-Approach]] |
| Q-08 | Do teacher answer keys ship inside the client bundle at all? | T + PO | Shapes the content model | [[Proposal-Comparison]] CH-05 |

## Product and pedagogy

| # | Question | Owner | Detail |
| --- | --- | --- | --- |
| Q-09 | What happens when the Standardisasi Meter reaches 0%? Is it recoverable? | T | [[Feedback-Model]] |
| Q-10 | Do Stages 2 and 3 also deduct meter percentage, as Stage 1 does? | T | [[Feedback-Model]] |
| Q-11 | Does a wrong quiz answer cost meter, reveal the key, or allow a retry? | T | [[Feature-Quiz-Engine]] |
| Q-12 | Does an oversized casing fail, warn, or pass? | T | [[Stage-3-Casing-Dimensions]] |
| Q-13 | Are the three Stage-1 circuits sequential or selectable? | T | [[Feature-Schematic-Workbench]] |
| Q-14 | Does Stage 2 teach `I = P / V`, or supply the current directly? | T | [[Stage-2-PCB-Trace-Width]] |
| Q-15 | Which symbol standard governs where IEC and ANSI differ? | T | [[Standards-References]] |
| Q-16 | Is backward review of a completed stage allowed? | T + BL | [[Navigation]] |
| Q-17 | Should the guide be reachable from inside a stage? | T | [[Navigation]] |
| Q-18 | Home screen: two buttons (storyboard) or three (flowchart)? | T | [[Technical-Debt]] D-7 |
| Q-19 | What is the certificate's format, given no server exists? | PO + T | [[Feature-Results-Dashboard]] |
| Q-20 | What data drives the trace-temperature curve (REQ-F-027, priority `Could`)? | T | [[Feature-Results-Dashboard]] |

## Content to author

| # | Item | Owner |
| --- | --- | --- |
| Q-21 | Three closing reflective quiz stems — answers already fixed | T |
| Q-22 | Studi Kasus narrative | T |
| Q-23 | Four manual-instrument descriptions | T |
| Q-24 | Paper-size table values and per-line-type thickness assignment | T |
| Q-25 | Etiket field list | T |
| Q-26 | One educational failure message per reason code | T |
| Q-27 | Re-authored Stage 1 and Stage 3 instruction text (the approved text still describes pre-revision content) | T |
| Q-28 | Stage 2 pad layout aligned with the LED circuits — the `R1, C1, D1, T1` set predates the revision | T + BL |

## Verification

| # | Question | Owner |
| --- | --- | --- |
| Q-29 | Confirm the Stage 3 formulas against the images in the original `.docx` — they were re-derived, not quoted | T |
| Q-30 | Inventory the school lab: WebGL, browser versions, screen sizes, audio, storage policy | BL |

## Administrative

| # | Question | Owner |
| --- | --- | --- |
| Q-31 | Can AI-generated reference art ("Sumber: gemini ai / canva ai") be redistributed under CC-BY-NC-SA? | ADM |
| Q-32 | Exact wording and attribution subject of the CC-BY-NC-SA line | ADM |
| Q-33 | Institution, authors and dates — absent from both documents. Are they to be recorded anywhere, given REQ-NF-007 forbids developer identity on the front page? | PO |
| Q-34 | Accessibility conformance target | PO |

## Related

- [[Technical-Debt]] · [[Tasks]] · [[Roadmap]] · [[Proposal-Comparison]]
