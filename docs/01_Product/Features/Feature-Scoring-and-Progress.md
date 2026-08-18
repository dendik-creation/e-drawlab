---
title: Feature — Scoring and Progress
requirements: [REQ-F-016, REQ-F-017, REQ-F-018, REQ-PWA-007, REQ-EDU-016]
status: Planned
---

# Feature — Scoring and Progress

The single state authority. Every stage writes here; the results dashboard only reads.

## State shape

> Source: Engineering Decision, derived from Main §Scenes 02, 05

```json
{
  "schemaVersion": 1,
  "contentVersion": "1.0.0",
  "startedAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "meter": 100,
  "score": { "skema": 0, "pcb": 0, "casing": 0, "kuis": 0 },
  "stages": {
    "stage1": { "status": "in_progress", "tasks": {}, "attempts": 0, "failures": [] },
    "stage2": { "status": "locked", "attempts": 0, "failures": [] },
    "stage3": { "status": "locked", "attempts": 0, "failures": [] }
  },
  "answers": { "Q-S1-01": { "chosen": "B", "correct": true, "at": "ISO-8601" } },
  "completed": false
}
```

Persistence rules, storage medium and versioning: [[Data-Architecture]] and [[ADR-004-Local-Persistence]].

## Rules

| Rule | Source | Status |
| --- | --- | --- |
| Meter starts at 100%, −20% per invalid action | Main §Scene 01, 02 | Stated |
| +20 per valid Stage-1 placement | Main §Scene 02 | Stated, conflicts with the 25-point band — [[Assessment-Strategy]] |
| Four competency bands totalling 100 | Main §Scene 05 | Stated |
| Point value per MCQ item | — | **Undefined** |
| Retry penalty | — | **Undefined** |
| Meter reaching 0% | — | **Undefined** |
| Star thresholds, badge threshold | — | **Undefined** |

Everything marked undefined is listed in [[Assessment-Strategy]] with a candidate model. Implementation must read these numbers from a **scoring configuration in content**, not hard-code them — so the teacher can settle them later without a rebuild (REQ-NF-012).

## Persistence timing — REQ-PWA-007

Write after every scoring event (placement, DRC result, fit test, answer), not at stage boundaries. A 45-minute group session that loses 20 minutes to a refresh is a failed lesson, not a bug report.

## Progress indicator — REQ-F-018

Displays "Langkah N dari M". `M` is contested between the storyboard scenes ("dari 4" vs "dari 5") and complicated by Stage 1 holding three circuit tasks. Until resolved, the indicator reads its total from content — [[Open-Questions]].

## Reset — REQ-F-022

`[DESAIN ULANG]` clears the record entirely (meter, score, stage state, answers) and returns to Scene 01 without a page reload. Cleared means removed from local storage too, otherwise the next group inherits the previous group's run on a shared lab machine.

## Acceptance

1. Killing and reopening the browser mid-Stage-2 restores the exact prior state.
2. `[DESAIN ULANG]` leaves no residue in storage.
3. Scoring constants come from content; changing them requires no code change.

## Related

- [[Assessment-Strategy]] · [[Data-Architecture]] · [[Local-First-Architecture]]
