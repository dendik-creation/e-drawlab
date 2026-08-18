# ADR-003 — Educational content as validated data

## Status

Proposed

## Context

Two facts from the proposal analysis drive this:

1. The approved revision changed *only* content — circuits, values, formulas, questions ([[Proposal-Comparison]]). A future revision will plausibly do the same.
2. Substantial content is still unwritten while the mechanics are fully specified: three reflective quiz stems, all instrument descriptions, the case-study narrative, every failure explanation ([[Content-Inventory]]).

If those values live inside components, every content correction is a developer task and a redeploy, and the vault's traceability stops at the repository boundary.

## Decision

All educational content ships as **schema-validated data files**, separate from application code (REQ-NF-012, REQ-TECH-002). Application code contains algorithms; content contains values, text and configuration — including scoring constants, tolerances and failure messages.

Every content object carries a `source` field using the same vocabulary as [[Requirements-Matrix]] (`Approved Proposal` / `Approved Revision` / `Project Brief` / `Engineering Decision`), so provenance survives into the running product.

Packs are validated in CI and again at application startup.

## Alternatives

1. **Content inline in components.** Rejected: makes a teacher's correction a code change, and would have made the approved revision a refactor.
2. **Headless CMS.** Rejected: requires a network and a server, violating REQ-TECH-001 and REQ-NF-003.
3. **Markdown files parsed at build time.** Reasonable for prose, insufficient for structured data like slot maps, tolerances and keys. Could still be used for long-form text fields.

## Consequences

### Positive

- A teacher can change a resistor value, a load current, a question or a threshold without a developer.
- Undecided values ([[Stage-2-PCB-Trace-Width]] tolerance, [[Assessment-Strategy]] scoring) can be represented explicitly as `null` and filled later, instead of being invented now.
- Content becomes independently testable ([[Educational-Testing]]) and independently versioned ([[Local-First-Architecture]]).

### Negative

- Schema and validation are real work up front, before any stage renders.
- A malformed pack becomes a possible startup failure — mitigated by CI validation and an explicit error state ([[UI-States]]).
- `file://` cannot reliably `fetch` JSON, so the E2 artefact must inline the pack ([[Offline-Strategy]]).

## Related

- [[Content-Architecture]] · [[Content-Inventory]] · [[Question-Bank]] · [[Application-Architecture]]
