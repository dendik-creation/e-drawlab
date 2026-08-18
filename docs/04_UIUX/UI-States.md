---
title: UI States
---

# UI States

Every non-happy-path state the interface must define (REQ-UX-005). Failure choreography inside stages is specified separately in [[Feedback-Model]] — this note covers system states.

## Loading

| State | Trigger | Design |
| --- | --- | --- |
| Cold start | App opened | No splash. Home fades in over 0.5 s (REQ-F-028). If content is not ready in 300 ms, show a minimal skeleton of the home layout — never a spinner-on-blank |
| Scene transition | Stage entry | Assets are already cached (REQ-PWA-004), so transitions should be instant. If a scene's media is genuinely not ready, hold the previous scene with an inline progress hint rather than a blank screen |
| 3D warm-up | Stage 3 entry | Show the box unrendered/wireframe rather than an empty panel |

## Connectivity

> Source: Engineering Decision — [[Offline-Strategy]], principle P-5 in [[UX-Principles]]

| State | Design |
| --- | --- |
| Offline (normal) | **No warning, no banner, no badge.** The app is designed to run offline; announcing it is noise in a lab where offline is the default |
| Offline + user attempts an online-only action | Only relevant if optional sync ever exists (REQ-PWA-008). Inline, dismissible, never blocking |
| Online, update available | Passive, non-blocking notice with a "reload to update" affordance — never auto-reload mid-stage ([[PWA-Architecture]]) |
| First install / caching in progress | Progress indicator on the install affordance only, while the app stays fully usable |

## Errors

| State | Trigger | Design |
| --- | --- | --- |
| Content pack missing or invalid | Schema validation fails at load | Full-screen honest error naming the file, with a "reset local data" action. Never a white screen |
| Corrupt saved progress | Progress fails to parse or its schema version is unsupported | Offer "continue with a fresh run" and preserve the corrupt record for diagnosis |
| Storage quota exceeded | Persist rejected | Warn once, continue with in-memory progress, and tell the learner explicitly that the run will not survive a refresh |
| Missing media asset | Asset 404 / not cached | Degrade silently: mechanics continue, decorative art and audio are optional |
| Unsupported browser (no WebGL, if that path is chosen) | Capability probe at Stage 3 | Explain plainly and offer the fallback renderer — [[ADR-006-3D-Rendering-Approach]] |

## Empty and initial states

| Surface | Initial |
| --- | --- |
| Stage 1 canvas | Framed empty A4, empty etiket, symbols resting in the library rack |
| Stage 2 board | Pads glowing dim yellow, no traces |
| Stage 3 model | Box at task default dimensions, auto-rotating |
| Results | Never reachable without a completed run |

## Progress and success

Green check on a valid quiz answer; permanent lock plus `pencil_draw.wav` on a valid placement; DRC "OK"; green check plus seated board on a fit pass; badge, applause and counting score on Scene 05.

## Rules

1. No state is signalled by colour alone (REQ-UX-007).
2. No blocking modal appears for anything the learner did not initiate, except an unrecoverable content error.
3. Every error offers an action, never just an apology.
4. Nothing in the offline path is presented as a fault.

## Related

- [[Feedback-Model]] · [[Offline-Strategy]] · [[Accessibility]] · [[Local-First-Architecture]]
