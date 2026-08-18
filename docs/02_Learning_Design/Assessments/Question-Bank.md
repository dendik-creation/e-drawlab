---
title: Question Bank
---

# Question Bank

Complete transcription of every assessment item in the approved documents. This is the **single source** for item text; the content pack in [[Content-Architecture]] is generated from it.

Item ID scheme: `Q-S<stage>-<n>` for stage items, `Q-R-<n>` for the closing reflective items.

> ⚠️ Keys below are teacher material (REQ-EDU-021). See [[Proposal-Comparison]] CH-05 before shipping them inside the client bundle.

## Stage 1 — 9 items

> Source: Approved Revision — Section `STAGE 1`

### Circuit C1 — LED sederhana

**Q-S1-01** — Gambar R1 adalah simbol dari komponen ….
A. LED (Light Emitting Diode) · B. Resistor · C. Baterai / Sumber Tegangan — **Key: B**

**Q-S1-02** — Bagaimana urutan penyambungan jalurnya ….
A. Kutub (+) Baterai - Resistor R1 - Anoda LED - Katoda LED - Kutub (-) Baterai
B. Kutub (+) Baterai - Katoda LED - Anoda LED - Resistor R1 - Kutub (-) Baterai
C. Kutub (+) Baterai - Anoda LED - Resistor R1 - Katoda LED - Kutub (-) Baterai — **Key: A**

**Q-S1-03** — Simbol LED pada gambar skema ditandai dengan gambar dioda yang dilengkapi dengan simbol …
A. Garis gelombang di dalam lingkaran · B. Dua anak panah yang mengarah ke luar · C. Tanda tambah (+) dan minus (-) di atasnya — **Key: B**

### Circuit C2 — 2 LED seri

**Q-S1-04** — Ciri utama dari penggambaran Rangkaian 2 LED Seri pada gambar teknik adalah...
A. Komponen LED1 dan LED2 digambar berjejer pada satu garis jalur tunggal
B. Komponen LED1 dan LED2 digambar sejajar bercabang dengan dua jalur terpisah
C. Komponen LED2 digambar langsung terhubung ke baterai tanpa melewati resistor — **Key: A**

**Q-S1-05** — Pada gambar skema 2 LED seri, kaki katoda dari LED1 dihubungkan langsung ke...
A. Kutub positif (+) baterai · B. Kaki anoda dari LED2 · C. Kaki katoda dari LED2 — **Key: B**

**Q-S1-06** — Jika seorang siswa menggambar jalur yang terputus (tidak menyambung) di antara LED1 dan LED2 pada skema seri, apa dampaknya secara fungsi rangkaian?
A. LED1 tetap menyala, tetapi LED2 padam
B. LED2 tetap menyala, tetapi LED1 padam
C. Seluruh aliran listrik terputus sehingga kedua LED tidak dapat menyala — **Key: C**

### Circuit C3 — 2 LED paralel

**Q-S1-07** — Pada gambar skema 2 LED paralel, simbol berupa titik tebal/bulat (node) pada persimpangan garis jalur berfungsi untuk menandakan bahwa...
A. Jalur kawat tersebut saling bersilangan tetapi tidak terhubung
B. Jalur kawat tersebut terhubung/terambung secara listrik (titik percabangan)
C. Komponen pada jalur tersebut mengalami kerusakan — **Key: B**

**Q-S1-08** — Perbedaan visual yang paling menonjol antara gambar skema 2 LED seri dan 2 LED paralel adalah...
A. Rangkaian paralel memiliki beberapa jalur cabang yang sejajar, sedangkan seri hanya satu jalur lurus
B. Rangkaian paralel tidak memerlukan garis hubungan ke kutub negatif baterai
C. Rangkaian seri menggunakan dua buah baterai, sedangkan paralel hanya satu — **Key: A**

**Q-S1-09** — Pada gambar skema 2 LED paralel yang standar dan benar, posisi pemasangan resistor yang tepat adalah...
A. Dipasang satu buah saja di dekat baterai sebelum percabangan
B. Dipasang masing-masing satu buah (R1 dan R2) di setiap cabang jalur LED
C. Dipasang setelah kaki katoda kedua LED menyatu — **Key: B**

## Stage 2 — 3 items

> Source: Approved Revision — Section `STAGE 2`, `SOAL EVALUASI GAMBAR TEKNIK PCB`

**Q-S2-01** — *Penentuan jalur daya pada PCB 1 oz.* A student designs a layout for a 12 V / 60 W portable water heater on standard 1 oz (35 µm) copper-clad board. What main copper trace width must be drawn?
A. 2,5 mm · B. 5,0 mm · C. 10,0 mm — **Key: B**
Working: `60 W / 12 V = 5 A`; 1 oz → 1 mm/A; `5 × 1 = 5,0 mm`.

**Q-S2-02** — *Efisiensi layout pada PCB 2 oz.* A robotics motor-driver circuit carries an 8 A peak. Board spec changes from 1 oz to 2 oz (70 µm). What trace-width saving results?
A. Hemat 2,0 mm (dari 8,0 mm menjadi 6,0 mm)
B. Hemat 4,0 mm (dari 8,0 mm menjadi 4,0 mm)
C. Hemat 8,0 mm (dari 16,0 mm menjadi 8,0 mm) — **Key: B**
Working: 1 oz → `8 × 1 = 8,0 mm`; 2 oz → `8 × 0,5 = 4,0 mm`; saving 4,0 mm.

**Q-S2-03** — *Jalur daya vs. jalur sinyal pada PCB 0,5 oz.* A precision sensor module on 0.5 oz (17.5 µm) copper has a 1 A power trace and a 0.05 A signal trace. What power-trace width is required, and how should the signal trace be drawn?
A. Jalur daya 1,0 mm, jalur sinyal 0,05 mm
B. Jalur daya 2,0 mm, jalur sinyal minimal 0,8 mm – 1,0 mm agar tidak mudah terputus saat proses pelarutan (etching)
C. Kedua jalur digambar sama persis 2,0 mm — **Key: B**
Teacher explanation (verbatim intent): 0.5 oz needs 2 mm/A, so `1 A × 2 = 2,0 mm`. Although 0.05 A theoretically needs a microscopic 0.1 mm, manual PCB drawing sets a safe minimum of 0.8–1.0 mm so the trace is not eaten by ferric chloride.

## Stage 3 — 6 items

> Source: Approved Revision — Section `STAGE 3` (3 items) and `SOAL EVALUASI TAMBAHAN: DESAIN CASING PCB` (3 supplementary items)

**Q-S3-01** — PCB 60 mm × 40 mm, clearance 1,5 mm per side. `L_in` and `W_in`?
A. 61,5 & 41,5 · B. 63,0 & 43,0 · C. 66,0 & 46,0 — **Key: B**
Working: clearance is added on both sides — `60 + 1,5 + 1,5 = 63`; `40 + 1,5 + 1,5 = 43`.

**Q-S3-02** — PCB 1,6 mm thick, tallest component (elco) 18 mm, standoff 5 mm, top clearance 2,4 mm. Minimum `H_in`?
A. 22,0 · B. 25,0 · C. 27,0 — **Key: C**
Working: `5 + 1,6 + 18 + 2,4 = 27,0 mm`.

**Q-S3-03** — Internal 80 × 50 × 30 mm, wall thickness 2 mm. External `L_out × W_out × H_out`?
A. 82×52×32 · B. 84×54×34 · C. 88×58×38 — **Key: B**
Working: each dimension `+ 2 × 2 mm`.

**Q-S3-04** *(supplementary)* — PCB 75 mm × 45 mm, clearance 2,0 mm per side. `L_in` and `W_in`?
A. 77,0 × 47,0 · B. 79,0 × 49,0 · C. 83,0 × 53,0 — **Key: B**
Distractor note from the teacher key: "Jebakan A terjadi jika siswa lupa mengalikan celah dengan 2 sisi."

**Q-S3-05** *(supplementary)* — `H_in` = 23,0 mm, standoff 4,0 mm, PCB 1,5 mm, relay module 15,0 mm. Remaining top clearance?
A. 1,5 · B. 2,5 · C. 4,0 — **Key: B**
Working: used `4,0 + 1,5 + 15,0 = 20,5`; `23,0 − 20,5 = 2,5 mm`.

**Q-S3-06** *(supplementary)* — Internal 90 × 55 × 32 mm, wall thickness 2,5 mm. External?
A. 92,5 × 57,5 × 34,5 · B. 95,0 × 60,0 × 37,0 · C. 100,0 × 65,0 × 42,0 — **Key: B**
Working: each dimension `+ 2 × 2,5 = 5,0 mm`.

## Closing reflective quiz — 3 items

> Source: Approved Proposal — Section `STORYBOARD` Scene 05

The main proposal specifies three multiple-choice items on real manufacturing dimensional tolerance and lists only their answers: **`± 0.1 mm`**, **`45°`**, **"menjamin kesesuaian fungsi"**. The question stems and distractors are **not written** in either document.

| ID | Answer given | Stem status |
| --- | --- | --- |
| Q-R-01 | ± 0,1 mm | To be authored |
| Q-R-02 | 45° | To be authored |
| Q-R-03 | Menjamin kesesuaian fungsi | To be authored |

Authoring these three stems is a content task for the subject teacher — [[Open-Questions]]. Nothing has been invented to fill them.

## Item statistics

| Set | Items | Options | Keys |
| --- | --- | --- | --- |
| Stage 1 | 9 | 3 | complete |
| Stage 2 | 3 | 3 | complete |
| Stage 3 | 6 | 3 | complete |
| Closing reflective | 3 | — | answers only, stems missing |
| **Total** | **21** | | 18 fully specified |

## Related

- [[Assessment-Strategy]] · [[Learning-Outcomes]] · [[Content-Architecture]]
- [[Stage-1-Schematic-Standards]] · [[Stage-2-PCB-Trace-Width]] · [[Stage-3-Casing-Dimensions]]
