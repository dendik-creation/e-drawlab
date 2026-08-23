import { markMenuCompleted } from '../state/progress'
import { EVALUATION_QUESTIONS as DESAIN_SKEMA_QUESTIONS } from '../desainSkema/evaluation'
import { JALUR_PCB_QUESTIONS } from '../jalurPcb/evaluation'
import { CAD_CASING_QUESTIONS } from '../cadCasing/evaluation'
import type { EvaluationConfig, ScoreTier } from '../desainSkema/evaluation'

/**
 * Evaluasi Akhir — the Home menu's fourth item: a combined quiz drawing from
 * every journey's own question bank (Desain Skema's 9 + Jalur PCB's 3 + CAD
 * Casing's 3 = 15), rather than a bank of its own. Reuses the same
 * `EvaluationStep` UI every Langkah 3 already runs.
 *
 * Scoring is a hard passing grade (see `EvaluationConfig.passGrade`), not the
 * 3-tier excellent/good/retry read the per-journey quizzes use: 10 points per
 * correct answer, 80/100 to pass. Below that, the learner can retry — the
 * "sudah dipelajari" badge on Home only lights up once a pass lands.
 */
export const EVALUASI_AKHIR_QUESTIONS = [...DESAIN_SKEMA_QUESTIONS, ...JALUR_PCB_QUESTIONS, ...CAD_CASING_QUESTIONS]

const EVALUASI_AKHIR_SAMPLE_SIZE = 10
const EVALUASI_AKHIR_WEIGHT_PER_QUESTION = 10
const EVALUASI_AKHIR_PASSING_GRADE = 80

/** Shared across every journey's own evaluasi results card — nothing here is specific to any one topic. */
const RESULT_ICONS: Record<ScoreTier, string[]> = {
  excellent: ['elec-led', 'elec-opamp', 'elec-ic-chip'],
  good: ['elec-battery', 'elec-resistor', 'elec-terminal-block'],
  retry: ['elec-capacitor', 'elec-diode', 'elec-inductor'],
}

/** Only 'excellent' (pass) and 'retry' (fail) are ever picked — see EvaluationConfig.passGrade — but the type still asks for all three. */
const TIER_MESSAGE: Record<ScoreTier, string> = {
  excellent: 'Selamat! Kamu lulus Evaluasi Akhir.',
  good: 'Selamat! Kamu lulus Evaluasi Akhir.',
  retry: 'Nilai kamu belum mencapai passing grade. Pelajari kembali materi dan coba lagi.',
}

export const EVALUASI_AKHIR_EVALUATION: EvaluationConfig = {
  questions: EVALUASI_AKHIR_QUESTIONS,
  sampleSize: EVALUASI_AKHIR_SAMPLE_SIZE,
  shuffleOptionOrder: true,
  introInstructions: [
    'Evaluasi ini terdiri dari 10 soal pilihan ganda acak, gabungan dari materi Desain Skema, Jalur PCB, dan CAD Casing.',
    'Setiap jawaban benar bernilai 10 poin. Nilai maksimal 100.',
    'Passing grade adalah 80. Di bawah itu, kamu bisa mengulang evaluasi sampai lulus.',
    'Tidak ada batas waktu pengerjaan. Kerjakan dengan santai.',
    'Setiap soal hanya bisa dijawab satu kali dan jawabannya tidak bisa diubah.',
  ],
  resultIcons: RESULT_ICONS,
  tierMessage: TIER_MESSAGE,
  sideArt: { left: 'eval-left-side', right: 'eval-right-side' },
  passGrade: { weightPerQuestion: EVALUASI_AKHIR_WEIGHT_PER_QUESTION, threshold: EVALUASI_AKHIR_PASSING_GRADE },
  // Badge only lights up once the learner actually clears the passing grade,
  // not merely on finishing the quiz — unlike the per-journey evaluasi steps.
  onComplete: ({ passed }) => {
    if (passed) markMenuCompleted('evaluasi-akhir')
  },
  isFinalStep: true,
}
