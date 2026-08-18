---
title: "Research — 3D Rendering Options"
---

# Research — 3D Rendering Options

## Question

How should the Stage 3 casing be rendered, given unknown school lab hardware and a 25 MB budget?

## What actually has to be drawn

From [[Scene-04-Stage-3-3D-Casing]]:

1. A rectangular box whose length, width and height change continuously from sliders.
2. Constant slow auto-rotation, plus manual orbit by drag.
3. The Stage-2 PCB visible beside — and, on a successful fit, inside — the box.
4. A collision animation: the board strikes a wall and the shell cracks.

That is a parametric box, a camera rotation and one dramatic effect. It is not a CAD kernel.

## Options

### A. three.js (WebGL)

- **Payload**: ~150–200 kB gzipped tree-shaken — 20–25% of the shell bucket in [[Non-Functional-Requirements]].
- **Fit**: excellent. `BoxGeometry` with live dimension updates, `OrbitControls`, real lighting, straightforward crack/collision effects.
- **Risk**: no WebGL, no stage. Old lab GPUs, blocklisted drivers and locked-down machines all exist. Requires a capability probe and a fallback regardless.

### B. CSS 3D transforms

- **Payload**: effectively zero.
- **Fit**: adequate. Six `div` faces with `transform: translate3d/rotate` form a box; scaling is a style update; orbit is two rotation values. Runs anywhere CSS transforms do, which is everywhere the product targets.
- **Limits**: no lighting model; depth sorting must be managed by hand; a translucent shell with a board inside is fiddly; the crack becomes an art asset rather than a simulation.

### C. Pre-rendered sprite sequences

- **Payload**: large — dimensions are continuous, so the state space cannot be pre-rendered.
- **Fit**: fails the core mechanic. Rejected for the model; still useful for the *crack effect* layered over either renderer.

### D. 2D canvas with a hand-rolled isometric projection

- **Payload**: near zero.
- **Fit**: workable — a box in isometric projection is a few polygons, and dimension changes are arithmetic.
- **Limits**: free orbit becomes awkward; a fixed isometric or a few snapped viewpoints is the realistic compromise.

## Recommendation

**Probe the lab hardware first** — that is a task, not an assumption ([[Tasks]]).

- If WebGL is present across the target machines: **A** with **B** as the no-WebGL fallback.
- If it is not: **B** alone, with the crack as a sprite overlay (a slice of **C**).

Rejected: **C** as the primary renderer; **D** unless CSS 3D proves unworkable.

## Reason

The learning outcome (LO-6) depends on the *relationship* between numbers and a visible volume, not on rendering fidelity. A stylised box that runs on every machine teaches the outcome; a beautiful box that fails to start on lab hardware teaches nothing. Meanwhile the fit test itself is pure logic and renderer-independent ([[Application-Architecture]]), so this choice is contained to the view layer.

## Impact

- Decides ~200 kB of the shell budget ([[ADR-007-Asset-Budget]]).
- Determines whether a capability probe and a fallback path are needed (with option A, they are).
- Affects the keyboard orbit alternative — with a fixed isometric fallback, "orbit" reduces to a few preset viewpoints, which is also the more accessible design ([[Accessibility]]).

## Related

- [[ADR-006-3D-Rendering-Approach]] · [[Feature-Casing-Modeller]] · [[Non-Functional-Requirements]]
