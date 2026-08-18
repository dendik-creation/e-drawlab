# ADR-005 — Hosted PWA and `file://` bundle from one source

## Status

Proposed

## Context

Two requirements collide.

The approved implementation plan has students opening `index.html` from a copied folder on offline lab computers, distributed through the school LMS or a chat group (REQ-NF-003, REQ-EDU-019). The Project Brief requires an installable PWA, deployable online, with one codebase for both modes (REQ-PWA-001, REQ-NF-010).

The technical fact that forces a decision: **service workers do not register on `file://`.** A PWA's entire offline mechanism is unavailable in the environment the proposal actually specifies for the graded session.

## Decision

Ship **two build artefacts from one source tree**:

| Artefact | Target | Differences |
| --- | --- | --- |
| A — web build | Hosted, installable PWA (E1/E3) | Service worker, manifest, hashed assets, module scripts |
| B — `file://` bundle | Lab computers (E2) | No service-worker registration, classic-script output, content pack inlined, all paths relative |

The differences are **build-target configuration only**. Components, domain models, content and validation are identical. Any feature that cannot work in B does not ship in either.

Consequently, local-first behaviour is implemented at the **application layer** ([[Local-First-Architecture]]), never delegated to the service worker — B has none, and correctness cannot depend on it.

## Alternatives

1. **PWA only.** Rejected: fails REQ-NF-003. A lab machine that was never online has nothing cached and cannot start.
2. **`file://` only.** Rejected: fails REQ-PWA-001 and the brief's online deployment requirement; also gives up automatic updates for the home-study path.
3. **Two separate codebases.** Rejected outright: fails REQ-NF-010 and guarantees divergence between what students see at home and in the lab.
4. **Electron/native wrapper for the lab.** Rejected: install rights on school machines are not assumable, and it violates the web-based brief.

## Consequences

### Positive

- Both approved delivery paths work, from one source of truth.
- The service worker becomes an optimisation rather than a dependency — a more robust position regardless.
- The 25 MB budget serves both artefacts equally.

### Negative

- Two build outputs to configure, test and release ([[Deployment-Architecture]]).
- The `file://` constraint list ([[Offline-Strategy]]) restricts stack choices — some frameworks fight it (see [[ADR-002-Frontend-Stack]] option C).
- Artefact B receives no automatic updates; content corrections require redistribution.
- CI must include a real `file://` smoke test, or B will break silently.

## Related

- [[Offline-Strategy]] · [[PWA-Architecture]] · [[Deployment-Architecture]] · [[Offline-Testing]]
