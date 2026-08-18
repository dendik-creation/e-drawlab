---
title: Educational Testing
---

# Educational Testing

Verifies that the product teaches and measures what the approved documents say it should — `REQ-EDU-*` and the outcomes in [[Learning-Outcomes]].

## 1. Content fidelity

Every value in the product must match the approved source. Automatable, and worth automating: a content error reaches an entire class at once.

| # | Check |
| --- | --- |
| ED-1 | All three circuits match [[Stage-1-Schematic-Standards]]: 5 V, R1 220 Ω / 100 Ω / 220 Ω+220 Ω, stated current paths |
| ED-2 | Copper-weight table matches the revision exactly: 17.5/35/70 µm ↔ 2/1/0.5 mm per A |
| ED-3 | All 18 items match [[Question-Bank]] verbatim, with correct keys |
| ED-4 | Engine-computed answers agree with every revision worked answer ([[Functional-Testing]]) |
| ED-5 | No teacher-only field is reachable in a learner view (REQ-EDU-021) |
| ED-6 | Every content object carries a populated `source` field |

## 2. Outcome coverage

Each outcome in [[Learning-Outcomes]] must have at least one piece of evidence the product can actually observe.

| Outcome | Evidence | Covered |
| --- | --- | --- |
| LOC-1 … LOC-3 | Stage 1 validation + Q-S1-01…09 | ✔ |
| LOC-4 | Guide instrument pop-ups | ⚠ opened but not scored — by design; nothing in the source scores it |
| LOC-5 … LOC-7 | Stage 2 validation + Q-S2-01…03 | ✔ |
| LOC-8 … LOC-10 | Stage 3 validation + Q-S3-01…06 | ✔ |
| LOC-11 | Closing reflective quiz | ⚠ blocked — stems unwritten |
| LOC-12 | Meter at completion | ⚠ blocked — 0% behaviour undefined |

The two ⚠ blocked rows are tracked in [[Open-Questions]], not silently accepted.

## 3. Item analysis, after real use

Using the failure codes and answers recorded in [[Data-Architecture]] — anonymous, device-local, and only if a teacher chooses to collect them:

| Signal | Interpretation | Action |
| --- | --- | --- |
| An item answered correctly by nearly everyone | Too easy, or the key is guessable | Review distractors |
| An item failed by nearly everyone | Ambiguous stem, or the concept was never taught | Fix content, not the learner |
| One distractor never chosen | Dead option in a 3-option item — raises the guess floor | Rewrite it |
| One failure code dominating a stage | The interface teaches the wrong expectation | Fix the stage or the instruction text |
| High retry counts with eventual success | Guess-and-check rather than reasoning | Revisit tolerance and retry cost ([[Assessment-Strategy]]) |

Note the known validity limits already recorded in [[Assessment-Strategy]]: three-option items have a 33% guess floor, and scores are group-attributable at best.

## 4. Teacher review gate

Before any classroom use, the subject teacher confirms:

- [ ] The three circuits, values and current paths are correct and teachable at Fase E.
- [ ] The trace-width model is presented as practical guidance, not as an engineering standard ([[Standards-References]]).
- [ ] The casing formulas match the printed source ([[Technical-Debt]] D-4).
- [ ] Every educational failure message is accurate and age-appropriate.
- [ ] The scoring model is defensible given REQ-EDU-018 makes it a gate.
- [ ] Symbol shapes follow one consistent standard (IEC or ANSI) per symbol.

This gate is not optional: the product decides whether a student may enter the physical workshop.

## Related

- [[Learning-Outcomes]] · [[Assessment-Strategy]] · [[Question-Bank]] · [[Usability-Testing]]
