/**
 * Content-as-data for Langkah 3's evaluation quiz (ADR-003), mirroring
 * circuits.ts. Item text/keys are the authoritative Stage 1 set from
 * docs/02_Learning_Design/Assessments/Question-Bank.md (Q-S1-01..09).
 *
 * The bank lives in evaluationQuestions.json, not here, so a teacher can
 * add/edit/remove items without touching TypeScript.
 */
import questionsData from './evaluationQuestions.json'

export interface QuizOption {
  key: string
  text: string
}

export interface QuizQuestion {
  id: string
  question: string
  /** Texture keys (queued in DesainSkema.ts) of the schematic image(s) this question refers to. */
  images?: string[]
  options: QuizOption[]
  correct: string
}

export interface QuizBank {
  questions: QuizQuestion[]
}

export const EVALUATION_QUESTIONS: QuizQuestion[] = (questionsData as QuizBank).questions

/** Fisher-Yates on a copy — never mutates the source bank, since every scene visit/retry re-shuffles from the same source order. */
export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return shuffled(questions)
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E']

/**
 * Re-orders a question's options and re-letters them A/B/C in their new
 * positions, moving `correct` along with the option it belongs to.
 *
 * Only for banks whose key is always the same letter — the Jalur PCB set is
 * three items with answer B every time, which a learner can clear on shape
 * alone. Banks with an already-varied key (Desain Skema) keep their authored
 * order, so the option a teacher wrote as A stays A.
 */
export function shuffleOptions(question: QuizQuestion): QuizQuestion {
  const correctOption = question.options.find((option) => option.key === question.correct)
  const reordered = shuffled(question.options)
  const options = reordered.map((option, i) => ({ key: OPTION_KEYS[i] ?? option.key, text: option.text }))
  const correctIndex = correctOption ? reordered.indexOf(correctOption) : -1

  return {
    ...question,
    options,
    correct: correctIndex >= 0 ? options[correctIndex].key : question.correct,
  }
}

export type ScoreTier = 'excellent' | 'good' | 'retry'

export function scoreTier(score: number, total: number): ScoreTier {
  if (total === 0) return 'retry'
  const ratio = score / total
  if (ratio >= 0.8) return 'excellent'
  if (ratio >= 0.5) return 'good'
  return 'retry'
}

export const SCORE_TIER_MESSAGE: Record<ScoreTier, string> = {
  excellent: 'Luar biasa! Kamu menguasai materi Desain Skema dengan baik.',
  good: 'Bagus! Sedikit lagi kamu akan menguasai semuanya.',
  retry: 'Jangan menyerah! Pelajari kembali materi dan coba lagi.',
}

/**
 * Everything `EvaluationStep` needs that differs per journey. The step itself
 * owns the card/countdown/result choreography and nothing about the subject
 * matter, so Desain Skema and Jalur PCB share one implementation and differ
 * only in this object.
 */
export interface EvaluationConfig {
  questions: QuizQuestion[]
  /** Re-order + re-letter each question's options per attempt. See `shuffleOptions`. */
  shuffleOptionOrder?: boolean
  /** Numbered lines on the intro card, before the countdown. */
  introInstructions: string[]
  /** Result-card icon pool per tier; a random one is drawn from the matching tier. */
  resultIcons: Record<ScoreTier, string[]>
  tierMessage: Record<ScoreTier, string>
  /** Texture keys for the two static images filling the margins either side of the card. */
  sideArt: { left: string; right: string }
  /** Fired when the results card renders — where a journey marks itself completed. */
  onComplete?: () => void
}

const DESAIN_SKEMA_RESULT_ICONS: Record<ScoreTier, string[]> = {
  excellent: ['elec-led', 'elec-opamp', 'elec-ic-chip'],
  good: ['elec-battery', 'elec-resistor', 'elec-terminal-block'],
  retry: ['elec-capacitor', 'elec-diode', 'elec-inductor'],
}

export const DESAIN_SKEMA_EVALUATION: EvaluationConfig = {
  questions: EVALUATION_QUESTIONS,
  introInstructions: [
    'Kuis ini terdiri dari 9 soal pilihan ganda seputar skema rangkaian LED.',
    'Perhatikan gambar skema pada tiap soal sebelum memilih jawaban.',
    'Setiap soal hanya bisa dijawab satu kali dan jawabannya tidak bisa diubah.',
    'Skor akhir dihitung dari jumlah jawaban yang benar di semua soal.',
  ],
  resultIcons: DESAIN_SKEMA_RESULT_ICONS,
  tierMessage: SCORE_TIER_MESSAGE,
  sideArt: { left: 'eval-left-side', right: 'eval-right-side' },
}
