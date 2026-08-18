---
title: Proposal Revision — Structured Extract
source_file: docs/00_Raw/Revisi Materi_TE.docx
role: Later approved revision (content revision)
status: Approved — takes precedence on conflict
---

# Proposal Revision — Structured Extract

Structured extract of the later approved revision. Immutable artifact: `docs/00_Raw/Revisi Materi_TE.docx`.

## Why this is the revision

- Filename is literally `Revisi Materi_TE` (*revision of the material, Teknik Elektronika*).
- It carries **no** identity, description, flowchart, implementation-plan or storyboard sections — so it cannot stand alone as a proposal.
- Its entire body is organised as `STAGE 1` / `STAGE 2` / `STAGE 3`, which are exactly the three experiment stages defined by [[Proposal-Main]]. It replaces the *subject matter* inside those stages.
- Therefore: **scope of revision = learning content and assessment items only.** Project identity, target users, delivery model, storyboard and non-functional constraints are unchanged and still governed by [[Proposal-Main]].

Per the task's precedence rule, wherever the two documents conflict the revision wins. Conflicts are enumerated in [[Proposal-Comparison]].

## STAGE 1 — Schematic content

> Source: Approved Revision — Section `STAGE 1`

The revision replaces the generic "skema catu daya" brief with **three explicitly specified circuits**, each with a working explanation and three multiple-choice items.

### 1.1 Rangkaian LED sederhana

Current flows from the `+` terminal of a 5 V battery into `R1 (220 Ω)`; the resistor drops 3.5 V, leaving 1.5 V working voltage at the LED anode; the LED lights; current exits the cathode back to the battery `-`.

### 1.2 Rangkaian 2 LED seri

5 V battery, `R1 (100 Ω)` drops 2 V, leaving 3 V working voltage; current passes LED1 then LED2, both lighting simultaneously, then returns to battery `-`.

### 1.3 Rangkaian 2 LED paralel

5 V battery, current splits into two branches; `R1` and `R2` (`220 Ω` each) drop 3.5 V per branch, giving each LED 1.5 V; LED1 and LED2 light equally bright; the branches rejoin and return to battery `-`.

Component values, drop voltages and topology are authoritative and are transcribed to [[Stage-1-Schematic-Standards]]. Assessment items go to [[Question-Bank]].

## STAGE 2 — Trace width content

> Source: Approved Revision — Section `STAGE 2`

Replaces the main proposal's single "minimum 0.3 mm" rule with a **copper-weight-based calculation model**.

| Ketebalan tembaga (T) | Tebal (µm) | Faktor pengali praktis | Penggunaan |
| --- | --- | --- | --- |
| 0,5 oz | 17,5 | 2 mm/A | Komponen kecil |
| 1 oz | 35 | 1 mm/A | Standar umum / modul elektronik |
| 2 oz | 70 | 0,5 mm/A | Rangkaian daya tinggi (power supply, motor) |

**Prinsip dasar (verbatim):** "semakin tebal lapisan, semakin sempit lebar jalur yang dibutuhkan untuk mengalirkan arus listrik".

Working model: `trace_width_mm = current_A × factor(copper_weight)`.

Worked exercise set (12 V accu source):

| Soal | Beban | Arus |
| --- | --- | --- |
| 1 | Lampu halogen 12V/60W | 5 A |
| 2 | Modul Peltier 12V/72W | 6 A |
| 3 | Motor DC power window 12V/120W | 10 A |

Answer grid supplied by the revision:

| Arus beban | 0,5 oz (2 mm/A) | 1 oz (1 mm/A) | 2 oz (0,5 mm/A) |
| --- | --- | --- | --- |
| 5 A | 10 mm | 5 mm | 2,5 mm |
| 6 A | 12 mm | 6 mm | 3 mm |
| 10 A | 20 mm | 10 mm | 5 mm |

Additional rule stated in the teacher key: a signal trace must still be drawn **minimum 0.8–1.0 mm** regardless of its theoretical width, so it is not destroyed by the etching solution (ferric chloride).

Transcribed to [[Stage-2-PCB-Trace-Width]].

## STAGE 3 — Casing dimension content

> Source: Approved Revision — Section `STAGE 3`

Replaces the main proposal's "casing ≥ PCB" rule with a **four-variable dimensional model**.

Variables (verbatim):
- Ukuran PCB — `L_PCB × W_PCB × T_PCB`.
- Komponen tertinggi — `H_komponen` (elco, relay, heatsink).
- Pilar dudukan — `H_standoff`, typically 3–5 mm.
- Toleransi / celah bebas — `clearance`, typically 1–2 mm per side.

Formulas, reconstructed from the worked solutions (the source table headings `Ukuran Dalam Casing` / `Ukuran Luar Casing` were present but their formula rows did not carry text):

```text
L_in = L_PCB + 2 × clearance
W_in = W_PCB + 2 × clearance
H_in = H_standoff + T_PCB + H_komponen + top_clearance

L_out = L_in + 2 × wall_thickness
W_out = W_in + 2 × wall_thickness
H_out = H_in + 2 × wall_thickness
```

Verified against every worked answer in the revision (63/43 mm; 27.0 mm; 84×54×34 mm; 79/49 mm; 2.5 mm; 95×60×37 mm). Transcribed to [[Stage-3-Casing-Dimensions]].

## Assessment items added by the revision

18 multiple-choice items in total (3 options each, single key):

| Stage | Items | Keys supplied |
| --- | --- | --- |
| Stage 1 | 9 (3 per circuit) | Yes |
| Stage 2 | 3 | Yes |
| Stage 3 | 3 + 3 supplementary | Yes |

Teacher-facing sections `KUNCI JAWABAN & PEMBAHASAN UNTUK GURU` supply worked explanations, including a distractor rationale ("Jebakan A terjadi jika siswa lupa mengalikan celah dengan 2 sisi"). Full transcription: [[Question-Bank]].

## Content-integrity notes

1. The `Ukuran Dalam Casing` / `Ukuran Luar Casing` formula rows are empty in the extracted document body — the formulas above are **reconstructed from the worked answers**, not quoted. Confirm against the original file's images before content freeze — [[Open-Questions]].
2. Several supplementary Stage-3 explanations are truncated in the source ("Hitung total tinggi yang sudah terpakai…" with no arithmetic line). Answers themselves are supplied and were re-derived successfully.
3. Typos preserved: `1oz (35m)` (should be 35 µm), `Motor DC Poer Windows`, `Hn` for `H_in`.

## Related

- [[Proposal-Main]]
- [[Proposal-Comparison]]
- [[Requirements-Matrix]]
- [[Curriculum]]
