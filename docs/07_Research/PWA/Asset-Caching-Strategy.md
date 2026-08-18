---
title: "Research — Asset Caching Strategy"
---

# Research — Asset Caching Strategy

## Question

How should multimedia assets be cached so that a full lesson runs offline, in both the hosted and `file://` distributions, inside a 25 MB budget?

## Constraints

REQ-PWA-002 (fully offline after install), REQ-PWA-004 (content cached, not lazily fetched at stage entry), REQ-NF-001 (< 25 MB), REQ-PWA-010 (`file://` has no service worker), REQ-NF-006 (ageing lab hardware).

## Options

### A. Precache everything at install

All shell, content and media enter the cache during service-worker install.

- **For**: after install, no fetch can fail. Simple mental model, trivially testable. The 25 MB budget makes it affordable — this is only feasible *because* the product is small.
- **Against**: a heavy first install; a single failed asset can fail the whole install unless handled; updates re-download broadly unless assets are hashed.

### B. Precache the shell, cache media on first use

Shell precached; art and audio cached as encountered.

- **For**: fast first install; only pays for what is used.
- **Against**: **violates REQ-PWA-004**. A class that installs at home and reaches Stage 3 offline in the lab discovers a missing 3D asset mid-lesson. Exactly the failure mode the requirement forbids.

### C. Precache the shell, then background-fetch media after activation

Shell precached; media pulled in the background while the learner reads the guide.

- **For**: fast to interactive, complete before the stages are reached in the normal lesson flow (the guide is read the day *before*, per REQ-EDU-019).
- **Against**: two states to reason about ("installed" vs "complete"); a learner who rushes straight into Stage 1 can outrun the fetch; the Background Fetch API has limited support, so the fallback is ordinary requests that a closed tab cancels.

## Recommendation

**A — precache everything**, with per-asset failure tolerance: media that fails to cache is retried, but a failure does not abort the install, since mechanics survive missing decorative assets ([[UI-States]]).

Show install progress on the install affordance only; the app stays usable throughout.

## Reason

REQ-PWA-004 is not a performance preference — it exists because the graded session happens offline, in a room, on a schedule. Option B trades a guaranteed lesson for a faster first load, which is the wrong trade here. Option C's complexity buys speed that the lesson plan does not need: the day-before home session is exactly when a full download should happen.

Option A is only viable because of the 25 MB cap, which is the same reason [[ADR-007-Asset-Budget]] enforces the cap mechanically. The two decisions hold each other up.

## Impact

- Service worker precaches from the media manifest in [[Content-Architecture]] — the manifest becomes build-critical, not documentation.
- Cache keys: shell by build hash, media/content by pack version, so a content-only change does not re-download the shell.
- The size gate protects install time as well as storage.
- The `file://` artefact skips all of this — the files are already on disk ([[Offline-Strategy]]).

## Related

- [[PWA-Architecture]] · [[Media-Asset-Register]] · [[ADR-007-Asset-Budget]] · [[PWA-Testing]]
