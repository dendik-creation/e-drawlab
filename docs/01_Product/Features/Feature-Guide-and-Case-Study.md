---
title: Feature — Guide and Case Study
requirements: [REQ-F-003, REQ-F-004, REQ-EDU-003, REQ-EDU-004, REQ-EDU-022, REQ-F-025]
status: Planned
---

# Feature — Guide and Case Study

## Purpose

The two non-assessed entry points on the home screen. Both must work standalone at home, the day before class, with no stage progress (REQ-EDU-022).

## Panduan Aturan & Standardisasi — REQ-F-003

Overlay panel (dark translucent) containing:

| Block | Content | Source |
| --- | --- | --- |
| Paper size table | A4 – A0 reference | Main §Scene 01 |
| Line thickness spec | 0.13 mm – 1.00 mm | Main §Scene 01 |
| Etiket format | Title-block column layout | Main §Scene 01 |
| Instrument icons | Jangka, penggaris T, sepasang penggaris segitiga, pensil teknik | Main §Scene 01 |

Behaviour: opens without leaving home (`paper.wav`), vertically scrollable by wheel or swipe (REQ-F-025), and clicking an instrument icon opens a function pop-up. Content values live in [[Stage-1-Schematic-Standards]] §Standards reference.

Missing content: the per-line-type thickness assignment (which weight for border, object, dimension, hidden lines) is not in either document. Authoring task — [[Open-Questions]].

## Studi Kasus — REQ-F-004

Text/image presentation of a manufacturing assembly failure caused by a miscalculated dimensional tolerance, framed as the lesson's trigger question ("pertanyaan pemantik").

The case narrative itself is **not written** in either document — only its subject. Authoring task, owner: subject teacher.

Note a documentation discrepancy worth resolving: the flowchart (`ALUR INTERAKSI`) lists three home buttons — Studi Kasus, Panduan Aturan, Masuk Lab — while the Scene 01 storyboard shows only two (`btn_masuk_lab`, `btn_panduan`). Both are approved text from the same document. Resolution proposed: three buttons, following the flowchart, since the case study is load-bearing for the lesson plan. Flagged in [[Open-Questions]].

## Acceptance

1. Guide and case study are reachable and complete on a first run with no saved progress.
2. Opening and closing either one leaves stage state untouched.
3. Every instrument icon opens its explanation.

## Related

- [[Scene-01-Home-and-Guide]] · [[Navigation]] · [[Curriculum]]
