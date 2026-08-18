---
title: Non-Functional Requirements
---

# Non-Functional Requirements

Interpretation and measurement of `REQ-NF-*`, `REQ-UX-*` and the quality side of `REQ-PWA-*`. Requirement text: [[Requirements-Matrix]].

## Size budget — REQ-NF-001

< 25 MB total, stated by the proposal. This is the hardest constraint in the project because the same document specifies five scenes of illustrated 16×9 art, three music tracks, three ambience loops and roughly a dozen SFX.

Working allocation:

| Bucket | Budget | Notes |
| --- | --- | --- |
| App shell (HTML/CSS/JS) | 1.5 MB | Excludes a 3D library — see [[ADR-006-3D-Rendering-Approach]] |
| 3D runtime (if adopted) | 0.7 MB | three.js core, tree-shaken, gzipped |
| Backgrounds and UI art | 12 MB | 5 scenes; WebP/AVIF, 1920×1080 |
| Component/instrument icons | 1.5 MB | SVG preferred — near-free |
| Music (3 tracks) | 5 MB | ~96 kbps mono/joint-stereo loops |
| Ambience (3 loops) | 1.5 MB | short loops, low bitrate |
| SFX (~12) | 1 MB | short, mono |
| Content data + fonts | 1.5 MB | JSON + one subset font family |
| Headroom | ~0.3 MB | |

Enforcement: a build-time size gate that fails over budget. Details in [[ADR-007-Asset-Budget]] and [[Asset-Caching-Strategy]].

## Performance — REQ-NF-004, REQ-NF-005

| Target | Value | Rationale |
| --- | --- | --- |
| Time to interactive home | < 1.5 s on a mid-range lab PC, cold cache from local disk | "instant, no opening video" |
| Home fade-in | 0.5 s, all elements simultaneously | Stated verbatim, Scene 01 |
| Slider → value readout | Same frame | "berubah dinamis secara real-time" |
| Slider → 3D geometry update | ≤ 1 frame at 30 fps minimum, 60 fps target | Scene 04 live resize |
| Failure animation start | < 100 ms after validation | Feedback must read as *caused by* the action |

> Source: Approved Proposal — Scenes 01, 03, 04; numeric targets are an Engineering Decision

## Compatibility — REQ-NF-006

School lab desktops of unknown vintage plus student devices. Baseline: evergreen Chromium, Firefox and Safari from the last 3 years. WebGL support cannot be assumed on old lab hardware — this is the main risk to Stage 3 and the reason [[ADR-006-3D-Rendering-Approach]] must consider a non-WebGL fallback. Browser matrix and minimum hardware: **To Be Decided**, needs a real inventory of the target lab — [[Open-Questions]].

## Responsiveness and orientation — REQ-NF-008, REQ-NF-009, REQ-NF-002, REQ-UX-001

The 16×9 requirement from the proposal and the responsive requirement from the brief pull against each other. Resolution in [[Responsive-Design]] and [[Landscape-Design]]: a fixed-aspect stage that scales inside a responsive chrome, with a portrait guard. Decision: [[ADR-009-Landscape-First-Layout]].

## Privacy — REQ-NF-011

No accounts, no telemetry, no personal data leaving the device. Nothing in either document asks for learner identification. Consequence: progress is per-device and per-browser-profile, which is honest for a shared lab machine — and must be communicated in the UI, not assumed. See [[Local-First-Architecture]] and [[ADR-008-No-Accounts-Device-Local-Progress]].

Vault rule: no credentials, tokens or personal data of any kind are stored in this vault or in the content packs.

## Maintainability — REQ-NF-012

A teacher must be able to change a resistor value, a load current or a question without a developer. Enforced by [[ADR-003-Content-As-Data]] and the schema in [[Content-Architecture]].

## Accessibility — REQ-NF-013, REQ-UX-004, REQ-UX-006, REQ-UX-007

Baseline obligations are listed in [[Accessibility]]. The conformance target (WCAG 2.2 A vs AA) is undecided; the *non-negotiable* subset already fixed: no colour-only error signalling, visible mute control, keyboard alternative for every pointer mechanic, and text alongside every audio cue.

## Reliability — engineering interpretation

| Concern | Position |
| --- | --- |
| Progress loss on crash/refresh | Unacceptable. Persist after every scoring event, not at stage end — [[Data-Architecture]] |
| Corrupt local state | Detect on load; offer a clean reset rather than a white screen — [[UI-States]] |
| Storage quota exceeded | Degrade to session-only progress with a visible warning — [[Local-First-Architecture]] |
| Missing media asset | Stage still playable; audio and decorative art are enhancements, mechanics are not |

## Related

- [[Requirements-Matrix]] · [[Responsive-Design]] · [[Accessibility]] · [[Offline-Strategy]]
