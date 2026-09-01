---
title: Changelog
---

# Changelog

Changes to the **project and its documentation**. Application releases will be added here once code exists.

Format: reverse chronological, newest first.

## 2026-09-01 — Rendering migrated off the canvas

**Changed — every scene now renders as React DOM/SVG; Phaser removed.**

- Root cause and measurements: [[ADR-011-DOM-First-Rendering]], plan and harness
  in [[Render-Migration-Plan]].
- Frame rate on a phone-sized viewport went from 4-7 fps across every scene
  (idle Home included) to a steady ~60, with long tasks during interaction
  falling from 463 to 0.
- JS bundle 1 718,87 kB → 308,08 kB (463,71 → 93,58 kB gzip).
- Layout, palette, typography, step flow and BGM behaviour are unchanged;
  every screen was checked against captures of the canvas build.
- `AudioDirector` keeps its API on a Web Audio backend: loops stream instead of
  decoding (`work_theme` alone was 100 MB+ of PCM), and fades run on the audio
  thread.
- Content and rules — `circuits.ts`, `traceModel.ts`, `casingModel.ts`, the
  evaluation configs and question banks — were not touched (ADR-003).
- New reusable UI kit under `src/ui/` (design-space primitives, `Pressable`,
  `ActionButton`, `JourneyHeader`, `SimSlider`, bubble motion), replacing four
  near-identical header classes and two per-journey slider implementations.
- `scripts/perf/` adds a Playwright screenshot + FPS harness, run per phase.

## 2026-08-16 — Documentation baseline v1

**Added — Obsidian vault populated at `docs/`.**

- Proposal analysis: both approved `.docx` files read and structured — [[Proposal-Main]], [[Proposal-Revision]].
- Comparison of the two documents with five recorded change records — [[Proposal-Comparison]].
- Requirements baseline: 88 IDs across EDU / F / NF / PWA / UX / TECH, each with a source — [[Requirements-Matrix]].
- Learning design: architecture, curriculum, objectives, outcomes, assessment strategy, full 21-item question bank, feedback model, and the three stage-content notes.
- Product: requirements views, ten feature notes, main learning flow.
- UX/UI: principles, navigation, responsive and landscape design, UI states, accessibility, five screen notes transcribing the storyboard.
- Architecture: system, application, content, data, local-first, PWA, offline strategy, deployment.
- Ten ADRs — nine `Proposed`, one `Accepted` ([[ADR-010-Trace-Width-Model]]).
- Research notes, five test plans, templates, and [[Open-Questions]].

**Established**

- `docs/00_Raw/` is immutable; the vault is an interpretation layer.
- Precedence: the approved revision wins over the main proposal on conflict.
- Every factual claim carries a source label.

**Key findings**

- The revision is a **content-only revision** of Stages 1–3; it does not touch identity, scope, storyboard or delivery.
- Stage 2's trace-width rule changed from a constant to a calculation, which invalidates the approved slider range — the highest-impact change found.
- Stage 3's fit rule changed from "casing ≥ PCB" to explicit dimensional formulas.
- Assessment grew from 3 items to 21 (18 fully specified).
- Eight inherited inconsistencies recorded in [[Technical-Debt]]; sixteen questions require human decisions in [[Open-Questions]].

**Not done**

- No application code, no content pack, no media assets.
- Stack and 3D rendering undecided.
- Several content items still unwritten — [[Content-Inventory]].

## Related

- [[Roadmap]] · [[Technical-Debt]] · [[Open-Questions]]
