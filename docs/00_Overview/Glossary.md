---
title: Glossary
---

# Glossary

Shared vocabulary. Indonesian source terms are kept verbatim because UI copy and content are Indonesian.

## Project and education

| Term | Meaning |
| --- | --- |
| **E-DrawLab** | The product. Full title: *E-DrawLab: Desain CAD Elektronika* |
| **Bahan ajar** | Teaching material |
| **Lab maya / Laboratorium maya** | Virtual laboratory |
| **Fase E** | Indonesian curriculum phase covering SMK grade 10 |
| **SMK** | Sekolah Menengah Kejuruan — vocational secondary school |
| **`TMR_TLEKTRO_4`** | Curriculum element code: Gambar Teknik Elektronika dan Pemodelan CAD |
| **Murid** | Student / learner |
| **Guru** | Teacher |
| **LKPD-D** | Lembar Kerja Peserta Didik Digital — digital student worksheet, handed out by the teacher |
| **Pertanyaan pemantik** | Trigger question opening the lesson |
| **Studi kasus** | Case study |
| **Panduan aturan** | Rules/standards guide screen |
| **Soal / Kunci / Pembahasan** | Question / answer key / worked explanation |

## Drawing standards

| Term | Meaning |
| --- | --- |
| **Gambar teknik** | Technical drawing |
| **Etiket** | Title block — the identity table in the lower-right corner of a drawing sheet |
| **Kolom nama** | Synonym for etiket used in the proposal |
| **Garis tepi** | Sheet border frame |
| **Skala** | Drawing scale, e.g. 1:1, 5:1 |
| **A4–A0** | ISO 216 paper sizes taught in the guide |
| **Ketebalan garis** | Line thickness; taught range 0.13–1.00 mm |
| **IEC / ANSI** | The two international symbol standards named by the proposal |
| **Jangka / penggaris T / penggaris segitiga / pensil teknik** | Compass / T-square / set squares / technical pencil — the manual instruments in the guide |

## PCB and electronics

| Term | Meaning |
| --- | --- |
| **PCB** | Printed circuit board |
| **Pad / pin** | Copper landing point a component leg solders to; Scene 03 names `R1, C1, D1, T1` |
| **Trace / jalur / lintasan** | Copper conductor drawn between pads |
| **Trace width / lebar jalur** | Conductor width in mm — the Stage 2 variable |
| **Copper weight / ketebalan tembaga** | Copper foil mass per square foot: 0.5 oz (17.5 µm), 1 oz (35 µm), 2 oz (70 µm) |
| **Faktor pengali praktis** | Practical multiplier in mm per ampere: 2 / 1 / 0.5 for 0.5 / 1 / 2 oz |
| **DRC** | Design Rule Check — the `[PERIKSA JALUR]` validation |
| **Etching / pelarutan** | Chemical removal of unwanted copper (ferric chloride); the reason for the 0.8–1.0 mm minimum drawn width |
| **Anoda / katoda** | LED anode / cathode — polarity, validated in Stage 1 |
| **Node / titik percabangan** | Junction dot marking an electrical connection at a crossing |
| **Seri / paralel** | Series / parallel topology |

## Casing and CAD

| Term | Meaning |
| --- | --- |
| **Casing / kemasan / sasis** | Enclosure |
| **`L_in`, `W_in`, `H_in`** | Internal casing length, width, height |
| **`L_out`, `W_out`, `H_out`** | External casing dimensions |
| **Clearance / celah bebas** | Safety gap per side, 1–2 mm typical |
| **Standoff / pilar dudukan** | Pillar the board is screwed onto, 3–5 mm typical |
| **`H_komponen`** | Height of the tallest component (elco, relay, heatsink) |
| **Wall thickness / tebal dinding** | Shell wall, added twice per dimension |
| **Orbit** | Rotating the 3D viewpoint by dragging |

## Product mechanics

| Term | Meaning |
| --- | --- |
| **Stage** | One of the three experiment activities |
| **Scene** | One of the five storyboard screens |
| **Immediate Dynamic Feedback** | The named mechanic: an invalid action produces an instant visual consequence |
| **Standardisasi Meter** | Stability bar starting at 100%, reduced 20% per invalid action |
| **`[UJI KECOCOKAN]`** | Stage 3 fit-test button |
| **`[PERIKSA JALUR]`** | Stage 2 DRC button |
| **`[DESAIN ULANG]`** | Reset-and-restart button on the results screen |
| **EXPERT CAD DESIGNER** | The awarded badge |

## Technical

| Term | Meaning |
| --- | --- |
| **SPA** | Single Page Application — stated architecture in the storyboard |
| **PWA** | Progressive Web App — installable, service-worker backed |
| **Service worker** | Background script that serves cached responses; see [[PWA-Architecture]] |
| **Local-first** | Local data is the primary copy; the network is an optional enhancement. See [[Local-First-Architecture]] |
| **App shell** | Minimal HTML/CSS/JS to render the UI frame before content loads |
| **`file://` bundle** | The copied-folder distribution used on lab computers; no service worker available |
| **Content pack** | Versioned bundle of stage material, questions and media manifest |

## Related

- [[Project-Overview]] · [[Content-Architecture]] · [[Curriculum]]
