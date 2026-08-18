# ADR-001 — Single Page Application with no server runtime

## Status

Proposed

## Context

The approved storyboard states the architecture directly: "arsitektur Single Page Application (SPA)", home loads instantly with no opening video, and the reset returns to Scene 01 "tanpa memuat ulang aplikasi (no reload redirected)" (REQ-F-001, REQ-F-022, REQ-F-028).

The implementation plan requires students to open `index.html` from a copied folder on offline lab computers (REQ-NF-003), which rules out any server-rendered or server-dependent architecture. The Project Brief adds that one codebase must serve both online and offline usage (REQ-NF-010).

## Decision

Build a client-only SPA: one HTML document, in-memory scene state, no server runtime for any function (REQ-TECH-001). Scene transitions never cause a document load.

URL routing is optional and non-load-bearing. A hash route may be added for development convenience, but no feature may depend on it, because `file://` deep-linking and history behaviour vary by browser.

## Alternatives

1. **Multi-page application.** Each scene its own HTML file. Rejected: contradicts the approved SPA statement, and full page loads break the "instant, no reload" requirements and the persistent HUD.
2. **Server-rendered app (Next.js SSR, PHP, etc.).** Rejected: requires a runtime the school lab does not have, and fails REQ-NF-003 outright.
3. **Static site generator with client hydration per page.** Rejected for the same navigation reasons; also adds build complexity with no gain, since there is no content to pre-render for SEO.

## Consequences

### Positive

- Satisfies the offline and dual-distribution requirements without special cases.
- The persistent HUD (step indicator, meter, score) and cross-stage state are trivial.
- No hosting cost or operational surface; deployment is a file copy ([[Deployment-Architecture]]).

### Negative

- No browser-native back navigation between scenes; wayfinding rests entirely on the in-app step indicator and buttons ([[Navigation]]).
- All code and content ship up front, making the 25 MB budget a first-class constraint ([[ADR-007-Asset-Budget]]).
- Deep-linking to a scene for teacher demonstration is not available by default.

## Related

- [[Feature-Application-Shell]] · [[System-Architecture]] · [[ADR-005-Dual-Distribution]]
