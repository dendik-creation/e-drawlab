---
title: PWA Testing
---

# PWA Testing

Verifies `REQ-PWA-001…010` for the hosted artefact. Offline behaviour is covered in [[Offline-Testing]]; this plan covers install, caching and update.

## Installability

| # | Check | Requirement |
| --- | --- | --- |
| PWA-1 | Manifest served and valid; all fields per [[PWA-Architecture]] | REQ-PWA-001 |
| PWA-2 | Icons at 192 and 512, maskable variant present | REQ-PWA-001 |
| PWA-3 | Service worker registers and activates over HTTPS | REQ-PWA-003 |
| PWA-4 | Browser install criteria met; in-app install affordance works | REQ-PWA-001 |
| PWA-5 | Installed launch opens fullscreen/standalone in landscape | REQ-UX-001 |
| PWA-6 | `start_url` and `scope` work under a sub-path deployment | REQ-TECH-003 |

## Caching

| # | Check | Requirement |
| --- | --- | --- |
| PWA-7 | Install precaches shell, content pack **and all media** | REQ-PWA-004 |
| PWA-8 | Total cached bytes < 25 MB | REQ-NF-001, REQ-PWA-009 |
| PWA-9 | After install, no network request is made during a full run | REQ-PWA-002 |
| PWA-10 | A single failed media asset does not abort the install | [[Asset-Caching-Strategy]] |
| PWA-11 | Cache keys are build-hash and pack-version scoped | [[PWA-Architecture]] |
| PWA-12 | Persistent storage is requested; the result is handled either way | [[Local-First-Architecture]] |

## Updates

| # | Check | Requirement |
| --- | --- | --- |
| PWA-13 | A new build is detected on next launch | REQ-PWA-005 |
| PWA-14 | **No auto-reload occurs while a stage is in progress** | REQ-PWA-005 |
| PWA-15 | The update notice is passive and dismissible | [[UI-States]] |
| PWA-16 | Applying an update swaps caches and deletes stale ones | REQ-PWA-005 |
| PWA-17 | A content-only change does not re-download the shell | [[Asset-Caching-Strategy]] |
| PWA-18 | A major content-version bump handles an in-progress run per policy | [[Local-First-Architecture]] |

PWA-14 is the one that matters in a classroom: a reload at minute 30 of a 45-minute lesson costs the lesson.

## Detection

| # | Check | Requirement |
| --- | --- | --- |
| PWA-19 | Online/offline detection drives only update checks — never the learning UI | REQ-PWA-006 |
| PWA-20 | Flapping connectivity produces no user-visible churn | [[UX-Principles]] P-5 |

## Method

Audit with Lighthouse for the installability baseline, then verify the behavioural checks by hand — Lighthouse cannot tell you that an update did not interrupt Stage 2. Use a fresh profile for every install test; a warm cache invalidates PWA-7 through PWA-9.

## Related

- [[PWA-Architecture]] · [[Asset-Caching-Strategy]] · [[Offline-Testing]] · [[Deployment-Architecture]]
