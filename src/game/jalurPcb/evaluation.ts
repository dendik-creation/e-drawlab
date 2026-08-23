import { markMenuCompleted } from '../state/progress'
import type { EvaluationConfig, QuizBank, QuizQuestion, ScoreTier } from '../desainSkema/evaluation'
import questionsData from './evaluationQuestions.json'

/**
 * Content-as-data for the Jalur PCB Langkah 3 quiz (ADR-003), mirroring
 * `desainSkema/evaluation.ts`. The bank lives in `evaluationQuestions.json` so
 * a teacher can edit items without touching TypeScript.
 *
 * The three items work from the practical multiplier table in the assessment
 * brief — lebar jalur (mm) = arus (A) × faktor pengali, with 0.5 oz = 2 mm/A,
 * 1 oz = 1 mm/A and 2 oz = 0.5 mm/A. NOTE: that is a different scale from the
 * Langkah 2 simulator, which teaches `I × 2` corrected by 1.5/1.0/0.75 (so
 * 3/2/1.5 mm/A). Both were authored as given; reconciling them is a content
 * decision, not a code one.
 */
export const JALUR_PCB_QUESTIONS: QuizQuestion[] = (questionsData as QuizBank).questions

/** PCB-flavoured props for the results card, all already queued by the scene. */
const RESULT_ICONS: Record<ScoreTier, string[]> = {
  excellent: ['elec-pcb-trace', 'elec-ic-chip', 'elec-opamp'],
  good: ['elec-battery', 'elec-terminal-block', 'elec-resistor'],
  retry: ['elec-capacitor', 'elec-diode', 'elec-inductor'],
}

const TIER_MESSAGE: Record<ScoreTier, string> = {
  excellent: 'Luar biasa! Kamu menguasai penentuan lebar jalur PCB dengan baik.',
  good: 'Bagus! Sedikit lagi kamu akan menguasai semuanya.',
  retry: 'Jangan menyerah! Pelajari kembali materi dan coba lagi.',
}

export const JALUR_PCB_EVALUATION: EvaluationConfig = {
  questions: JALUR_PCB_QUESTIONS,
  // Every item in this bank was authored with the same key, so the option
  // order is randomised per attempt — otherwise the set is clearable by
  // picking the middle pill three times.
  shuffleOptionOrder: true,
  introInstructions: [
    'Kuis ini terdiri dari 3 soal pilihan ganda tentang penentuan lebar jalur PCB.',
    'Hitung arus dulu (I = P / V), lalu kalikan dengan faktor ketebalan tembaga.',
    'Faktor pengali: 0,5 oz = 2 mm/A, 1 oz = 1 mm/A, 2 oz = 0,5 mm/A.',
    'Setiap soal hanya bisa dijawab satu kali dan jawabannya tidak bisa diubah.',
  ],
  resultIcons: RESULT_ICONS,
  tierMessage: TIER_MESSAGE,
  // Reuses the Desain Skema margin art — generic scattered electronics, not
  // schematic-specific. Swap the keys here once Jalur PCB art exists.
  sideArt: { left: 'eval-left-side', right: 'eval-right-side' },
  // Badge lights up on finishing the quiz (results card), not on merely
  // reaching it — Home reads this flag via `isMenuCompleted('jalur-pcb')`.
  onComplete: () => markMenuCompleted('jalur-pcb'),
  // Jalur PCB has just the one evaluation — always the journey's last step,
  // so it keeps the original "Coba Lagi" (restart in place) + "Ke Beranda" pair.
  isFinalStep: true,
}
