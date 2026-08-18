# ADR-010 — Adopt the revision's copper-weight trace-width model

## Status

**Accepted** — the decision is forced by the approved revision and the stated precedence rule, not chosen by the team.

## Context

The two approved documents specify Stage 2's core rule differently:

- **Main proposal**: a flat minimum — "lebar lintasan wajib ≥ 0.3 mm", with a slider spanning 0.2–1.5 mm, and a worked example at 0.40 mm.
- **Approved revision**: a calculation — `width = current × factor`, with factors 2 / 1 / 0.5 mm per A for 0.5 / 1 / 2 oz copper, plus an etch-safety floor of 0.8–1.0 mm for signal traces. Worked answers span 2.5–20 mm.

These cannot both govern: the main proposal's slider range cannot express a single one of the revision's answers, and its 0.3 mm floor is *looser* than the revision's etch floor.

## Decision

Stage 2 teaches and validates the **revision's copper-weight model** (REQ-EDU-010, REQ-EDU-011). The main proposal's 0.3 mm constant is superseded and does not ship as a rule.

The main proposal's *mechanics* — the width slider, 45°-corner routing, the `[PERIKSA JALUR]` DRC, and the burning-trace failure — are retained; the revision is silent on them and therefore does not override them ([[Proposal-Comparison]] CH-02).

Consequences that follow and are **not yet decided**: the slider range, the pass tolerance, and whether the learner chooses the copper weight or receives it. Those remain open in [[Stage-2-PCB-Trace-Width]] and [[Open-Questions]].

## Alternatives

1. **Keep the 0.3 mm rule.** Rejected: contradicts the later approved document and the precedence rule stated for this project.
2. **Teach both — a floor plus the calculation.** Partly retained, but not as the main proposal framed it. The revision's 0.8–1.0 mm etch floor already subsumes and tightens the 0.3 mm constant, so shipping both would present the looser number as a valid answer.
3. **Defer to the teacher at runtime via configuration.** Rejected as a *curriculum* decision — the model taught is not a deployment setting. Its parameters, however, do live in content ([[ADR-003-Content-As-Data]]).

## Consequences

### Positive

- Stage 2 assesses a derivation rather than a constant, matching LO-4 and the revision's six worked items.
- The scale of the change is documented rather than silently absorbed.

### Negative

- The approved Scene 03 storyboard is now partly inaccurate: its slider range is unusable and it lacks the copper-weight control the model requires. Screen notes carry the correction ([[Scene-03-Stage-2-PCB-Layout]]).
- Blocked downstream work: REQ-F-008 and REQ-F-009 cannot be implemented until the range and tolerance are settled.
- The exercise set uses `I = P / V` without teaching it — a content gap this decision surfaces.

## Related

- [[Stage-2-PCB-Trace-Width]] · [[Proposal-Comparison]] · [[Feature-PCB-Router]] · [[Requirements-Matrix]]
