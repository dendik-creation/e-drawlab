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

interface QuizBank {
  questions: QuizQuestion[]
}

export const EVALUATION_QUESTIONS: QuizQuestion[] = (questionsData as QuizBank).questions

/** Fisher-Yates on a copy — never mutates EVALUATION_QUESTIONS, since every scene visit/retry re-shuffles from the same source order. */
export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
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
