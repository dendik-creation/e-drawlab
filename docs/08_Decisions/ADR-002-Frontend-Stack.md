# ADR-002 — Frontend stack

## Status

Proposed — **decision pending**

```text
Status: To Be Decided

Question:
Which frontend stack should E-DrawLab use?

Candidates:
- Vite + React + TypeScript
- Vite + vanilla TypeScript
- Next.js (static export)
- Svelte / SvelteKit (static)

Decision:
Pending. Owner: build lead.
Blocks: Roadmap Phase 1 onward.
```

## Context

No approved document names a technology. The proposal names only an architecture (SPA) and a delivery form (`index.html`, offline, < 25 MB). Anything further is an engineering decision, and must not be presented as a proposal requirement.

Constraints the stack must satisfy:

| Constraint | Requirement |
| --- | --- |
| No server runtime | REQ-TECH-001 |
| Must build a `file://`-compatible artefact (classic scripts, relative paths, no CORS-bound module loading) | REQ-NF-003, REQ-TECH-003, [[ADR-005-Dual-Distribution]] |
| Total payload < 25 MB including all media | REQ-NF-001 |
| Domain models testable without a DOM | REQ-TECH-005 |
| Runs on ageing school lab hardware | REQ-NF-006 |
| Content loaded as data, not compiled in | REQ-NF-012 |

## Options

### A. Vite + React + TypeScript

- **For**: familiar to most contributors; strong component ecosystem for the HUD/overlay/quiz surfaces; TypeScript protects the domain models; Vite emits a static bundle and can target a single-file/classic-script output for the `file://` artefact.
- **Against**: ~45 kB gzipped runtime cost before any application code; React's model adds little to canvas-driven stages, which are the bulk of the work.

### B. Vite + vanilla TypeScript

- **For**: smallest payload, maximum control over the canvas/3D surfaces, no framework semantics to fight in the stages.
- **Against**: the results dashboard, quiz and overlays are ordinary declarative UI that a framework makes cheaper; hand-rolled state management tends to erode the model/view split that REQ-TECH-005 depends on.

### C. Next.js static export

- **For**: familiar conventions and tooling.
- **Against**: it is a server-oriented framework used with its server removed; the router assumes an origin and clean URLs, which is hostile to `file://`; the largest payload of the three. Poor fit for the actual constraint set.

### D. Svelte (static)

- **For**: smallest framework runtime of the component options; compiles away; good fit for the budget.
- **Against**: smaller contributor pool for a school project that must remain maintainable by whoever inherits it.

## Recommendation (not yet a decision)

**A — Vite + React + TypeScript**, unless the size gate proves tight after the media budget is measured, in which case **D**. Both satisfy every hard constraint; the decision hinges on maintainability versus payload, and the `file://` output target must be verified early either way ([[Offline-Testing]]).

**C is not recommended.**

## Consequences

Deferred until decided. Whatever is chosen: the domain models in [[Application-Architecture]] must contain no framework imports, so this decision stays reversible for the parts that matter most.

## Related

- [[Application-Architecture]] · [[ADR-005-Dual-Distribution]] · [[ADR-007-Asset-Budget]] · [[Open-Questions]]
