# ADR-008 — No accounts, device-local progress

## Status

Proposed

## Context

Neither approved document asks for login, learner identification, class rosters, cloud storage or LMS grade integration. The lesson plan has the teacher distributing a file and collecting results through presentation and the LKPD-D worksheet — not through the application.

The usage model is 3–4 students sharing one lab computer (REQ-EDU-020), often offline (REQ-NF-003), on machines the project does not administer.

Adding accounts would require a server, breaking REQ-TECH-001, and would place minors' personal data into a system with no operator, no policy and no custodian.

## Decision

No accounts, no authentication, no personal data, no telemetry (REQ-NF-011). Progress is a single anonymous record per browser profile per device ([[Data-Architecture]]), identified by a random local `runId` that leaves the device never.

Optional remote synchronisation (REQ-PWA-008) stays `Could` priority and unimplemented. If it is ever built, it must be explicit and opt-in, never silent ([[Local-First-Architecture]] §Synchronisation).

If the certificate carries a learner-entered name, that name is used for rendering only and is not persisted beyond the session — a shared lab machine must not accumulate students' names.

## Alternatives

1. **Accounts with a backend.** Rejected: breaks the no-server requirement, breaks offline operation, and creates a minors' data-protection obligation nobody in this project is positioned to hold.
2. **LMS/LTI integration for grade passback.** Rejected: nothing requests it; it requires a network during the graded session, which the lesson plan explicitly does not have.
3. **Local named profiles ("who is using this machine?").** Rejected for now: it collects personal data with no consent mechanism, for a group score that is not individually attributable anyway.

## Consequences

### Positive

- No server, no personal data, no compliance surface, no operational burden.
- Fully offline operation is structurally guaranteed rather than engineered around.
- Reset semantics are simple and complete ([[Feature-Scoring-and-Progress]]).

### Negative

- Progress does not follow a learner between home and lab, or between machines ([[Offline-Strategy]]).
- A teacher cannot see class-wide results in the application; assessment evidence stays with the LKPD-D and the group presentation, as the proposal already describes.
- Scores are group-attributable at best — stated explicitly in [[Assessment-Strategy]] so nobody treats them as individual records.

## Related

- [[Local-First-Architecture]] · [[Data-Architecture]] · [[Non-Functional-Requirements]] · [[Assessment-Strategy]]
