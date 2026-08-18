---
title: Requirements Matrix
status: Baseline v1
---

# Requirements Matrix

Single source of truth for requirement IDs. Every other note references IDs; none of them restate requirement text.

**Source vocabulary**

| Label | Meaning |
| --- | --- |
| `Main §X` | [[Proposal-Main]], named section of `TMR_TLEKTRO_4_Proposal_Gambar Teknik Elektronika_ok.docx` |
| `Revision §X` | [[Proposal-Revision]], named section of `Revisi Materi_TE.docx` |
| `Project Brief` | Constraints supplied by the documentation task itself (web, local-first, PWA, offline, responsive, landscape, deployable online, one codebase) |
| `Engineering Decision` | Derived by the team; traceable to an ADR in [[Decisions-Index]] |

**Priority**: MoSCoW. **Status**: `Planned` everywhere — no application code exists yet (see [[Roadmap]]).

## EDU — Educational requirements

| ID | Requirement | Source | Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-EDU-001 | Target learner is an SMK Kelas X student, Fase E, Teknik Elektronika program | Main §Identitas | Must | Planned |
| REQ-EDU-002 | Material covers element `TMR_TLEKTRO_4` — Gambar Teknik Elektronika dan Pemodelan CAD | Main §Identitas | Must | Planned |
| REQ-EDU-003 | Teach electronics drawing standards: paper sizes A4–A0, line thickness 0.13–1.00 mm, etiket/title block | Main §Identitas, §Storyboard Scene 01 | Must | Planned |
| REQ-EDU-004 | Introduce manual drawing instruments (jangka, penggaris T, penggaris segitiga, pensil teknik) with per-icon explanation | Main §Identitas, Scene 01 | Must | Planned |
| REQ-EDU-005 | Teach IEC/ANSI international component and circuit symbols | Main §Identitas | Must | Planned |
| REQ-EDU-006 | Teach schematic and PCB layout procedure, both manual and software-assisted | Main §Identitas | Must | Planned |
| REQ-EDU-007 | Teach product casing/enclosure design procedure with CAD software | Main §Identitas | Must | Planned |
| REQ-EDU-008 | Learning is organised as three sequential experiment stages | Main §Deskripsi | Must | Planned |
| REQ-EDU-009 | Stage 1 subject matter is three LED circuits: single LED (5 V, R1 220 Ω), 2 LED series (R1 100 Ω), 2 LED parallel (R1=R2 220 Ω), each with its stated current path | Revision §Stage 1 — supersedes the generic power-supply schematic in Main §Alur | Must | Planned |
| REQ-EDU-010 | Stage 2 subject matter is the copper-weight trace-width model: `width = current × factor`, factors 2 / 1 / 0.5 mm per A for 0.5 / 1 / 2 oz | Revision §Stage 2 — supersedes the flat "≥ 0.3 mm" rule in Main §Rencana | Must | Planned |
| REQ-EDU-011 | Stage 2 also teaches the etch-safety floor: signal traces drawn at minimum 0.8–1.0 mm regardless of computed width | Revision §Stage 2 (teacher key) | Must | Planned |
| REQ-EDU-012 | Stage 3 subject matter is the four-variable casing model (PCB size, tallest component, standoff, clearance) with internal/external dimension formulas | Revision §Stage 3 — supersedes "casing ≥ PCB" in Main §Storyboard Scene 04 | Must | Planned |
| REQ-EDU-013 | Deliver the 18 revision multiple-choice items with their keys, attached to their stage | Revision §Stage 1/2/3 | Must | Planned |
| REQ-EDU-014 | Deliver a closing reflective quiz of 3 items on industrial manufacturing tolerance (±0.1 mm, 45°, functional conformity) | Main §Storyboard Scene 05 | Must | Planned |
| REQ-EDU-015 | Every learner action receives Immediate Dynamic Feedback with a *visual consequence*, not only a verdict | Main §Deskripsi, §Rencana | Must | Planned |
| REQ-EDU-016 | Report a formative score broken down per competency (Standardisasi Skema, PCB Layout, 3D Casing, Evaluasi Kuis) | Main §Storyboard Scene 05 | Must | Planned |
| REQ-EDU-017 | Award the "EXPERT CAD DESIGNER" badge/medal and a downloadable completion certificate | Main §Storyboard Scene 05, §Rencana | Should | Planned |
| REQ-EDU-018 | The digital experience is a pre-requisite gate before physical assembly in the school workshop | Main §Rencana | Must | Planned |
| REQ-EDU-019 | Support the lesson plan shape: asynchronous pre-learning at home, then 15 / 45 / 30 minute synchronous phases | Main §Rencana | Must | Planned |
| REQ-EDU-020 | Support guided group work — 3–4 students sharing one lab computer | Main §Rencana | Should | Planned |
| REQ-EDU-021 | Teacher-facing answer keys and worked explanations exist as material, separated from learner-visible content | Revision §Kunci Jawaban & Pembahasan untuk Guru | Should | Planned |
| REQ-EDU-022 | The guide (Panduan Aturan) is usable standalone at home, before any stage is attempted | Main §Rencana | Must | Planned |

## F — Functional requirements

| ID | Requirement | Source | Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-F-001 | Application is a Single Page Application; no external page reload for any navigation, including the post-quiz reset | Main §Storyboard Scene 01, Scene 05 | Must | Planned |
| REQ-F-002 | Home screen offers three entries: Studi Kasus, Panduan Aturan & Standardisasi, Masuk Lab Maya | Main §Alur | Must | Planned |
| REQ-F-003 | Guide overlay panel shows paper-size table A4–A0, line-thickness spec 0.13–1.00 mm, etiket format, and manual-instrument icons; clicking an icon opens a function pop-up | Main §Alur, Scene 01 | Must | Planned |
| REQ-F-004 | Studi Kasus screen presents the trigger case: assembly failure caused by a dimensional-tolerance miscalculation | Main §Alur | Must | Planned |
| REQ-F-005 | Stage 1 provides an empty framed A4 sheet plus a component library, with drag & drop placement of symbols | Main §Alur, Scene 02 | Must | Planned |
| REQ-F-006 | Stage 1 validates etiket data entry, including drawing scale (e.g. rejecting 5:1 on A4) | Main §Storyboard Scene 02 | Must | Planned |
| REQ-F-007 | Stage 1 validates circuit topology and component polarity; a valid drop locks the symbol permanently and scores +20 | Main §Storyboard Scene 02; topology per REQ-EDU-009 | Must | Planned |
| REQ-F-008 | Stage 2 provides a trace-width slider showing live millimetre value | Main §Alur, Scene 03 | Must | Planned |
| REQ-F-009 | Stage 2 exposes copper weight (0.5 / 1 / 2 oz) and load current as task inputs to the width calculation | Revision §Stage 2 | Must | Planned |
| REQ-F-010 | Stage 2 supports drag routing between component pads with a 45° corner rule | Main §Alur, Scene 03 | Must | Planned |
| REQ-F-011 | Stage 2 provides a `[PERIKSA JALUR]` action running a Design Rule Check and reporting pass/fail | Main §Storyboard Scene 03 | Must | Planned |
| REQ-F-012 | Stage 3 provides three dimension sliders (Panjang, Lebar, Tinggi) driving the 3D casing model in real time | Main §Alur, Scene 04 | Must | Planned |
| REQ-F-013 | Stage 3 model auto-rotates, and supports manual click-drag orbit | Main §Storyboard Scene 04 | Must | Planned |
| REQ-F-014 | Stage 3 provides `[UJI KECOCOKAN]` validating fit against the derived dimensions | Main §Storyboard Scene 04; formulas per REQ-EDU-012 | Must | Planned |
| REQ-F-015 | Failure states play their specified consequence animation: red screen flash (Stage 1), burning/broken copper trace (Stage 2), PCB colliding with the wall until the casing cracks (Stage 3) | Main §Deskripsi, Scenes 02–04 | Must | Planned |
| REQ-F-016 | A "Standardisasi Meter" stability bar starts at 100% and is reduced 20% per invalid action | Main §Storyboard Scene 01, Scene 02 | Must | Planned |
| REQ-F-017 | Score engine: +20 per valid Stage-1 placement; final per-competency breakdown and total out of 100 | Main §Storyboard Scene 02, Scene 05 | Must | Planned |
| REQ-F-018 | A structured step-progress indicator is visible throughout ("Langkah N dari 4") | Main §Deskripsi, Scenes 01–04 | Must | Planned |
| REQ-F-019 | Results dashboard shows total score, star rating, badge, and the per-competency table | Main §Storyboard Scene 05 | Must | Planned |
| REQ-F-020 | Quiz component: 3-option multiple choice, locks the answer, shows a green check for a valid answer | Main §Storyboard Scene 05; items per REQ-EDU-013/014 | Must | Planned |
| REQ-F-021 | Certificate for "Expert CAD Designer" is downloadable at the end | Main §Rencana | Should | Planned |
| REQ-F-022 | `[DESAIN ULANG]` clears the log, resets the score and returns to Scene 01 instantly, without reloading the application | Main §Storyboard Scene 05 | Must | Planned |
| REQ-F-023 | Audio layers: SFX, looping music, ambience, at the specified relative volumes (menu music 15%, ducked to 10–12% in stages, ambience 5–6%) | Main §Storyboard Scenes 01–05 | Should | Planned |
| REQ-F-024 | Hover feedback: button scale +5%, neon colour shift, hover SFX; outline glow on component symbols; trace-pen cursor over the PCB area | Main §Storyboard Scenes 01–03 | Should | Planned |
| REQ-F-025 | Vertical scroll/swipe inside the guide panel and the results quiz panel | Main §Storyboard Scene 01, Scene 05 | Should | Planned |
| REQ-F-026 | CC-BY-NC-SA attribution line on the final screen plus an asset-licence info icon on the home screen | Main §Storyboard Scene 01, Scene 05 | Must | Planned |
| REQ-F-027 | Results screen shows the comparison curve chart for trace-temperature impact | Main §Alur | Could | Planned |
| REQ-F-028 | Cold start: all home elements fade in together over 0.5 s, with no opening video | Main §Storyboard Scene 01 | Must | Planned |
| REQ-F-029 | Stage 2 → Stage 3 carries the produced board forward as the PCB to be enclosed | Main §Alur (Langkah 3), Scene 04 | Must | Planned |

## NF — Non-functional requirements

| ID | Requirement | Source | Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-NF-001 | Total offline application size < 25 MB | Main §Deskripsi | Must | Planned |
| REQ-NF-002 | Designed at a 16×9 aspect ratio | Main §Deskripsi, Scene 01 | Must | Planned |
| REQ-NF-003 | Runnable from a distributed file set opened as `index.html` on a school lab computer, without internet | Main §Rencana | Must | Planned |
| REQ-NF-004 | Instant home load — no blocking splash, no opening video | Main §Storyboard Scene 01 | Must | Planned |
| REQ-NF-005 | Slider-driven values and 3D geometry update in real time as the learner drags | Main §Alur, Scenes 03–04 | Must | Planned |
| REQ-NF-006 | Must run on school laboratory desktop hardware and on student devices ("gawai") used for swipe interaction | Main §Rencana, Scene 01/05 | Must | Planned |
| REQ-NF-007 | Front page carries no developer or personal identity | Main §Storyboard Scene 01, Scene 05 | Must | Planned |
| REQ-NF-008 | Responsive layout | Project Brief | Must | Planned |
| REQ-NF-009 | Landscape-first design | Project Brief | Must | Planned |
| REQ-NF-010 | One codebase serves both online deployment and offline usage | Project Brief | Must | Planned |
| REQ-NF-011 | No account, no login, no personal data leaves the device | Engineering Decision — [[ADR-008-No-Accounts-Device-Local-Progress]] | Must | Planned |
| REQ-NF-012 | Educational content is authored and versioned independently of application code | Engineering Decision — [[ADR-003-Content-As-Data]] | Must | Planned |
| REQ-NF-013 | Accessibility baseline (contrast, focus order, non-colour-only error signalling); target conformance level not yet fixed | Engineering Decision — [[Accessibility]] | Should | Planned |

## PWA — PWA and offline requirements

| ID | Requirement | Source | Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-PWA-001 | Installable as a PWA from a hosted deployment | Project Brief | Must | Planned |
| REQ-PWA-002 | Fully usable offline after first installation/synchronisation — every stage, asset and question available | Project Brief; consistent with Main §Rencana | Must | Planned |
| REQ-PWA-003 | Service worker precaches the application shell at install time | Project Brief → [[PWA-Architecture]] | Must | Planned |
| REQ-PWA-004 | All learning content and media required for the three stages are cached, not lazily fetched at stage entry | Project Brief; REQ-EDU-008 | Must | Planned |
| REQ-PWA-005 | Explicit versioning and an update strategy for shell and content caches, with a user-visible "update available" path | Engineering Decision — [[PWA-Architecture]] | Must | Planned |
| REQ-PWA-006 | Online/offline status is detected and surfaced in the UI | Engineering Decision — [[UI-States]] | Should | Planned |
| REQ-PWA-007 | Learner progress and scores persist locally across reloads and across offline sessions | Engineering Decision — [[Local-First-Architecture]] | Must | Planned |
| REQ-PWA-008 | Remote synchronisation of progress is optional and non-blocking; the app is fully functional with it disabled | Engineering Decision — [[ADR-008-No-Accounts-Device-Local-Progress]] | Could | Proposed |
| REQ-PWA-009 | Total cached footprint stays within the < 25 MB budget of REQ-NF-001 so it fits comfortably in browser storage quota | Main §Deskripsi + Engineering Decision | Must | Planned |
| REQ-PWA-010 | A `file://` distribution variant exists for lab computers, alongside the hosted PWA | Main §Rencana + Project Brief — [[ADR-005-Dual-Distribution]] | Must | Proposed |

## UX — UX requirements

| ID | Requirement | Source | Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-UX-001 | Landscape-first layout with an explicit portrait guard on small screens | Project Brief + REQ-NF-002 | Must | Planned |
| REQ-UX-002 | Home navigation is non-linear — the guide is reachable at any time without losing stage state | Main §Storyboard Scene 01 | Must | Planned |
| REQ-UX-003 | Drag & drop, routing and sliders work with both mouse and touch | Main §Storyboard (gawai swipe) + Project Brief | Must | Planned |
| REQ-UX-004 | Keyboard alternative for every pointer-only mechanic (drag, routing, orbit, sliders) | Engineering Decision — [[Accessibility]] | Should | Planned |
| REQ-UX-005 | Loading, offline, error and success states are designed, not default browser behaviour | Engineering Decision — [[UI-States]] | Must | Planned |
| REQ-UX-006 | Audio has a visible mute/volume control | Engineering Decision — REQ-F-023 ships autoplaying loops | Must | Planned |
| REQ-UX-007 | Failure feedback is never colour-only; it pairs visual, textual and audio channels | Main §Storyboard + [[Accessibility]] | Should | Planned |

## TECH — Technical requirements

| ID | Requirement | Source | Priority | Status |
| --- | --- | --- | --- | --- |
| REQ-TECH-001 | Client-only architecture; no server runtime required for any learning function | Main §Rencana (offline `index.html`) | Must | Planned |
| REQ-TECH-002 | Content is data (schema-validated), loaded by a content service, never hard-coded in components | Engineering Decision — [[ADR-003-Content-As-Data]] | Must | Planned |
| REQ-TECH-003 | All asset references are relative so the same build works from `file://` and from a web origin | Engineering Decision — [[ADR-005-Dual-Distribution]] | Must | Planned |
| REQ-TECH-004 | 3D casing rendering approach | Engineering Decision — **To Be Decided**, [[ADR-006-3D-Rendering-Approach]] | Must | Proposed |
| REQ-TECH-005 | Scoring and validation are deterministic and unit-testable, independent of rendering | Engineering Decision — [[Application-Architecture]] | Must | Planned |
| REQ-TECH-006 | Deployable as static files to any static host | Project Brief — [[Deployment-Architecture]] | Must | Planned |
| REQ-TECH-007 | Frontend stack | Engineering Decision — **To Be Decided**, [[ADR-002-Frontend-Stack]] | Must | Proposed |

## Counts

| Category | Count |
| --- | --- |
| EDU | 22 |
| F | 29 |
| NF | 13 |
| PWA | 10 |
| UX | 7 |
| TECH | 7 |
| **Total** | **88** |

Source split by *primary* source: 64 traced to the approved documents (EDU 22, F 29, NF 7, PWA 2, UX 3, TECH 1), 15 to Engineering Decision, 9 to Project Brief. Several rows cite a second, supporting source.

## Related

- [[Proposal-Comparison]]
- [[Requirements]]
- [[Roadmap]]
- [[Open-Questions]]
