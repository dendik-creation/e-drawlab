---
title: Offline Testing
---

# Offline Testing

Verifies that the graded session survives its real environment. Environments E1/E2/E3 are defined in [[Offline-Strategy]].

This plan matters more than usual: E2 — the `file://` lab bundle — is where the assessed lesson happens and is the least observable environment the product ships into ([[Technical-Debt]] D-5).

## `file://` artefact — E2

Run on Windows, opened by double-clicking `index.html` from an arbitrary folder depth, with the network disabled.

| # | Check | Requirement |
| --- | --- | --- |
| OFF-1 | Application starts; home renders and is interactive | REQ-NF-003 |
| OFF-2 | No service worker is registered; no console errors from attempting one | REQ-PWA-010 |
| OFF-3 | Content pack loads without `fetch` | [[Offline-Strategy]] |
| OFF-4 | No absolute-path request appears in the network log | REQ-TECH-003 |
| OFF-5 | All media resolves — every asset in the manifest | REQ-PWA-004 |
| OFF-6 | Full run completable: three stages, all items, results, certificate | REQ-PWA-002 |
| OFF-7 | Progress persists across a reload | REQ-PWA-007 |
| OFF-8 | Where storage is unavailable, the session-only warning appears and the run still completes | [[UI-States]] |
| OFF-9 | `[DESAIN ULANG]` clears everything, including the fallback store | REQ-F-022 |
| OFF-10 | Build and content versions are visible | [[Deployment-Architecture]] |
| OFF-11 | Two copies in different folders do not collide in shared local storage | [[Progress-Persistence-Options]] |

OFF-1 through OFF-6 are automated in CI as the `file://` smoke test; the rest are release checks.

## Hosted, offline after install — E3

| # | Check | Requirement |
| --- | --- | --- |
| OFF-12 | Install online, then run a full lesson with the network disabled | REQ-PWA-002 |
| OFF-13 | Cold launch offline from the installed icon | REQ-PWA-001 |
| OFF-14 | No connectivity banner or spinner appears while offline | [[UI-States]] |
| OFF-15 | Going offline mid-stage changes nothing | REQ-PWA-002 |
| OFF-16 | Progress written offline survives a later online launch | REQ-PWA-007 |

## Degradation

| # | Scenario | Expected |
| --- | --- | --- |
| OFF-17 | Storage quota exhausted mid-run | Explicit warning, run continues in memory |
| OFF-18 | Cache evicted between sessions (hosted) | Documented limitation; app requires one online visit ([[Local-First-Architecture]] §Recovery) |
| OFF-19 | One media asset missing | Mechanics unaffected |
| OFF-20 | Corrupt progress record | Clean-reset offer, no white screen |
| OFF-21 | Content pack invalid | Startup error naming the file |

## Method

Test on a machine that has **never** loaded the application online — a fresh profile or VM. Testing "offline" by toggling DevTools on a machine with a warm cache proves nothing about a lab computer that has never seen the internet.

## Related

- [[Offline-Strategy]] · [[Local-First-Architecture]] · [[PWA-Testing]] · [[Deployment-Architecture]]
