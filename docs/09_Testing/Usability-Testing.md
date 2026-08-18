---
title: Usability Testing
---

# Usability Testing

Verifies `REQ-UX-*`, `REQ-NF-006`, `REQ-NF-008/009` and the time budget in [[Curriculum]].

## Test in the real configuration

Not one student on a developer laptop. The configuration that matters is **3–4 students around one lab computer, offline, with a 45-minute limit** (REQ-EDU-020, REQ-EDU-019). Most of the findings worth having only appear there.

## Sessions

| # | Session | Participants | Focus |
| --- | --- | --- | --- |
| U-1 | Home study, day −1 | Individual students on their own devices | Guide and case study standalone (REQ-EDU-022); portrait reading |
| U-2 | Core lesson | 2–3 groups of 3–4, lab PCs | Full run inside the time budget |
| U-3 | Teacher walkthrough | Subject teacher | Distribution, launch, facilitation, results interpretation |
| U-4 | Device sweep | Tablet, phone landscape, small laptop | Layout and touch parity |

## What to measure

| Metric | Target | Source |
| --- | --- | --- |
| Time to complete Stage 1 | ≈ 18 min | [[Curriculum]] §Time budget |
| Time to complete Stages 1–3 | ≤ 45 min including transitions | REQ-EDU-019 |
| Failures per stage before passing | Recorded, no fixed target | [[Data-Architecture]] |
| Groups stalled in a failure loop > 5 min | 0 | [[Technical-Debt]] D-8 |
| Guide re-opened during a stage | Recorded — high counts justify in-stage guide access ([[Navigation]]) |
| Instruction re-reads before first action | Recorded — high counts mean the instruction text failed |
| Students who never touch the input in a group | Recorded — a facilitation and design signal |

## Observation checklist

- Does the group understand *why* a failure happened, or only *that* it happened? Ask immediately after each failure.
- Do they read the educational text, or click straight past the animation?
- Is the feedback visible to the whole group, or only to the person at the mouse (P-3 in [[UX-Principles]])?
- Do they discover the copper-weight control without prompting?
- Do they brute-force the Stage 2 slider instead of computing ([[Immediate-Feedback-Research]] failure mode 3)?
- Does anyone rotate a device and meet the portrait guard mid-stage?
- Is the audio helpful, ignored, or muted immediately by the teacher?

## Accessibility pass

Run alongside U-4 against the baseline in [[Accessibility]]: keyboard-only completion, muted completion, contrast measured on the real Scene 01 art, `prefers-reduced-motion` honoured, hit targets at the smallest supported viewport.

## Output

Findings become content and configuration changes wherever possible — instruction text, tolerances, retry rules, scoring constants — because those change without a rebuild ([[ADR-003-Content-As-Data]]). Genuine interaction defects go to [[Tasks]].

## Related

- [[UX-Principles]] · [[Accessibility]] · [[Educational-Testing]] · [[Curriculum]]
