---
title: Feature — Quiz Engine
requirements: [REQ-F-020, REQ-EDU-013, REQ-EDU-014, REQ-EDU-021, REQ-F-025]
status: Planned
---

# Feature — Quiz Engine

Renders and scores the multiple-choice items in [[Question-Bank]].

## Item contract

```json
{
  "id": "Q-S2-01",
  "stage": 2,
  "prompt": "…",
  "options": [{ "id": "A", "text": "…" }, { "id": "B", "text": "…" }, { "id": "C", "text": "…" }],
  "key": "B",
  "explanation": "teacher-facing worked solution",
  "audience": "learner",
  "source": "Approved Revision — STAGE 2"
}
```

All 21 items share this shape; the only variance is stage placement (in-stage vs closing).

## Behaviour

- Three options, single choice, answer locks on selection with `bell.wav` and a green check for a correct answer (Main §Scene 05).
- Options highlight on hover: bold text, light grey background.
- Long stems scroll/swipe vertically inside the panel (REQ-F-025).
- Answers are recorded to progress state immediately ([[Feature-Scoring-and-Progress]]).

## Undecided behaviour

| Question | Status |
| --- | --- |
| Does a wrong answer show the correct one? | To Be Decided |
| Does a wrong answer cost meter percentage? | To Be Decided |
| Can an item be retried? | To Be Decided — "mengunci jawaban" suggests no |
| Points per item | To Be Decided — [[Assessment-Strategy]] |

The proposal describes only the correct-answer path ("bell.wav dan mengunci jawaban", green check). The wrong-answer path is unwritten. Given the product's whole thesis is consequence-based feedback, the recommendation is: lock, show the correct option, and reveal the worked explanation — but that decision belongs to the teacher, and it collides with the key-shipping question below.

## Teacher material — REQ-EDU-021

`explanation` and `key` are teacher-facing (`audience` field). In a client-side offline bundle they are readable by anyone who opens the data files; a "teacher mode" is convenience, not security. Options: ship them (accepting exposure), split them into a separate teacher content pack that only the teacher's copy contains, or keep them out of the app entirely and in the printed LKPD-D. Undecided — [[Proposal-Comparison]] CH-05, [[Open-Questions]].

## Missing content

The three closing reflective items (`Q-R-01…03`) have answers but no stems. The engine must tolerate an incomplete closing set until they are authored.

## Acceptance

1. All 18 fully-specified items render and score correctly from content data.
2. Answers persist across a reload mid-quiz.
3. No teacher-only field renders in a learner view.

## Related

- [[Question-Bank]] · [[Assessment-Strategy]] · [[Content-Architecture]]
