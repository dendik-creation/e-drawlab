# ADR-009 — Landscape-first layout with a portrait guard

## Status

Proposed

## Context

Two requirements must coexist: the proposal specifies a **16×9** application (REQ-NF-002) and every stage in the storyboard is a two-column workspace (canvas + tool panel); the Project Brief requires a **responsive** and **landscape-oriented** design (REQ-NF-008, REQ-NF-009, REQ-UX-001).

A purely fluid layout would let the stage reflow into a vertical stack, which destroys the cause-and-effect pairing the product teaches — a slider must be visible *while* its effect is visible ([[Landscape-Design]]).

A purely fixed 16×9 canvas letterboxed into every viewport would waste space on lab monitors and make text unreadable on small screens.

## Decision

**Scaled fixed stage inside responsive chrome:**

- The workspace is authored at one 16×9 aspect and scaled with `min(vw/16, vh/9)`, preserving the storyboard's spatial composition.
- The surrounding chrome — HUD, overlays, guide, quiz, results — uses ordinary responsive layout with breakpoints.
- Text inside the stage has a size floor; below it, that text migrates to the chrome rather than shrinking further.
- Hit targets never scale below 44 × 44 CSS px.
- Portrait is **guarded** for stage scenes with a rotate prompt, and **supported** for home, guide, case study, quiz and results — because the lesson plan has students reading the guide on a phone at home (REQ-EDU-022).

## Alternatives

1. **Fully fluid layout everywhere.** Rejected: breaks the spatial pedagogy and the approved 16×9 composition.
2. **Fixed 16×9 letterbox for the entire app.** Rejected: wastes lab-monitor space, produces unreadable text on small screens, and blocks portrait reading of the guide.
3. **Separate mobile layouts per scene.** Rejected: doubles layout work and drifts from the approved storyboard; also risks becoming a "mobile version" with different content, violating REQ-NF-010.
4. **Hard orientation lock via the manifest.** Insufficient — `orientation: landscape` is a hint that many platforms ignore, so an in-app guard is required regardless.

## Consequences

### Positive

- The approved composition survives at every screen size.
- One layout system, one content set, one codebase.
- The guide remains usable in portrait, which the lesson plan depends on.

### Negative

- Stage text scales with the viewport, requiring the size-floor rule and careful typography.
- The portrait guard is a real interruption for phone users entering a stage.
- Scaled canvases need care with device pixel ratio to stay crisp without wasting GPU on weak hardware.

## Related

- [[Landscape-Design]] · [[Responsive-Design]] · [[UX-Principles]] · [[PWA-Architecture]]
