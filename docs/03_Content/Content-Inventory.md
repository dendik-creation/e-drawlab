---
title: Content Inventory
---

# Content Inventory

What content exists, what is missing, and who owns it. The *technical* content model (schema, loading, versioning) lives once in [[Content-Architecture]] — this note is the register.

## Status legend

`Specified` — values exist in an approved document · `Partial` — some values exist · `Missing` — must be authored

## Learning content

| Item | Status | Source | Owner | Note |
| --- | --- | --- | --- | --- |
| Standards guide — paper sizes A4–A0 | Partial | Main §Scene 01 | Teacher | Range named; the actual table values must be authored |
| Standards guide — line thickness | Partial | Main §Scene 01 | Teacher | Range 0.13–1.00 mm given; per-line-type assignment missing |
| Standards guide — etiket format | Partial | Main §Scene 01 | Teacher | Structure named; field list missing |
| Manual instrument descriptions ×4 | Missing | Main §Scene 01 | Teacher | Icons named; explanation text unwritten |
| Studi Kasus narrative | Missing | Main §Alur | Teacher | Subject given: assembly failure from tolerance miscalculation |
| Stage 1 — circuit C1 (1 LED) | Specified | Revision §Stage 1 | — | [[Stage-1-Schematic-Standards]] |
| Stage 1 — circuit C2 (2 LED seri) | Specified | Revision §Stage 1 | — | |
| Stage 1 — circuit C3 (2 LED paralel) | Specified | Revision §Stage 1 | — | |
| Stage 1 — slot maps per circuit | Missing | — | Build + teacher | Needed by [[Feature-Schematic-Workbench]] |
| Stage 2 — copper-weight table | Specified | Revision §Stage 2 | — | [[Stage-2-PCB-Trace-Width]] |
| Stage 2 — exercise loads (5/6/10 A) | Specified | Revision §Stage 2 | — | |
| Stage 2 — board/pad layout | Partial | Main §Scene 03 | Build + teacher | Pads `R1, C1, D1, T1` named; coordinates missing |
| Stage 3 — dimension formulas | Specified* | Revision §Stage 3 | — | *Re-derived; verify against source images |
| Stage 3 — task boards | Partial | Both | Teacher | Conflicting boards — [[Stage-3-Casing-Dimensions]] |
| Assessment items ×18 | Specified | Revision | — | [[Question-Bank]] |
| Closing reflective items ×3 | Partial | Main §Scene 05 | Teacher | Answers given, stems missing |
| Failure explanation texts | Missing | — | Teacher | One per failure mode — [[Feedback-Model]] |
| Scoring configuration | Missing | — | Teacher | [[Assessment-Strategy]] |

## Media

See [[Media-Asset-Register]] for the full named asset list from the storyboard. Summary: 5 background illustrations, ~12 SFX, 3 music tracks, 3 ambience loops, instrument and component icon sets, badge/medal art. **None produced yet.**

## Localisation

All content is Indonesian, matching the source and the audience. No translation is requested by either document. The content schema keeps text in data files, so a future locale is a content pack swap rather than a code change — but multi-language UI is out of [[Scope]].

## Attribution and licensing

> Source: Approved Proposal — Scenes 01, 05

- Final screen carries a CC-BY-NC-SA attribution line (REQ-F-026).
- Home screen carries an asset-licence info icon.
- Storyboard visuals are marked "Sumber: gemini ai" and "Sumber: canva ai" — generated reference art, not necessarily final assets.
- Front page must carry no developer identity (REQ-NF-007).

Open licensing questions: whether AI-generated reference art can be redistributed under CC-BY-NC-SA, and what the attribution line must name. Legal/administrative, not technical — [[Open-Questions]].

## Related

- [[Content-Architecture]] · [[Media-Asset-Register]] · [[Question-Bank]] · [[Roadmap]]
