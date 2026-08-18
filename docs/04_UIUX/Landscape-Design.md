---
title: Landscape Design
---

# Landscape Design

Landscape-first is a Project Brief requirement (REQ-NF-009, REQ-UX-001) and is independently implied by the proposal's 16×9 specification and by every stage layout in the storyboard.

## Why landscape is structural here, not stylistic

| Stage | Layout stated in the storyboard | Why it needs width |
| --- | --- | --- |
| 1 | A4 sheet centre, component library right, HUD top | The learner drags *from* the library *to* the sheet — both must be visible at once |
| 2 | PCB centre, width slider + DRC rules right, step overlay top | Adjusting the width while watching the trace is the entire mechanic |
| 3 | 3D casing left, PCB right, three sliders lower-right | Comparing two objects side by side is the spatial lesson |
| 5 | Score panel left, competency table right, quiz below | Comparison reading |

Stack any of these vertically and the cause-effect pairing the product teaches stops being visible in one glance.

## Portrait behaviour

> Source: Engineering Decision — [[ADR-009-Landscape-First-Layout]]

Portrait is **guarded, not supported**, for the stage scenes:

- A full-screen rotate prompt with an illustration and text ("Putar perangkat ke mode landscape").
- The guard appears only when `orientation: portrait` **and** the viewport is too small to host the stage — a portrait desktop window that is still wide enough runs normally.
- The guard blocks stages only. Home, the guide, the case study, the quiz and the results table are readable in portrait, because the lesson plan has students reading the guide at home on a phone (REQ-EDU-022).
- No progress is lost by rotating; the guard is a view, not a state change.

## Landscape ergonomics

- On phone landscape, the browser chrome eats vertical space — the HUD must compress to a single row of icons plus the step counter.
- Thumbs occupy the lower-left and lower-right corners on a held device. Keep primary actions (`[PERIKSA JALUR]`, `[UJI KECOCOKAN]`) out of the extreme corners, per the storyboard, which already places them in the right panel.
- The 3D orbit gesture must claim its touch area so it does not compete with page scroll.

## Related

- [[Responsive-Design]] · [[UX-Principles]] · [[Screens]] · [[Usability-Testing]]
