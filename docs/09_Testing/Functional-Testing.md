---
title: Functional Testing
---

# Functional Testing

Verifies `REQ-F-*` and `REQ-TECH-*`. Requirement text: [[Requirements-Matrix]].

## Layers

| Layer | Scope | Runs |
| --- | --- | --- |
| Unit | Domain models — schematic, DRC, casing, scoring | Every commit, no DOM |
| Contract | Content pack against its schema | Every commit |
| Integration | Scene state machine, progress persistence, handoffs | Every commit |
| End-to-end | Full runs in a real browser, both artefacts | Every build |

## Unit — the curriculum as tests

These are the highest-value tests in the project: they assert the things the product *teaches*.

**Schematic ([[Stage-1-Schematic-Standards]])**
- Valid placement locks and scores; invalid returns the right reason code.
- Reversed LED polarity → `LED_REVERSED`.
- Series topology accepted only with LED1 cathode → LED2 anode.
- Parallel topology accepted only with one resistor per branch and junction nodes at split and merge.
- Invalid etiket scale (5:1 on A4) rejected.

**DRC ([[Stage-2-PCB-Trace-Width]])** — parameterised over the revision's own answer grid:

| Current | 0.5 oz | 1 oz | 2 oz |
| --- | --- | --- | --- |
| 5 A | 10 mm | 5 mm | 2.5 mm |
| 6 A | 12 mm | 6 mm | 3 mm |
| 10 A | 20 mm | 10 mm | 5 mm |

Plus: 8 A on 1 oz → 8 mm and on 2 oz → 4 mm (Q-S2-02); 1 A on 0.5 oz → 2 mm with a signal trace floored at 0.8 mm (Q-S2-03); a 90° corner rejected; an unconnected required net rejected.

**Casing ([[Stage-3-Casing-Dimensions]])** — every worked item:
`(60×40, c=1.5) → 63/43` · `(standoff 5, T 1.6, comp 18, top 2.4) → H_in 27.0` · `(in 80×50×30, wall 2) → 84×54×34` · `(75×45, c=2.0) → 79/49` · `(H_in 23.0, standoff 4, T 1.5, comp 15) → top 2.5` · `(in 90×55×32, wall 2.5) → 95×60×37`.
Plus: each axis under-dimension fails on that axis.

If a content value changes, these tests must be regenerated from content, not edited by hand — the content pack is the source ([[ADR-003-Content-As-Data]]).

## Integration

- Progress persists after every scoring event and restores exactly ([[Data-Architecture]]).
- Stage 2 → Stage 3 board handoff (REQ-F-029).
- `[DESAIN ULANG]` clears both storage paths, preserves preferences (REQ-F-022).
- Scene machine gating: no stage is reachable before its predecessor passes.
- Corrupt or version-mismatched records take the migration/archive path.

## End-to-end

| # | Scenario | Assert |
| --- | --- | --- |
| E2E-1 | Full happy-path run home → certificate | Zero document loads after the first (REQ-F-001) |
| E2E-2 | Full run with one failure per stage | Each consequence plays; meter and score match the model |
| E2E-3 | Reload mid-Stage-2 | Exact state restored |
| E2E-4 | `[DESAIN ULANG]` then a fresh run | No residue from the previous run |
| E2E-5 | Same run in the `file://` artefact | Identical outcomes ([[Offline-Testing]]) |
| E2E-6 | Touch-only run | All mechanics completable (REQ-UX-003) |
| E2E-7 | Keyboard-only run | All mechanics completable (REQ-UX-004) |
| E2E-8 | Muted run | Every failure still comprehensible (REQ-UX-007) |

## Not covered here

Educational validity ([[Educational-Testing]]), usability with real learners ([[Usability-Testing]]), offline and install behaviour ([[Offline-Testing]], [[PWA-Testing]]).

## Related

- [[Application-Architecture]] · [[Requirements-Matrix]] · [[Roadmap]]
