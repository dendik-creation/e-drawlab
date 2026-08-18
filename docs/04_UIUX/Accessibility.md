---
title: Accessibility
---

# Accessibility

> Source: Engineering Decision. Neither approved document states an accessibility requirement; nothing here is presented as a proposal fact.

Requirements: REQ-NF-013, REQ-UX-004, REQ-UX-006, REQ-UX-007.

## Conformance target

`Status: To Be Decided`

```text
Question:
Which conformance level does E-DrawLab target?

Candidates:
- WCAG 2.2 Level A — realistic minimum.
- WCAG 2.2 Level AA — the usual public-sector expectation.
- An institution-specific standard, if the school or ministry mandates one.

Note: some AA criteria are genuinely hard for this product — a drag-and-drop
schematic and a 3D orbit have no trivial equivalent. The keyboard paths below
are the honest engineering answer, and they should be designed regardless of the
level chosen.

Decision: Pending. Owner: project owner.
```

## Non-negotiable baseline (already fixed)

| # | Rule | Requirement |
| --- | --- | --- |
| A-1 | No information conveyed by colour alone. Every failure pairs a visual event, a text message and an audio cue | REQ-UX-007 |
| A-2 | Every pointer-only mechanic has a keyboard path | REQ-UX-004 |
| A-3 | A visible, persistent mute/volume control; the preference persists | REQ-UX-006 |
| A-4 | Text contrast ≥ 4.5:1 against its actual background — the neon-on-illustration treatment in Scene 01 needs a scrim to reach this | REQ-NF-013 |
| A-5 | Hit targets ≥ 44 × 44 CSS px at every viewport size | [[Responsive-Design]] |
| A-6 | Visible focus indicators everywhere, including on canvas-hosted controls | REQ-NF-013 |
| A-7 | Respect `prefers-reduced-motion`: auto-rotate, particle effects and screen flashes reduce to static or brief equivalents — without removing the failure *information* | REQ-NF-013 |

## Keyboard paths for the three hard mechanics

| Mechanic | Keyboard equivalent |
| --- | --- |
| Stage 1 drag & drop | `Tab` through the library, `Enter` to pick up, `Tab`/arrows to move between slots, `Enter` to drop, `Esc` to cancel |
| Stage 2 trace routing | Select a start pad, then arrow keys to extend the polyline in 45° increments, `Enter` to commit a segment, `Backspace` to remove the last one |
| Stage 2/3 sliders | Native `input[type=range]` semantics: arrows for fine steps, `PageUp/Down` for coarse, `Home/End` for extremes, with a numeric field alongside |
| Stage 3 orbit | Arrow keys rotate; orbit is a viewing convenience, so a fixed isometric view is an acceptable fallback |

## Screen-reader posture

Fully narrating a live 3D fit test is not realistic for this team, and pretending otherwise would be dishonest documentation. The committed subset:

- All text content, questions, options, feedback messages and score tables are readable and semantic.
- Every validation result is announced through a polite live region ("Lebar jalur 0,5 mm terlalu tipis untuk arus 5 A").
- Canvas-hosted controls carry accessible names and roles; the canvas itself carries a text description of its current state (which components are placed, which pads are connected, current dimensions).
- Decorative art and ambience are hidden from assistive technology.

## Cognitive and language load

- Content is Indonesian throughout, at the learners' level.
- Failure messages explain the rule, not just the violation ([[Feedback-Model]]).
- No time limits anywhere in the product. Nothing in the proposal imposes one, and adding one would be a fabricated requirement.

## Related

- [[UX-Principles]] · [[UI-States]] · [[Usability-Testing]] · [[Non-Functional-Requirements]]
