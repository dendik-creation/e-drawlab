---
title: Target Users
---

# Target Users

## Primary — the learner

> Source: Approved Proposal — Section `IDENTITAS BAHAN AJAR`

"Murid SMK Kelas X rumpun program keahlian Teknik Elektronika (Fase E)" — first-year vocational secondary students in the electronics engineering cluster, typically 15–16 years old.

What the documents establish about them, and only that:

| Established | Evidence |
| --- | --- |
| Studying element `TMR_TLEKTRO_4`, first exposure to technical drawing standards and CAD | Main §Identitas |
| Work in groups of 3–4 on a shared school lab computer during the core phase | Main §Rencana |
| Also access the material alone at home the day before, from a file shared via LMS or chat group | Main §Rencana |
| Use both lab desktops and personal devices ("gawai") — the storyboard specifies swipe as well as mouse-wheel scrolling | Main §Storyboard Scenes 01, 05 |
| Have not yet done physical circuit assembly; this is the gate before it | Main §Rencana |
| Addressed informally in second person in the material ("teman-teman", "kamu") | Main §Deskripsi |

Design consequences: REQ-UX-003 (touch and mouse parity), REQ-NF-006 (lab hardware and student devices), REQ-EDU-022 (guide must stand alone without a teacher present), REQ-EDU-020 (one screen, several students — see [[UX-Principles]]).

## Secondary — the teacher

> Source: Approved Proposal — Section `RENCANA IMPLEMENTASI`; Approved Revision — `KUNCI JAWABAN & PEMBAHASAN UNTUK GURU`

The subject teacher distributes the offline file, frames the session, forms groups, hands out the digital worksheet (LKPD-D), facilitates the 45-minute experiment and runs the closing presentations. The revision adds a genuine teacher-facing artefact: answer keys with worked solutions and distractor rationales.

Design consequences: REQ-EDU-021, plus the unresolved question of whether keys ship in-product at all ([[Proposal-Comparison]] CH-05). Note that in a fully client-side offline bundle, any shipped key is readable by a determined student — a teacher "mode" is a convenience, never a security boundary.

## Not users

School administrators, curriculum authorities, parents and external assessors are mentioned nowhere in either document and have no interface here.

## Accessibility posture

Neither document states an accessibility requirement. The vault treats a baseline as an engineering obligation, not an invention of proposal content — see [[Accessibility]], REQ-NF-013, REQ-UX-004, REQ-UX-007. Conformance target: **To Be Decided** ([[Open-Questions]]).

## Related

- [[Problem-Statement]] · [[UX-Principles]] · [[Curriculum]]
