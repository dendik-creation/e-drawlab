---
title: System Architecture
status: Proposed
---

# System Architecture

`Status: Proposed` — no application code exists yet. Everything here is an engineering proposal constrained by the approved requirements.

> Source: Project Brief (web, local-first, PWA, offline, one codebase); Approved Proposal — Section `RENCANA IMPLEMENTASI` (offline `index.html`, no server)

## Layers

```mermaid
flowchart TD
    subgraph PRES["Presentation"]
        UI["Scene views\nhome, stages 1-3, results"]
        HUD["HUD: step, meter, score, audio"]
    end
    subgraph APP["Application"]
        SM["Scene state machine"]
        VAL["Validation engines\nschematic / DRC / fit"]
        SCORE["Scoring + progress engine"]
        AUDIO["Audio controller"]
    end
    subgraph LOCAL["Local Data"]
        PROG["Progress store\n(IndexedDB or localStorage)"]
        PREFS["Preferences\nmute, reduced motion"]
    end
    subgraph CONTENT["Content"]
        PACK["Content pack\ncircuits, tasks, items, scoring config"]
        MEDIA["Media assets\nart, audio, icons"]
    end
    subgraph SW["Service Worker"]
        SHELL["Shell cache"]
        ASSETS["Asset cache"]
    end
    subgraph REMOTE["Remote (optional)"]
        HOST["Static host\nhosted PWA build"]
        SYNC["Sync endpoint\nnot planned"]
    end

    UI --> SM
    HUD --> SCORE
    SM --> VAL --> SCORE --> PROG
    SM --> AUDIO
    SM --> PACK
    UI --> MEDIA
    PROG --> PREFS
    SHELL -.serves.-> UI
    ASSETS -.serves.-> MEDIA
    ASSETS -.serves.-> PACK
    HOST -. install / update only .-> SW
    SCORE -. REQ-PWA-008, not planned .-> SYNC
```

## Layer contracts

| Layer | Owns | Must not |
| --- | --- | --- |
| Presentation | Rendering, input capture, animation | Contain a validation rule or a content value |
| Application | State machine, validation, scoring, audio policy | Touch the DOM in validation paths (REQ-TECH-005) |
| Local data | Persistence, schema versioning, migration | Assume a network |
| Content | Circuits, tasks, questions, scoring config, media manifest | Depend on application internals (REQ-NF-012) |
| Service worker | Caching, update lifecycle | Be required for correctness — the `file://` build has none |
| Remote | Hosting and distribution | Be required at runtime (REQ-TECH-001) |

The last row is the load-bearing one: **the network is never in a critical path.** Every learning function completes with the machine in airplane mode.

## Runtime deployment topologies

```mermaid
flowchart LR
    subgraph A["Topology A - hosted PWA"]
        BROWSER1[Browser] --> SWA[Service worker] --> CACHEA[(Cache Storage)]
        BROWSER1 --> IDBA[(IndexedDB)]
        SWA -. first load + updates .-> CDN[Static host]
    end
    subgraph B["Topology B - file:// lab bundle"]
        BROWSER2[Browser] --> FS[(Local folder)]
        BROWSER2 --> IDBB[(IndexedDB / localStorage)]
    end
```

Same build, two distributions — [[ADR-005-Dual-Distribution]] and [[Deployment-Architecture]]. Topology B has **no service worker** (browsers do not register one on `file://`), which is precisely why local-first cannot be delegated to the service worker: see [[Local-First-Architecture]].

## Key constraints shaping this architecture

| Constraint | Consequence |
| --- | --- |
| REQ-TECH-001 — no server runtime | All logic client-side; no API layer exists to design |
| REQ-NF-001 — < 25 MB | The media manifest and any 3D library are budget items, not free choices |
| REQ-NF-003 — runs from `index.html` | No absolute URLs, no origin-relative paths, no ES module CORS assumptions on `file://` |
| REQ-NF-012 — content independent of code | Content pack is a versioned artefact with its own schema |
| REQ-PWA-002 — full offline | Everything precached; nothing lazily fetched at stage entry |
| REQ-NF-011 — no accounts | No auth, no user identity, no server state to reconcile |

## What is deliberately absent

No backend, no database server, no authentication, no analytics, no CDN dependency at runtime, no third-party embeds. Each of these would break either REQ-TECH-001 or REQ-NF-011, and none is requested by either approved document.

## Related

- [[Application-Architecture]] · [[Content-Architecture]] · [[Data-Architecture]]
- [[Local-First-Architecture]] · [[PWA-Architecture]] · [[Deployment-Architecture]]
