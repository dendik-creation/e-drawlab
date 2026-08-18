---
title: Goals
---

# Goals

Project-level goals. Learner-level statements live in [[Learning-Objectives]] and [[Learning-Outcomes]]; requirement text lives in [[Requirements-Matrix]].

## G-1 — Make drawing standards consequential

Let a student experience the manufacturing consequence of a non-standard drawing inside a simulation, rather than being marked wrong on paper.
Traces: REQ-EDU-015, REQ-F-015, REQ-F-016.
> Source: Approved Proposal — Sections `DESKRIPSI UMUM`, `RENCANA IMPLEMENTASI`

## G-2 — Take the learner across the full design chain in one artefact

Schematic → PCB layout → enclosure, where each stage consumes the previous stage's output.
Traces: REQ-EDU-008, REQ-F-029.
> Source: Approved Proposal — Sections `DESKRIPSI UMUM`, `ALUR INTERAKSI`

## G-3 — Turn conventions into computations

The student must derive trace width from load current and copper weight, and casing dimensions from board, standoff, component height, clearance and wall thickness.
Traces: REQ-EDU-010, REQ-EDU-011, REQ-EDU-012.
> Source: Approved Revision — Sections `STAGE 2`, `STAGE 3`

## G-4 — Certify readiness before the workshop

Produce a defensible per-competency score that gates access to physical assembly.
Traces: REQ-EDU-016, REQ-EDU-018, REQ-F-017, REQ-F-019.
> Source: Approved Proposal — Sections `RENCANA IMPLEMENTASI`, `STORYBOARD` Scene 05

## G-5 — Work where the school actually is

Full functionality on a lab computer with no internet, distributed through the LMS or a chat group, under 25 MB.
Traces: REQ-NF-001, REQ-NF-003, REQ-PWA-002, REQ-PWA-010.
> Source: Approved Proposal — Sections `DESKRIPSI UMUM`, `RENCANA IMPLEMENTASI`; Project Brief

## G-6 — One codebase, two distributions

The hosted, installable PWA and the offline lab bundle are the same build, not a fork.
Traces: REQ-NF-010, REQ-TECH-003, REQ-TECH-006.
> Source: Project Brief

## G-7 — Keep content editable by an educator

A teacher should be able to change circuits, values, questions and keys without touching application code.
Traces: REQ-NF-012, REQ-TECH-002.
> Source: Engineering Decision — [[ADR-003-Content-As-Data]]

## Non-goals

- Real EDA/CAD tooling. E-DrawLab simulates the *interface pattern* of PCB and CAD software; it is not a design tool and produces no manufacturable output.
- Multi-user classroom management, teacher dashboards, LMS grade sync. Nothing in either document asks for these. Distribution goes *through* the LMS; the app does not integrate with it.
- Accounts, cloud profiles or cross-device history — [[ADR-008-No-Accounts-Device-Local-Progress]].
- Content beyond the `TMR_TLEKTRO_4` element.

## Related

- [[Problem-Statement]] · [[Scope]] · [[Roadmap]]
