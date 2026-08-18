---
title: "Research — Immediate Consequence Feedback"
---

# Research — Immediate Consequence Feedback

## Question

The proposal mandates Immediate Dynamic Feedback — a *visual consequence* instead of a verdict (REQ-EDU-015). What must the implementation get right for that to teach rather than merely entertain, and where does it fail?

Note: this note reasons from the proposal's own design and from the constraints of the lesson, not from cited literature. Neither approved document cites any, and none is invented here.

## What the proposal specifies

| Failure | Consequence |
| --- | --- |
| Reversed symbol / invalid scale | Red flash, buzz, meter −20%, **educational warning text** |
| Under-width trace / 90° corner | Flames, burnt and broken copper, forced re-route |
| Undersized casing | PCB strikes the wall, shell cracks, error status |

The third column of the first row is the one that carries the learning: the proposal itself pairs the spectacle with an explanation. Everything below follows that lead.

## Failure modes to design against

**1. Spectacle without attribution.** A dramatic fire tells the learner *that* something failed, not *which* decision caused it or *why*. Mitigation: violations are located and reason-coded ([[Application-Architecture]]), so the effect plays at the offending segment and the message names the rule.

**2. Repetition fatigue.** The same 3-second animation on the fourth retry stops being feedback and becomes a tax on iteration — which is exactly the behaviour the stage wants to encourage. Mitigation: full playback once per failure mode per session, abbreviated afterwards ([[Feedback-Model]]).

**3. Guess-and-check displacing reasoning.** Instant validation plus a continuous slider invites brute-forcing the target width by dragging. Mitigations: a defined tolerance band rather than a single pixel-perfect value ([[Stage-2-PCB-Trace-Width]]), retry cost in the score model ([[Assessment-Strategy]]), and the assessment items that ask *why* rather than *what*.

**4. Punishment without a route back.** The meter drops 20% per error, with no stated recovery and no stated behaviour at 0%. In a 45-minute group session, a dead end is a lost lesson. Mitigation: [[Feedback-Model]] §Anti-frustration; the decision is still owed ([[Open-Questions]]).

**5. Single-channel delivery.** In a shared lab, machines are frequently muted; a buzz-only signal is lost. Mitigation: three-channel rule (REQ-UX-007, [[Accessibility]]).

**6. Group dynamics.** Three to four students share one screen; whoever holds the mouse gets the feedback loop. This is a facilitation matter more than a software one, but it argues for feedback that is legible from a metre away (P-3 in [[UX-Principles]]) so the whole group experiences the consequence together.

## Recommendation

Implement consequence feedback as a **three-part unit**, never as an animation alone:

```text
1. Located effect     — plays where the mistake is
2. Educational text   — names the rule and the correct reasoning
3. Accessible signal  — live-region announcement, independent of colour and sound
```

All three are driven by the same reason code, so they cannot drift apart.

## Impact

- The reason-code vocabulary becomes a shared contract between domain models, content and the view layer ([[Content-Architecture]]).
- One educational message per reason code is a content deliverable, currently unwritten ([[Content-Inventory]]).
- Retry counts and failure codes are recorded in progress ([[Data-Architecture]]) and become the raw material for item analysis in [[Educational-Testing]].

## Related

- [[Feedback-Model]] · [[Learning-Architecture]] · [[Educational-Testing]] · [[UX-Principles]]
