---
title: E-DrawLab — Documentation Home
status: Documentation baseline v1, no application code yet
---

# E-DrawLab — Documentation Home

**E-DrawLab: Desain CAD Elektronika** — *Laboratorium Maya Skema Rangkaian dan Desain CAD Elektronika*.

> Source: Approved Proposal — Section `IDENTITAS BAHAN AJAR`

An interactive virtual laboratory that simulates a technical-drawing studio and an electronics product-design workspace. A Fase E vocational student draws a standards-compliant schematic on a virtual A4 sheet, converts it into a PCB layout by calculating copper trace widths, then dimensions a 3D casing that must physically fit the board — with every mistake answered by an immediate visual consequence instead of a verdict. It ships as an offline-capable web application used in the school computer lab before any physical practicum.

## Project status

| Aspect | State |
| --- | --- |
| Approved proposals | 2, read and compared — [[Proposal-Comparison]] |
| Requirements baseline | 88 IDs — [[Requirements-Matrix]] |
| Application code | None in this repository yet |
| Architecture | Proposed, no ADR accepted except [[ADR-010-Trace-Width-Model]] |
| Content | Stage material specified by the revision; media assets not produced |

## Core objectives

Defined once in [[Goals]], measured through [[Learning-Objectives]] and [[Learning-Outcomes]].

## Target users

Defined once in [[Target-Users]] — SMK Kelas X (Fase E) Teknik Elektronika students, with the subject teacher as facilitator and second audience.

## Main features

Defined once in [[Requirements]] and detailed per feature in [[Features]]. Headline set: three-stage virtual lab, Immediate Dynamic Feedback, standardisation meter, per-competency scoring, stage-embedded quizzes, badge and certificate.

## Technology direction

Client-only static web application, local-first, installable as a PWA, distributed both as a hosted deployment and as a `file://` bundle for lab machines. Stack is **not yet chosen** — see [[ADR-002-Frontend-Stack]] and [[Open-Questions]].

> Source: Project Brief (local-first, PWA, responsive, landscape, one codebase); Approved Proposal — Section `RENCANA IMPLEMENTASI` (offline `index.html` in the school lab)

## Map of the vault

**Start here**
- [[Project-Overview]] — what the product is
- [[Problem-Statement]] — the educational problem it answers
- [[Scope]] — in / out / undecided
- [[Glossary]] — Indonesian ↔ English ↔ domain terms

**Proposal analysis (source of truth)**
- [[Proposal-Main]] · [[Proposal-Revision]] · [[Proposal-Comparison]] · [[Requirements-Matrix]]

**Learning design**
- [[Learning-Architecture]] · [[Curriculum]] · [[Learning-Objectives]] · [[Learning-Outcomes]] · [[Assessment-Strategy]] · [[Question-Bank]] · [[Feedback-Model]]
- Stage material: [[Stage-1-Schematic-Standards]] · [[Stage-2-PCB-Trace-Width]] · [[Stage-3-Casing-Dimensions]]

**Product**
- [[Requirements]] → [[Functional-Requirements]] · [[Non-Functional-Requirements]] · [[Features]] · [[Main-Learning-Flow]]

**UX / UI**
- [[UX-Principles]] · [[Navigation]] · [[Responsive-Design]] · [[Landscape-Design]] · [[Accessibility]] · [[UI-States]] · [[Screens]]

**Architecture**
- [[System-Architecture]] · [[Application-Architecture]] · [[Content-Architecture]] · [[Data-Architecture]]
- [[Local-First-Architecture]] · [[PWA-Architecture]] · [[Offline-Strategy]] · [[Deployment-Architecture]]

**Development**
- [[Roadmap]] · [[Milestones]] · [[Tasks]] · [[Technical-Debt]] · [[Changelog]]

**Decisions and research**
- [[Decisions-Index]] (summary table below) · [[Research]] index
- [[Open-Questions]] — everything a human still has to answer

**Testing**
- [[Functional-Testing]] · [[Educational-Testing]] · [[Usability-Testing]] · [[Offline-Testing]] · [[PWA-Testing]]

## Decision log

| ADR | Title | Status |
| --- | --- | --- |
| [[ADR-001-Single-Page-Application]] | SPA shell, no server runtime | Proposed |
| [[ADR-002-Frontend-Stack]] | Frontend stack | Proposed — undecided |
| [[ADR-003-Content-As-Data]] | Content as validated data, not code | Proposed |
| [[ADR-004-Local-Persistence]] | Local persistence mechanism | Proposed |
| [[ADR-005-Dual-Distribution]] | Hosted PWA + `file://` bundle | Proposed |
| [[ADR-006-3D-Rendering-Approach]] | Stage 3 3D rendering | Proposed — undecided |
| [[ADR-007-Asset-Budget]] | 25 MB media budget | Proposed |
| [[ADR-008-No-Accounts-Device-Local-Progress]] | No accounts, device-local progress | Proposed |
| [[ADR-009-Landscape-First-Layout]] | Landscape-first with portrait guard | Proposed |
| [[ADR-010-Trace-Width-Model]] | Adopt the revision's copper-weight model | Accepted |

**Templates and conventions**
- [[Templates]] — note templates and the writing rules below

## Rules for this vault

1. `docs/00_Raw/` is immutable. Never edit, move or rename the two `.docx` files.
2. Requirements live only in [[Requirements-Matrix]]. Everywhere else, cite the ID.
3. Every factual claim carries a source line: `Approved Proposal`, `Approved Revision`, `Project Brief`, or `Engineering Decision`.
4. Anything not decided is written as `Status: To Be Decided` and listed in [[Open-Questions]] — never guessed into a fact.
