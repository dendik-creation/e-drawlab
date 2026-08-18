---
title: Proposal Main — Structured Extract
source_file: docs/00_Raw/TMR_TLEKTRO_4_Proposal_Gambar Teknik Elektronika_ok.docx
role: Original / main approved proposal
status: Approved
---

# Proposal Main — Structured Extract

Structured extract of the original approved proposal. This note is an *interpretation layer*; the immutable artifact stays at `docs/00_Raw/TMR_TLEKTRO_4_Proposal_Gambar Teknik Elektronika_ok.docx`.

Compared against the later revision in [[Proposal-Comparison]]. Requirements derived from it are listed in [[Requirements-Matrix]].

## Why this is the main proposal

- Contains the full document skeleton of a teaching-material proposal: `IDENTITAS BAHAN AJAR`, `DESKRIPSI UMUM BAHAN AJAR`, `ALUR INTERAKSI (FLOWCHART)`, `RENCANA IMPLEMENTASI`, `STORYBOARD` (Scenes 01–05).
- Defines project identity, target users, scope, delivery plan and screen-by-screen treatment.
- The second file (`Revisi Materi_TE.docx`) contains none of these sections — it only revises Stage 1/2/3 subject matter. See [[Proposal-Revision]].

## 1. Identitas Bahan Ajar

> Source: Approved Proposal — Section `IDENTITAS BAHAN AJAR`

| Field | Value (verbatim where meaningful) |
| --- | --- |
| Judul Lab Maya | **E-DrawLab: Desain CAD Elektronika** |
| Sub-title (Scene 01) | "Laboratorium Maya Skema Rangkaian dan Desain CAD Elektronika" |
| Jenis bahan ajar | Bahan Ajar Digital / Laboratorium Maya Interaktif (Virtual Lab) |
| Program keahlian | Teknik Elektronika — `TMR_TLEKTRO_4` (Elemen: Gambar Teknik Elektronika dan Pemodelan CAD) |
| Sasaran pengguna | Murid SMK Kelas X, rumpun program keahlian Teknik Elektronika (Fase E) |

### Cakupan materi (verbatim list)

1. Standar gambar teknik elektronika (ukuran kertas, garis, etiket/kolom nama).
2. Pengenalan berbagai jenis peralatan gambar teknik manual.
3. Simbol komponen elektronika dan rangkaian listrik standar internasional (IEC/ANSI).
4. Prosedur pembuatan gambar skema rangkaian dan layout PCB secara manual dan bantuan software.
5. Prosedur pembuatan gambar desain kemasan/casing produk dengan software CAD.

### Not stated in either document

Institution name, author/team names, publication date, funding body. The proposal explicitly requires the front page to be **free of developer identity** ("bersih dari nama pengembang di halaman depan"). Nothing was invented to fill these gaps — see [[Open-Questions]].

## 2. Deskripsi umum

> Source: Approved Proposal — Section `DESKRIPSI UMUM BAHAN AJAR`

- Interactive virtual lab simulating a technical-drawing studio and electronics product design workspace.
- Two-way interaction; learner changes design variables independently, using both manual instruments and simulated software interfaces, "tanpa batas ruang dan alat fisik".
- Three dynamic experiment stages (see [[Curriculum]]).
- **Immediate Dynamic Feedback**: wrong symbol placement, wrong trace width, or a casing too small for the PCB produces an immediate *visual consequence* (short-circuited trace, PCB colliding with the casing wall until it cracks).
- Structured step-progress indicator.
- Offline application, **< 25 MB**, **16×9** screen ratio.
- Positioned as a self-study medium to measure procedural competency *before* physical practicum.

## 3. Alur interaksi (flowchart)

> Source: Approved Proposal — Section `ALUR INTERAKSI (FLOWCHART)`

**Halaman Beranda (Menu Utama)**
- Tombol 1 — *Studi Kasus (Pertanyaan Pemantik)*: text/image simulation of an assembly failure caused by miscalculated dimensional tolerance, used as a critical-thinking trigger.
- Tombol 2 — *Panduan Aturan & Standardisasi*: paper sizes (A4–A0), line-thickness standards, etiket (title-block) structure, manual instruments.
- Tombol 3 — *Masuk Lab Maya*: entry to the simulation room.

**Halaman Ruang Simulasi (alur prosedural)**
- Langkah 1 (Atur Variabel — Stage 1): empty A4 sheet + component library; drag & drop symbols and project text data into a precise etiket.
- Langkah 2 (Uji Eksternal — Stage 2): PCB layout software simulation; trace-width slider `0.2 mm – 1.5 mm`; trace routing between component pins with 45° corners.
- Langkah 3 (Uji Internal — Stage 3): 3D CAD casing design; three real-time dimension sliders wrapping the PCB from the previous stage (`100×60×15 mm`).
- Langkah 4 (Penentuan Nilai & Grading): `[UJI KECOCOKAN]` validates spatial precision of the enclosure.

**Halaman Hasil & Umpan Balik (Dashboard Evaluasi)**
Staged formative score recap, "EXPERT CAD DESIGNER" trophy medal, reflective multiple-choice quiz on industrial manufacturing tolerance, a scientific curve chart comparing trace-temperature impact, and a redesign button.

## 4. Rencana implementasi

> Source: Approved Proposal — Section `RENCANA IMPLEMENTASI`

| Phase | Duration | Content |
| --- | --- | --- |
| Pra-Pembelajaran (asynchronous, at home) | 1 day before class | Teacher distributes the offline application file link via the school LMS or a messaging group. Students open *Panduan Aturan* independently and read the industrial case study. |
| Pendahuluan (synchronous) | 15 min | Brainstorming from home exploration; reinforcement on IEC/ANSI compliance. |
| Inti (guided group experiment) | 45 min | Groups of 3–4 students, lab computers, open `index.html` **offline**. Digital worksheet (LKPD-D). Complete all three stages. Immediate Dynamic Feedback: invalid decisions (trace `< 0.3 mm`, sharp 90° corner) trigger an error buzz, a burnt/broken copper-trace visual, and reduce the design-stability indicator. |
| Penutup dan refleksi | 30 min | Score dashboard, 3 reflective quiz items on manufacturing dimensional tolerance, downloadable "Expert CAD Designer" certificate, group presentation of the casing-vs-PCB-volume correlation. |

Explicit purpose: the digital experience is a **pre-requisite** before physical circuit assembly with real CAD software in the school workshop — saving practicum time, minimising acrylic cutting errors, preventing material damage from structural miscalculation.

## 5. Storyboard scenes

> Source: Approved Proposal — Section `STORYBOARD`, Scenes 01–05

Architecture stated verbatim: **Single Page Application (SPA)**, home loads instantly, **no ministry opening video**.

Full per-scene treatment (visual, narration, SFX, music, ambience, interaction matrix Normal/Hover/Hit/Swipe/Show/Drag-drop) is transcribed once, per scene, under [[Screens]]:

- [[Scene-01-Home-and-Guide]]
- [[Scene-02-Stage-1-Schematic]]
- [[Scene-03-Stage-2-PCB-Layout]]
- [[Scene-04-Stage-3-3D-Casing]]
- [[Scene-05-Evaluation-and-Results]]

## 6. Internal inconsistencies found in the main proposal

Recorded, not silently fixed:

1. **Step counter mismatch.** Scenes 01–03 use "Langkah 1 / 2 / 3 dari 4"; Scene 04 states "Langkah 4 dari 5". Unresolved — [[Open-Questions]].
2. **Trace-width slider vs. revision math.** Slider range `0.2–1.5 mm` cannot express the revision's calculated widths (2.5–20 mm). See [[Proposal-Comparison]].
3. **Stage 3 PCB dimensions.** Flowchart gives a fixed PCB of `100×60×15 mm`; the revision's worked examples use other boards (60×40, 75×45, 90×55…). See [[Proposal-Comparison]].
4. **Typos in the source** (`komarasi` → komparasi, `DESAING ULANG` → DESAIN ULANG, `Hn` → `Hin`) are preserved verbatim when quoted and corrected in derived specs.
5. Asset attribution notes ("Sumber: gemini ai", "Sumber: canva ai") appear on storyboard visuals; final licensing line is CC-BY-NC-SA. See [[Media-Asset-Register]].

## Related

- [[Proposal-Revision]]
- [[Proposal-Comparison]]
- [[Requirements-Matrix]]
- [[Project-Overview]]
