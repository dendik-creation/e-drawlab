# ADR-004 — Local persistence mechanism

## Status

Proposed

## Context

Progress must survive reloads and offline sessions (REQ-PWA-007), be written after every scoring event, and work in three environments — hosted online, installed offline, and `file://` on a lab PC ([[Offline-Strategy]]). Storage behaviour on `file://` is inconsistent across browsers: opaque origins, shared or disabled `localStorage`, variable IndexedDB support.

The record is small — a few kilobytes ([[Data-Architecture]]).

## Decision

Use **IndexedDB as the primary store with a `localStorage` fallback**, selected at runtime by a capability probe, behind a single persistence interface so no other module knows which is active.

If neither is available (private browsing with zero quota, hardened `file://` context), degrade to **session-only in-memory progress with an explicit, visible warning** — never a silent failure ([[UI-States]]).

Preferences (mute, reduced motion) always use `localStorage` when present: they are tiny, synchronous access is convenient, and they intentionally survive `[DESAIN ULANG]`.

## Alternatives

1. **localStorage only.** Simplest and most compatible, but synchronous main-thread writes during an animated stage, string-only serialisation, and ~5 MB cap. Acceptable today; a poor foundation if runs are ever archived.
2. **IndexedDB only.** Cleanest data model, but leaves no path when it is unavailable — which is exactly the `file://` case the product must ship into.
3. **Cache Storage.** Wrong tool for mutable records.
4. **OPFS.** Support breadth is unsuitable for the target lab hardware (REQ-NF-006).

## Consequences

### Positive

- Works across all three environments, including the awkward one.
- The abstraction keeps the store swappable and testable ([[Application-Architecture]]).
- Degradation is visible to the learner rather than silent.

### Negative

- Two code paths to maintain and test ([[Offline-Testing]]).
- Quota and eviction handling must be written, not assumed.
- Async primary and sync fallback means the interface must be async everywhere.

## Related

- [[Data-Architecture]] · [[Local-First-Architecture]] · [[Feature-Scoring-and-Progress]]
