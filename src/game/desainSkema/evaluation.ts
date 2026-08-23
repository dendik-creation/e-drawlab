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

/**
 * Splits the bank by which "paper-work-N" schematic a question's `images`
 * reference — that tag is how each Langkah 2.N work sheet's own 3-question
 * evaluation is filtered out of the shared 9-question bank. A question whose
 * `images` span two sheets (Q-S1-08: paper-work-2 + paper-work-3) is eligible
 * for either level's draw, same as the Figma content review called for.
 */
export function questionsForLevel(level: 1 | 2 | 3): QuizQuestion[] {
  const tag = `paper-work-${level}`
  return EVALUATION_QUESTIONS.filter((question) => question.images?.includes(tag))
}

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
/**
 * Weighted pass/fail scoring, used instead of the 3-tier excellent/good/retry
 * read when a quiz has a hard passing grade (Evaluasi Akhir: 10 questions,
 * 10 points each, 80/100 to pass) rather than DesainSkema/JalurPcb/CadCasing's
 * softer "how well did you do" tiers.
 */
export interface PassGradeConfig {
  /** Points awarded per correct answer, e.g. 10. */
  weightPerQuestion: number
  /** Minimum weighted score required to pass, e.g. 80. */
  threshold: number
}

export interface EvaluationConfig {
  questions: QuizQuestion[]
  /** Draw only this many questions (after shuffling) from `questions` — omit to use the whole bank. */
  sampleSize?: number
  /** Re-order + re-letter each question's options per attempt. See `shuffleOptions`. */
  shuffleOptionOrder?: boolean
  /** Skip the instructions dialog and go straight to the countdown. Default true (show it). */
  showIntro?: boolean
  /** Numbered lines on the intro card, before the countdown. */
  introInstructions: string[]
  /** Result-card icon pool per tier; a random one is drawn from the matching tier. */
  resultIcons: Record<ScoreTier, string[]>
  tierMessage: Record<ScoreTier, string>
  /** Texture keys for the two static images filling the margins either side of the card. */
  sideArt: { left: string; right: string }
  /**
   * When set, the results card scores by `PassGradeConfig` instead of the
   * 3-tier `scoreTier` read — a raw weighted score against a fixed threshold,
   * with the tier record above still used to pick an icon/message (mapped to
   * 'excellent' on a pass, 'retry' on a fail) but not for the pass/fail call.
   */
  passGrade?: PassGradeConfig
  /** Fired when the results card renders — where a journey marks itself completed. */
  onComplete?: (result: { passed: boolean; score: number; total: number }) => void
  /**
   * Whether this is the journey's last evaluation. Controls the results
   * card's buttons: a final step gets "Coba Lagi" + "Ke Beranda" (the
   * original pair); a non-final step gets a single "Lanjutkan" button that
   * calls `onContinue` instead, since there's a next work sheet/evaluation
   * waiting rather than the whole journey being over.
   */
  isFinalStep: boolean
  /** Non-final steps only: advances the journey past this evaluation's results card. */
  onContinue?: () => void
  /** Final steps only: "Coba Lagi" action. Omit to fall back to re-shuffling and restarting this same quiz in place. */
  onRetry?: () => void
}

const DESAIN_SKEMA_RESULT_ICONS: Record<ScoreTier, string[]> = {
  excellent: ['elec-led', 'elec-opamp', 'elec-ic-chip'],
  good: ['elec-battery', 'elec-resistor', 'elec-terminal-block'],
  retry: ['elec-capacitor', 'elec-diode', 'elec-inductor'],
}

/**
 * Only shown ahead of Langkah 2.1's evaluation (the learner's first time
 * through this quiz format) — Langkah 2.2/2.3 skip straight to the countdown
 * since the rules don't change between sheets.
 */
const DESAIN_SKEMA_INTRO_INSTRUCTIONS = [
  'Evaluasi ini terdiri dari 3 soal pilihan ganda sesuai kertas kerja yang baru saja kamu selesaikan.',
  'Perhatikan gambar skema pada tiap soal sebelum memilih jawaban.',
  'Setiap soal hanya bisa dijawab satu kali dan jawabannya tidak bisa diubah.',
  'Evaluasi ini akan muncul lagi setiap kali kamu menyelesaikan satu kertas kerja simulasi.',
]

export interface DesainSkemaStepEvaluationOptions {
  /** Which work sheet's questions to draw from — filters the bank via `questionsForLevel`. */
  level: 1 | 2 | 3
  isFinalStep: boolean
  showIntro: boolean
  onContinue?: () => void
  onRetry?: () => void
}

/** Builds one Langkah 2.N evaluation's config — 3 random questions filtered to that sheet's topic. */
export function buildDesainSkemaStepEvaluation(options: DesainSkemaStepEvaluationOptions): EvaluationConfig {
  return {
    questions: questionsForLevel(options.level),
    sampleSize: 3,
    showIntro: options.showIntro,
    introInstructions: DESAIN_SKEMA_INTRO_INSTRUCTIONS,
    resultIcons: DESAIN_SKEMA_RESULT_ICONS,
    tierMessage: SCORE_TIER_MESSAGE,
    sideArt: { left: 'eval-left-side', right: 'eval-right-side' },
    isFinalStep: options.isFinalStep,
    onContinue: options.onContinue,
    onRetry: options.onRetry,
  }
}
