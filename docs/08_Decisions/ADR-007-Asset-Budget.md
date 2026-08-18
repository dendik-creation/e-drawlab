# ADR-007 — 25 MB asset budget and enforcement

## Status

Proposed

## Context

The approved description states the offline application is **< 25 MB** (REQ-NF-001). The same document specifies five illustrated 16×9 scenes, three music tracks, three ambience loops and roughly a dozen SFX ([[Media-Asset-Register]]) — 19 named audio assets and a dozen visual ones, before icons.

This is not a comfortable budget. It is also load-bearing beyond file size: it must travel through an LMS or chat upload ([[Offline-Strategy]]), and it must precache cleanly into browser storage (REQ-PWA-009).

## Decision

Adopt the bucket allocation in [[Non-Functional-Requirements]] §Size budget and enforce it mechanically:

1. A **build-time size gate** fails the build when either artefact exceeds 25 MB.
2. Per-bucket sub-budgets are reported on every build, so a regression is attributable.
3. Format policy: WebP/AVIF for illustration, **SVG for all icons and component symbols**, mono ~96 kbps for music loops, lower for SFX.
4. Music and ambience are **short seamless loops**, not long tracks.
5. Any third-party runtime dependency (notably a 3D library — [[ADR-006-3D-Rendering-Approach]]) is charged against the shell bucket and must be justified against it.
6. Fonts are subsetted; Poppins Bold is required by the storyboard for the title only, so ship a Latin subset of the weights actually used.

## Alternatives

1. **No enforcement, monitor manually.** Rejected: media is produced late and by non-developers; without a gate the budget will be discovered broken at release.
2. **Lazy-load media on demand.** Rejected: violates REQ-PWA-004 — a class hitting Stage 3 offline must not discover a missing asset.
3. **Renegotiate the 25 MB figure.** Not ours to renegotiate; it is an approved proposal statement. Any change requires an approved revision.

## Consequences

### Positive

- The offline artefact stays distributable through school infrastructure.
- Precaching everything remains affordable, which is what makes the offline story simple ([[PWA-Architecture]]).
- Media production gets an explicit target before assets are commissioned.

### Negative

- Art quality is capped; five full-screen illustrations inside ~12 MB constrains resolution and detail.
- A generous 3D library eats a meaningful share of the shell bucket.
- Adding a sixth scene later requires renegotiating buckets, not just adding files.

## Related

- [[Non-Functional-Requirements]] · [[Media-Asset-Register]] · [[Asset-Caching-Strategy]] · [[Deployment-Architecture]]
