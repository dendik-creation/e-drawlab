---
title: "Research — Progress Persistence Options"
---

# Research — Progress Persistence Options

## Question

Where should learner progress live, given a shared lab computer, no accounts, no network, and a `file://` execution context?

## Constraints

REQ-PWA-007 (progress persists across reloads and offline sessions), REQ-NF-011 (no personal data, no accounts), REQ-F-022 (reset must clear it completely), plus the `file://` storage quirks catalogued in [[Offline-Strategy]].

Record size: a few kilobytes ([[Data-Architecture]]).

## Options

| Option | Capacity | `file://` behaviour | Notes |
| --- | --- | --- | --- |
| `localStorage` | ~5 MB | Often available; may be **shared across all local files** in some browsers, or disabled | Synchronous, string-only |
| IndexedDB | Large | Usually available; behaviour varies, opaque origins in places | Async, structured, transactional |
| Cache Storage | Large | Requires a service worker context for practical use | Wrong tool for mutable records |
| OPFS | Large | Limited support breadth | Too new for the target hardware |
| In-memory only | — | Always works | Loses a lesson on refresh — fails REQ-PWA-007 |

The `localStorage`-shared-across-`file://`-documents behaviour is the interesting one: it means two different local copies of the app could see each other's data. Harmless here (no personal data, and a reset clears it), but it argues for namespaced keys.

## Recommendation

**IndexedDB primary, `localStorage` fallback, in-memory last resort with a visible warning** — chosen at runtime by capability probe, behind one persistence interface.

Namespace every key (`edrawlab:v1:*`) so a shared `file://` origin cannot collide with anything else.

## Reason

No single store works everywhere the product must run. IndexedDB is the right model for a structured, growing record; `localStorage` is the reliable floor in awkward `file://` contexts; the in-memory path exists so a locked-down machine degrades *visibly* rather than silently losing a lesson.

The record is small enough that the 5 MB fallback cap is irrelevant — this decision is about availability, not capacity.

## Impact

- Persistence interface is async everywhere, even over the synchronous fallback ([[ADR-004-Local-Persistence]]).
- Two paths to test, including the degraded one ([[Offline-Testing]]).
- Reset must clear both stores, not just the active one — otherwise a fallback record resurfaces later ([[Feature-Scoring-and-Progress]]).
- Request persistent storage where available to reduce eviction risk on lab machines under disk pressure.

## Related

- [[Data-Architecture]] · [[Local-First-Architecture]] · [[ADR-004-Local-Persistence]]
