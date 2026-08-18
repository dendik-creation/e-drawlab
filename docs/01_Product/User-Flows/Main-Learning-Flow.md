---
title: Main Learning Flow
---

# Main Learning Flow

The complete learner path including failure branches. Screen detail: [[Screens]]. Stage gating rules: [[Learning-Architecture]].

> Source: Approved Proposal — Sections `ALUR INTERAKSI`, `STORYBOARD` Scenes 01–05

## Happy path

```mermaid
flowchart LR
    OPEN[Open application]
    HOME[Scene 01 Home]
    GUIDE[Panduan Aturan overlay]
    CASE[Studi Kasus]
    S1[Stage 1 Schematic]
    S2[Stage 2 PCB layout]
    S3[Stage 3 3D casing]
    EVAL[Scene 05 Results + quiz]
    DONE[SELESAI]

    OPEN --> HOME
    HOME --> GUIDE --> HOME
    HOME --> CASE --> HOME
    HOME --> S1 --> S2 --> S3 --> EVAL --> DONE
    EVAL -- DESAIN ULANG --> HOME
```

## With failure branches

```mermaid
flowchart TD
    S1["Stage 1: place symbols + etiket"]
    V1{"Placement / etiket valid?"}
    F1["Red flash + buzz.wav\nmeter -20% + warning text"]
    S2["Stage 2: set width, route traces"]
    V2{"PERIKSA JALUR - DRC pass?"}
    F2["short.mp3 + flames\ntrace burns, re-route"]
    S3["Stage 3: set L/W/H"]
    V3{"UJI KECOCOKAN - fit?"}
    F3["crash.mp3\nPCB hits wall, casing cracks"]
    EVAL["Scene 05: score, badge, quiz, certificate"]

    S1 --> V1
    V1 -- no --> F1 --> S1
    V1 -- all valid --> S2
    S2 --> V2
    V2 -- fail --> F2 --> S2
    V2 -- pass --> S3
    S3 --> V3
    V3 -- undersize --> F3 --> S3
    V3 -- fit --> EVAL
```

Note what the source does *not* define: any exit from a failure loop. There is no skip, no hint escalation, and no stated behaviour when the Standardisasi Meter hits 0%. A group can, as specified, loop indefinitely inside Stage 2 — which is a real risk inside a 45-minute lesson. See [[Feedback-Model]] §Anti-frustration and [[Open-Questions]].

## Session context flow

How the app is used across the lesson (REQ-EDU-019):

```mermaid
sequenceDiagram
    participant T as Teacher
    participant LMS as LMS / chat group
    participant H as Student at home
    participant LAB as Lab computer (offline)
    T->>LMS: share offline application file (day -1)
    LMS->>H: link
    H->>H: open Panduan Aturan + Studi Kasus alone
    T->>T: 15 min framing, brainstorming
    T->>LAB: groups of 3-4 open index.html offline
    LAB->>LAB: Stages 1-3, 45 min, with LKPD-D
    LAB->>T: score dashboard, certificate, group presentation (30 min)
    T->>T: unlock physical practicum
```

This flow drives REQ-NF-003, REQ-PWA-010 and REQ-EDU-022: the home run and the lab run are different environments — likely a student phone or home PC with internet, and an offline lab desktop — and both must work from the same build ([[Deployment-Architecture]]).

## Related

- [[Navigation]] · [[Curriculum]] · [[Screens]] · [[Offline-Strategy]]
