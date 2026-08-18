---
title: "Reference — External Standards"
---

# Reference — External Standards

External standards the content leans on. **Neither approved document cites a standard number or an edition** — they name families ("IEC/ANSI", "A4–A0") and give values. This note records what is named and what would have to be verified before the content claims compliance.

Nothing here is invented as a proposal fact.

## Named in the approved documents

| Reference | Where | What is actually stated |
| --- | --- | --- |
| IEC / ANSI symbol standards | Main §Identitas, §Rencana, Scene 02 | Component symbols must follow "standar internasional (IEC/ANSI)". No standard number, no edition, no statement of which one wins where they differ |
| Paper sizes A4–A0 | Main §Identitas, Scene 01 | A reference table is required. Values not given. These are ISO 216 sizes |
| Line thickness 0.13–1.00 mm | Main §Scene 01 | A range is given. The per-line-type assignment is not |
| Copper weight 0.5 / 1 / 2 oz (17.5 / 35 / 70 µm) | Revision §Stage 2 | Thickness values given and internally consistent |
| Trace-width multipliers 2 / 1 / 0.5 mm per A | Revision §Stage 2 | Presented as "faktor pengali **praktis**" — a practical rule of thumb, explicitly not a derivation |
| Etch-safety minimum 0.8–1.0 mm | Revision §Stage 2 teacher key | Justified by manual etching with ferric chloride |
| Standoff 3–5 mm, clearance 1–2 mm per side | Revision §Stage 3 | Given as typical practice ranges |
| 45° routing convention | Main §Scene 03 | Standard PCB practice; no citation |
| CC-BY-NC-SA | Main §Scene 05 | The licence for the product's assets |

## What to verify before claiming compliance

1. **Which symbol standard governs.** IEC 60617 and ANSI/IEEE 315 differ visibly for common parts — a resistor is a rectangle in one and a zigzag in the other. The content must pick one per symbol and be consistent, or teach the difference deliberately. Currently unspecified — [[Open-Questions]].
2. **Line-type assignment.** ISO 128 governs line types and widths in technical drawing. The proposal gives only a range, so the guide table must be authored ([[Content-Inventory]]).
3. **The trace-width rule is pedagogical, not IPC.** Real trace sizing (IPC-2221 and successors) depends on temperature rise, ambient temperature, internal vs external layers and trace length. The revision's flat mm-per-ampere multipliers are a teaching simplification, and the content should present them as such rather than as an engineering standard. This matters because REQ-EDU-018 makes the app a gate before real workshop practice.
4. **Licence compatibility of AI-generated reference art** under CC-BY-NC-SA — an administrative question ([[Content-Inventory]]).

## Position

The product teaches the *practice* the approved documents specify. Where that practice is a simplification of a formal standard, the content says so plainly. Do not add standard numbers to learner-facing content unless someone verifies the actual document.

## Related

- [[Glossary]] · [[Stage-2-PCB-Trace-Width]] · [[Content-Inventory]] · [[Open-Questions]]
