---
title: Feature — PCB Router
requirements: [REQ-F-008, REQ-F-009, REQ-F-010, REQ-F-011, REQ-F-029, REQ-EDU-010, REQ-EDU-011]
status: Planned
---

# Feature — PCB Router

Stage 2 mechanics. Content and the trace-width model: [[Stage-2-PCB-Trace-Width]]. Screen: [[Scene-03-Stage-2-PCB-Layout]].

## Surfaces

| Surface | Behaviour |
| --- | --- |
| Green board | Pads laid out per task content; pads glow dim yellow when idle |
| Trace-width slider | Live millimetre readout; range unresolved — [[Stage-2-PCB-Trace-Width]] |
| Copper-weight control | 0.5 / 1 / 2 oz — **new**, required by the revision, absent from the storyboard |
| DRC rules box | Summary of the active rules for the task |
| `[PERIKSA JALUR]` | Runs the check |

## Routing model

> Source: Engineering Decision, derived from Main §Scene 03

Routing is drag-from-pad-to-pad along a **45°/90° constrained polyline** — the learner drags, the router snaps each segment to the nearest 45° multiple, and a corner is legal only if it turns 45°. This makes the "45°, bukan 90°" rule a property of the tool rather than a trap: the learner can still create an illegal 90° corner by chaining two 45° turns at a point, which is exactly the mistake the DRC should catch.

## Design Rule Check

| Rule | Source | Failure |
| --- | --- | --- |
| Width ≥ `current × factor(copper weight)` | Revision §Stage 2 | Trace burns — `short.mp3` + flame animation |
| Signal traces ≥ 0.8 mm drawn width | Revision teacher key | Trace breaks during simulated etching |
| No 90° corner | Main §Scene 03 | Trace burns at the corner |
| All required pads connected | Main §Scene 03 | Incomplete — no burn, just a fail report |

The DRC returns a list of violations with pad/segment references, so the failure animation can play *at the offending location* rather than screen-wide.

## Handoff — REQ-F-029

On pass, the router emits the finished board (dimensions, pad map, tallest component height) into progress state for Stage 3. Whether board dimensions come from Stage 2 or a fixed constant is open — [[Stage-3-Casing-Dimensions]].

## Open

- Slider range and pass tolerance (blocks implementation).
- Whether the learner selects the copper weight or the task fixes it. Recommended: the task fixes it, the learner reads it — the assessment items already cover choosing between weights.
- Whether `I = P / V` is taught in-stage or the current is given.

## Acceptance

1. A computed-correct width plus legal 45° routing passes the DRC first time.
2. Each violation type produces its own located consequence animation.
3. The board handed to Stage 3 matches what was routed.

## Related

- [[Stage-2-PCB-Trace-Width]] · [[ADR-010-Trace-Width-Model]] · [[Feature-Casing-Modeller]]
