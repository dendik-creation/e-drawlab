import { markMenuCompleted } from '../../state/progress'
import type { EvaluationConfig, QuizBank, QuizQuestion, ScoreTier } from '../desainSkema/evaluation'
import questionsData from './evaluationQuestions.json'

/**
 * Content-as-data for the CAD Casing Langkah 3 quiz (ADR-003), mirroring
 * `jalurPcb/evaluation.ts` — same `EvaluationStep` UI, different bank. The
 * three items work the sizing formulas Langkah 1's FormulaBand and Langkah
 * 2's simulator both teach: Lin/Win = PCB dimension + 2×clearance, Hin =
 * standoff + PCB thickness + component height + top clearance, and the 3D
 * print's outer dimensions = inner + 2×wall thickness.
 */
export const CAD_CASING_QUESTIONS: QuizQuestion[] = (questionsData as QuizBank).questions

/** CAD/casing-flavoured props for the results card, all already queued by the scene. */
const RESULT_ICONS: Record<ScoreTier, string[]> = {
  excellent: ['elec-pcb-trace', 'elec-ic-chip', 'elec-opamp'],
  good: ['elec-battery', 'elec-terminal-block', 'elec-resistor'],
  retry: ['elec-capacitor', 'elec-diode', 'elec-inductor'],
}

const TIER_MESSAGE: Record<ScoreTier, string> = {
  excellent: 'Luar biasa! Kamu menguasai perhitungan dimensi casing PCB dengan baik.',
  good: 'Bagus! Sedikit lagi kamu akan menguasai semuanya.',
  retry: 'Jangan menyerah! Pelajari kembali materi dan coba lagi.',
}

export const CAD_CASING_EVALUATION: EvaluationConfig = {
  questions: CAD_CASING_QUESTIONS,
  // All three items share the same "B, C, B" correct-key spread by chance,
  // not by design — shuffled anyway so the set isn't clearable on shape alone.
  shuffleOptionOrder: true,
  introInstructions: [
    'Kuis ini terdiri dari 3 soal pilihan ganda tentang perhitungan dimensi casing PCB.',
    'Ukuran dalam (Lin/Win) = dimensi PCB + 2 × celah samping.',
    'Tinggi dalam (Hin) = tinggi pilar + tebal PCB + tinggi komponen + celah bebas atas.',
    'Setiap soal hanya bisa dijawab satu kali dan jawabannya tidak bisa diubah.',
  ],
  resultIcons: RESULT_ICONS,
  tierMessage: TIER_MESSAGE,
  // Reuses the same generic scattered-electronics margin art every other
  // journey's evaluasi step does — not schematic- or casing-specific.
  sideArt: { left: 'eval-left-side', right: 'eval-right-side' },
  // Badge lights up on finishing the quiz (results card), not on merely
  // reaching it — Home reads this flag via `isMenuCompleted('cad-casing')`.
  onComplete: () => markMenuCompleted('cad-casing'),
  // CAD Casing has just the one evaluation — always the journey's last step,
  // so it keeps the original "Coba Lagi" (restart in place) + "Ke Beranda" pair.
  isFinalStep: true,
}
