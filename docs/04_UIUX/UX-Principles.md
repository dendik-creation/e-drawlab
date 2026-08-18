---
title: UX Principles
---

# UX Principles

Design constraints derived from the proposal and the brief. Each principle names what it forbids — a principle that forbids nothing is decoration.

## P-1 — Show the consequence, don't announce the verdict

The product's identity is Immediate Dynamic Feedback (REQ-EDU-015). Forbidden: a modal saying "Salah!" with an OK button as the primary failure response. The failure animation *is* the message; text supports it.
See [[Feedback-Model]].

## P-2 — Landscape is the design, not a breakpoint

16×9 is a stated product property (REQ-NF-002), and all three stages are two-column workspaces: canvas plus tool panel. Forbidden: a stacked portrait layout that pushes the tool panel below the fold.
See [[Landscape-Design]], [[ADR-009-Landscape-First-Layout]].

## P-3 — Built for a shared screen

Three to four students around one lab monitor (REQ-EDU-020). Hit targets, text sizes and feedback must read from a metre away and off-axis. Forbidden: 12 px labels, hover-only affordances, feedback confined to a screen corner.

## P-4 — Nothing depends on a single sensory channel

Errors are visual **and** textual **and** audible (REQ-UX-007). Forbidden: a red flash as the only signal; a buzz as the only signal; colour as the only distinction between a valid and invalid trace.
See [[Accessibility]].

## P-5 — The lab has no internet, and that is normal

Offline is the primary case, not a degraded one (REQ-NF-003, REQ-PWA-002). Forbidden: a spinner or an error state that appears merely because the network is unreachable; any "reconnecting…" blocking overlay.
See [[UI-States]], [[Offline-Strategy]].

## P-6 — Never lose learner work

45-minute lesson, shared machine, curious teenagers. Progress persists after every scoring event (REQ-PWA-007). Forbidden: state held only in memory; a refresh that costs a stage.

## P-7 — Failure must be escapable

Every failure branch loops back to the same input (see [[Main-Learning-Flow]]). Forbidden: a dead end, an unskippable repeated animation, or an unrecoverable meter. The lesson has 45 minutes and cannot afford a stuck group.

## P-8 — Standards are taught by the tool, not policed by it

The 45° routing constraint and slot snapping make the correct action the natural one, while still allowing the specific mistakes the DRC teaches. Forbidden: pixel-precision demands, undo-less destructive actions, or "gotcha" validation of things never taught in the guide.

## P-9 — Content is Indonesian and stays Indonesian

UI copy, feedback text and items are Indonesian, matching the source and the learners. Forbidden: mixed-language UI, or English strings hard-coded into components.

## P-10 — The screen belongs to the work

No opening video, instant home (REQ-F-028), decoration never occludes the canvas. Forbidden: splash screens, animated transitions that delay input, or ambient motion inside a workspace during an active task.

## Related

- [[Navigation]] · [[Responsive-Design]] · [[Landscape-Design]] · [[UI-States]] · [[Accessibility]]
