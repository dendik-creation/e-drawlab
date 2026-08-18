---
title: "Stage 1 — Standardisasi Skema Manual"
stage: 1
scene: "02"
---

# Stage 1 — Standardisasi Skema Manual

Authoritative content for Stage 1. Screen behaviour: [[Scene-02-Stage-1-Schematic]]. Items: [[Question-Bank]] §Stage 1.

## Standards reference (also used by the Panduan Aturan overlay)

> Source: Approved Proposal — Sections `IDENTITAS BAHAN AJAR`, `STORYBOARD` Scene 01

| Topic | Values stated |
| --- | --- |
| Paper sizes | A4 – A0 reference table |
| Line thickness | 0.13 mm – 1.00 mm standard specification |
| Etiket | Title-block column format in the lower-right corner, filled from project text data |
| Manual instruments | Jangka, penggaris T, sepasang penggaris segitiga, pensil teknik — each with a function pop-up |
| Symbol standard | IEC / ANSI |

The proposal gives the *ranges*, not the per-line-type assignment (which weight for outlines, dimensions, hidden lines). Filling that table is a content task — [[Open-Questions]].

## Circuits — authoritative content

> Source: Approved Revision — Section `STAGE 1`. Supersedes the generic "skema catu daya" of the main proposal (REQ-EDU-009, [[Proposal-Comparison]] CH-01).

### C1 — Rangkaian LED sederhana

| Parameter | Value |
| --- | --- |
| Source | Baterai 5 V |
| Resistor | `R1` = 220 Ω |
| Voltage drop across R1 | 3.5 V |
| LED working voltage | 1.5 V at the anode |
| Path | `+ battery → R1 → LED anode → LED cathode → − battery` |

Verbatim explanation: "Pada rangkaian tertutup diatas, arus listrik mengalir dari + baterai 5V menuju resistor R1 ( 220Ω ). resistor menurunkan tegangan sebesar 3,5V sehingga LED mendapatkan tegangan kerja 1,5V pada kaki anoda LED. Arus membuat LED menyala, lalu arus keluar melalui kaki katoda LED dan kembali ke - baterai."

### C2 — Rangkaian 2 LED seri

| Parameter | Value |
| --- | --- |
| Source | Baterai 5 V |
| Resistor | `R1` = 100 Ω |
| Voltage drop across R1 | 2 V |
| Remaining working voltage | 3 V across both LEDs |
| Path | `+ battery → R1 → LED1 → LED2 → − battery` |

Drawing signature the learner must produce: both LEDs on **one single line/path**; LED1 cathode connects directly to LED2 anode. A break anywhere between them extinguishes both.

### C3 — Rangkaian 2 LED paralel

| Parameter | Value |
| --- | --- |
| Source | Baterai 5 V |
| Resistors | `R1` = `R2` = 220 Ω, **one per branch** |
| Voltage drop per branch | 3.5 V |
| LED working voltage | 1.5 V each |
| Path | `+ battery → node → (R1 → LED1) ‖ (R2 → LED2) → node → − battery` |

Drawing signature: two parallel branches; a junction dot (node) at each split/merge means *electrically connected*, distinguishing it from a crossing without a dot.

## Component library implied by this content

> Source: Engineering Decision, derived from the circuits above + Approved Proposal Scene 02

Required symbols: battery / voltage source, resistor, LED (polarised — anode and cathode distinguishable), wire, junction node. The main proposal's Scene 02 also names Resistor, Kapasitor, Transistor, Diode in the library rack, and Scene 03 shows pads `R1, C1, D1, T1`. The library therefore contains distractor symbols the LED circuits do not need — which is pedagogically deliberate (symbol identification is LO-2) and matches Stage 1 item 1, whose distractors are LED vs resistor vs battery.

Open point: whether Scene 03's `C1`/`T1` pads survive, given the revision's circuits have no capacitor or transistor. See [[Stage-2-PCB-Trace-Width]] and [[Open-Questions]].

## Validation rules

| Rule | Consequence on violation | Source |
| --- | --- | --- |
| Symbol placed at a topologically valid coordinate | Locks permanently, `pencil_draw.wav`, +20 points | Main §Scene 02 |
| LED placed with correct polarity (not reversed) | Red flash, `buzz.wav`, meter −20%, educational warning text | Main §Scene 02 |
| Etiket scale valid for the sheet (e.g. 5:1 rejected on A4) | Red flash, `buzz.wav`, meter −20% | Main §Scene 02 |
| Series task: single path, LED1 cathode → LED2 anode | Invalid topology | Revision §Stage 1 |
| Parallel task: one resistor per branch, junction dots at split and merge | Invalid topology | Revision §Stage 1 |
| All placements valid | Forward button unlocks | Main §Scene 02 |

Feedback choreography: [[Feedback-Model]].

## Related

- [[Curriculum]] · [[Learning-Objectives]] (LO-1, LO-2) · [[Question-Bank]]
- [[Scene-02-Stage-1-Schematic]] · [[Content-Architecture]]
