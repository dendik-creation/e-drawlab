---
title: Feature — Audio System
requirements: [REQ-F-023, REQ-F-024, REQ-UX-006, REQ-UX-007, REQ-NF-001]
status: Planned
---

# Feature — Audio System

Audio is specified in unusual detail by the proposal — three simultaneous layers with named files and explicit volumes. Asset list: [[Media-Asset-Register]].

## Layers

| Layer | Behaviour | Volumes stated |
| --- | --- | --- |
| SFX | One-shot, triggered by interaction and validation | full |
| Music | Looping, one track per context, ducked during work | menu 15%, ducked to 10% in Stage 1, 12% in Stages 2–3 |
| Ambience | Looping room tone | 5–6% |

Ducking is explicit in the source: `drawing_theme.mp3` drops from 15% to 10% "untuk menyokong konsentrasi penuh murid".

## Engineering constraints

> Source: Engineering Decision

1. **Autoplay policy.** Browsers block audio before a user gesture. The home screen's first click (`click.mp3` / `sfx_hover.mp3`) is the natural unlock point; ambience and music start there, never on load.
2. **Mute control is mandatory** (REQ-UX-006). Three students share one machine in a room full of other groups; a lab full of unmutable ambience loops is a classroom-management failure. Persist the mute preference locally.
3. **Audio never carries information alone** (REQ-UX-007). Every `buzz.wav` / `short.mp3` / `crash.mp3` has a paired visual and text signal — [[Feedback-Model]].
4. **Budget.** Music and ambience are the second-largest bucket after art in [[Non-Functional-Requirements]] §Size budget. Loops must be short and seamlessly loopable rather than long tracks; mono where the content allows.
5. **Preloading.** SFX preload with the shell; music and ambience load per scene but must be fully cached offline (REQ-PWA-004).

## Hover feedback — REQ-F-024

Grouped here because the proposal specifies it as an audio-visual pair: button scale +5%, neon-blue brightening, `sfx_hover.mp3`. On touch devices there is no hover — the equivalent is a press state. Do not gate any information on hover alone.

## Acceptance

1. No audio plays before a user gesture; nothing is broken by the delayed start.
2. Mute persists across scenes, reloads and sessions.
3. Every failure remains fully comprehensible with audio off.
4. Total audio payload stays inside its bucket.

## Related

- [[Media-Asset-Register]] · [[Feedback-Model]] · [[Accessibility]] · [[ADR-007-Asset-Budget]]
