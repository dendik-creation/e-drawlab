---
title: Feature — Results Dashboard
requirements: [REQ-F-019, REQ-F-021, REQ-F-022, REQ-F-026, REQ-F-027, REQ-EDU-016, REQ-EDU-017]
status: Planned
---

# Feature — Results Dashboard

Scene 05. Reads progress state; owns no scoring logic of its own.

## Content

| Block | Requirement | Detail |
| --- | --- | --- |
| Total score | REQ-F-019 | Counts up from 0 to the final value; example in the storyboard: 92/100 |
| Star rating | REQ-F-019 | Five gold stars in the example; thresholds undefined |
| Badge | REQ-EDU-017 | "EXPERT CAD DESIGNER" medal, `applause.wav`, gold particle effect |
| Competency table | REQ-EDU-016 | Standardisasi Skema / PCB Layout / 3D Casing / Evaluasi Kuis |
| Reflective quiz | REQ-F-020 | 3 items — [[Feature-Quiz-Engine]] |
| Trace-temperature curve | REQ-F-027 | Comparison chart; underlying data not supplied by either document |
| Certificate | REQ-F-021 | Downloadable "Expert CAD Designer" certificate |
| `[DESAIN ULANG]` / `[SELESAI]` | REQ-F-022 | Reset, or finish |
| Attribution | REQ-F-026 | CC-BY-NC-SA line on the bottom row |

## Certificate — offline constraint

`Status: To Be Decided`

```text
Question:
What is a "downloadable certificate" in a fully offline, client-side app?

Context:
- No server, so no signed PDF, no verification endpoint, no registry.
- The proposal says students "mengunduh sertifikat" after the session.

Candidates:
A. Canvas-rendered PNG generated client-side, downloaded via a blob URL.
B. Print-to-PDF view (CSS @media print) — zero dependencies, works everywhere.
C. Bundled PDF library rendering a filled template — costs bundle budget.

Note: option A's blob download is blocked in some embedded/webview contexts, and
learner-entered names cannot be verified in any option.

Recommendation: B, with A as an enhancement where supported.
Decision: Pending.
```

Related: whether the certificate carries a learner-entered name at all touches REQ-NF-011 (no personal data) — a name typed into a local canvas never leaves the device, which is compliant, but it must not be persisted beyond the session on a shared lab machine.

## Trace-temperature chart — REQ-F-027

The flowchart asks for a "grafik kurva ilmiah komparasi dampak temperatur lintasan" — a curve comparing the thermal effect of trace width. Neither document supplies the data, the axes or the model. Priority is `Could`. Options: derive an illustrative curve from the learner's own chosen width vs. the required width (honest, self-referential, no external data needed), or omit until a teacher supplies real reference data. Recommendation: the former, clearly labelled as illustrative.

## Acceptance

1. Every value shown reconciles with the stored progress record.
2. `[DESAIN ULANG]` returns to Scene 01 with cleared state and no reload.
3. The attribution line and licence icon are present.

## Related

- [[Scene-05-Evaluation-and-Results]] · [[Feature-Scoring-and-Progress]] · [[Assessment-Strategy]]
