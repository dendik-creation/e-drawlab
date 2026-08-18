---
title: Milestones
---

# Milestones

Demonstrable checkpoints. Each one is a state someone outside the build can *see*, not a phase completion. Phase detail: [[Roadmap]].

No dates: neither approved document states a schedule.

| # | Milestone | Definition of done | Phase |
| --- | --- | --- | --- |
| M0 | **Decisions closed** | Stack and rendering ADRs decided; the four blocking product questions answered in [[Open-Questions]] | 0 |
| M1 | **It builds twice** | Empty shell ships as both artefacts, passes the size gate, opens by double-clicking `index.html` | 0 |
| M2 | **Content is authorable** | A teacher edits a value in the content pack, CI validates it, the app reflects it | 1 |
| M3 | **Walkable skeleton** | All five scenes reachable with placeholders, progress survives a reload, portrait guard works | 2 |
| M4 | **Curriculum is code** | Every worked example in [[Question-Bank]] reproduced by unit tests | 3 |
| M5 | **Playable end to end** | All three stages completable with placeholder art, mouse + touch + keyboard | 4 |
| M6 | **Feedback complete** | Every failure mode shows its consequence, text and audio; product fully usable muted | 5 |
| M7 | **Feature complete** | Results, badge, certificate, reset, attribution; final media inside budget | 6 |
| M8 | **Offline proven** | Full run on a machine that has never been online, in both distributions | 7 |
| M9 | **Classroom validated** | A real class completes the core phase inside 45 minutes | 8 |
| M10 | **Released** | Hosted deployment plus distribution archive, teacher handover done | 9 |

## Gates worth defending

- **M0 before M2.** Authoring content against an undecided score model wastes the teacher's time.
- **M4 before M5.** Building stage UI over untested rules means debugging pedagogy through a canvas.
- **M7 before M8.** Precaching cannot be finalised while the asset list still moves.
- **M8 before M9.** Testing with a class on a build that fails offline burns the one classroom slot you get.

## Related

- [[Roadmap]] · [[Tasks]] · [[Open-Questions]]
