# ADR-006 — Stage 3 3D rendering approach

## Status

Proposed — **decision pending**

```text
Status: To Be Decided

Question:
How is the Stage 3 casing rendered?

Candidates:
- three.js (WebGL)
- CSS 3D transforms
- Pre-rendered sprite sequences

Decision:
Pending. Owner: build lead, after the lab hardware inventory.
Blocks: Feature — Casing Modeller.
```

## Context

Scene 04 requires a rectangular casing that resizes live from three sliders, auto-rotates, supports manual orbit, and animates a collision that cracks the shell (REQ-F-012, REQ-F-013, REQ-F-015).

Constraints: unknown, possibly ageing school lab hardware where WebGL cannot be assumed (REQ-NF-006); a 25 MB total budget where a 3D runtime competes directly with illustration and audio (REQ-NF-001); and no network at runtime.

The geometry actually needed is modest: a parametric box with a visible interior, a separable lid, a board inside it, and a crack state.

## Options

### A. three.js (WebGL)

- **For**: trivially handles parametric geometry, orbit controls, lighting and a convincing crack/collision; the ordinary choice.
- **Against**: ~150–200 kB gzipped for a tree-shaken core, and hard-fails without WebGL. Requires a capability probe and a fallback anyway.

### B. CSS 3D transforms

- **For**: near-zero payload; works anywhere transforms do, including old hardware; a box of six positioned faces is genuinely enough for this shape; orbit is two rotations.
- **Against**: no real lighting or depth sorting for the interior view; the crack animation becomes an art problem rather than a physics one; a translucent shell with a board inside is fiddly.

### C. Pre-rendered sprite sequences

- **For**: perfect visual fidelity, no runtime 3D at all.
- **Against**: dimensions are *continuous* here — sliders drive arbitrary values, so pre-rendering cannot cover the combinations. Fails the core mechanic.

## Recommendation (not yet a decision)

Probe the actual lab hardware first ([[Open-Questions]]). If WebGL is present across the target machines, **A** with a **B** fallback for the no-WebGL case. If it is not, **B** alone — the mechanic survives a stylised box, and a stage that does not run at all is a far worse outcome than a flatter one.

**C is rejected** for the main model; sprite sequences remain viable for the crack/collision *effect* layered over either renderer.

## Consequences

Deferred. Regardless of choice, the fit-test model stays pure and renderer-independent ([[Application-Architecture]]), so Stage 3's assessment logic is unaffected by this decision.

## Related

- [[Feature-Casing-Modeller]] · [[3D-Rendering-Options]] · [[Non-Functional-Requirements]] · [[ADR-007-Asset-Budget]]
