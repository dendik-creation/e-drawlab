import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audio } from '../../audio/director'
import {
  scoreTier,
  shuffleOptions,
  shuffleQuestions,
  type EvaluationConfig,
  type QuizQuestion,
  type ScoreTier,
} from '../../domain/desainSkema/evaluation'
import ActionButton from '../../ui/ActionButton'
import { textureUrl } from '../../ui/assets/textures'
import './evaluation.css'

/**
 * Langkah 3 — Evaluasi: an intro card, a 3-2-1 countdown, the quiz itself
 * (question order shuffled per attempt), then a results card.
 *
 * Subject-matter free: the bank, intro copy, result icons, tier messages and
 * margin art all arrive as an `EvaluationConfig`, so all four journeys run the
 * same choreography over different content — the config type and every bank
 * are reused from the canvas build untouched.
 *
 * The layout the canvas version had to measure by hand (question text height →
 * options top → card height → feedback Y → button Y, all recomputed per
 * question) is normal document flow here. Nothing is measured, and a long
 * question or a tall diagram grows the card by itself.
 */

/** Short options ("Resistor") get a 2-column grid; longer, full-sentence options stack. */
const SHORT_OPTION_MAX_LEN = 26

const COUNTDOWN_STEP_MS = 860

type Phase =
  | { kind: 'intro' }
  | { kind: 'countdown'; digit: number }
  | { kind: 'question'; index: number }
  | { kind: 'result' }

interface Answer {
  selectedKey: string
  correct: boolean
}

export interface EvaluationViewProps {
  config: EvaluationConfig
  /** "Ke Beranda" on the final results card. */
  onExitHome: () => void
}

export default function EvaluationView({ config, onExitHome }: EvaluationViewProps) {
  const drawQuestions = useCallback((): QuizQuestion[] => {
    const shuffled = shuffleQuestions(config.questions)
    const drawn = config.sampleSize ? shuffled.slice(0, config.sampleSize) : shuffled
    return config.shuffleOptionOrder ? drawn.map(shuffleOptions) : drawn
  }, [config])

  const [questions, setQuestions] = useState<QuizQuestion[]>(drawQuestions)
  const [phase, setPhase] = useState<Phase>(config.showIntro === false ? { kind: 'countdown', digit: 3 } : { kind: 'intro' })
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [score, setScore] = useState(0)

  /** Countdown: one digit every step, then the first question and work_theme. */
  useEffect(() => {
    if (phase.kind !== 'countdown') return

    const timer = window.setTimeout(() => {
      if (phase.digit > 1) {
        setPhase({ kind: 'countdown', digit: phase.digit - 1 })
        return
      }
      audio.setProfile('quiz')
      setPhase({ kind: 'question', index: 0 })
    }, COUNTDOWN_STEP_MS)

    return () => window.clearTimeout(timer)
  }, [phase])

  const selectOption = useCallback(
    (question: QuizQuestion, key: string) => {
      if (answer) return
      const correct = key === question.correct

      setAnswer({ selectedKey: key, correct })
      if (correct) {
        setScore((value) => value + 1)
        audio.play('bell')
      } else {
        audio.play('quizWrong')
      }
    },
    [answer],
  )

  const advance = useCallback(
    (index: number) => {
      setAnswer(null)
      if (index + 1 >= questions.length) setPhase({ kind: 'result' })
      else setPhase({ kind: 'question', index: index + 1 })
    },
    [questions.length],
  )

  const retry = useCallback(() => {
    if (config.onRetry) {
      config.onRetry()
      return
    }
    // No journey-level retry: reshuffle and run the same quiz again, skipping
    // the instructions card the learner has already read.
    setQuestions(drawQuestions())
    setScore(0)
    setAnswer(null)
    setPhase({ kind: 'countdown', digit: 3 })
  }, [config, drawQuestions])

  return (
    <div className="eval-root">
      {/* Two pre-baked static images filling the margins either side of the
          card. The earlier scatter-and-animate version cost a steady, purely
          decorative slice of every frame. */}
      <img className="eval-side-art is-left" src={textureUrl(config.sideArt.left)} alt="" draggable={false} />
      <img className="eval-side-art is-right" src={textureUrl(config.sideArt.right)} alt="" draggable={false} />

      {phase.kind === 'intro' && (
        <IntroCard instructions={config.introInstructions} onStart={() => setPhase({ kind: 'countdown', digit: 3 })} />
      )}

      {phase.kind === 'countdown' && (
        <div className="eval-countdown" key={phase.digit}>
          {phase.digit}
        </div>
      )}

      {phase.kind === 'question' && (
        <QuestionCard
          question={questions[phase.index]}
          index={phase.index}
          total={questions.length}
          answer={answer}
          onSelect={(key) => selectOption(questions[phase.index], key)}
          onNext={() => advance(phase.index)}
        />
      )}

      {phase.kind === 'result' && (
        <ResultCard config={config} score={score} total={questions.length} onRetry={retry} onExitHome={onExitHome} />
      )}
    </div>
  )
}

/** The dialog shown before any question renders or work_theme starts. */
function IntroCard({ instructions, onStart }: { instructions: string[]; onStart: () => void }) {
  return (
    <div className="eval-intro edl-fade-down">
      <div className="eval-intro-card">
        <h2 className="eval-intro-title">Evaluasi Pemahaman</h2>
        <p className="eval-intro-subtitle">Sebelum mulai, baca dulu petunjuk pengerjaannya:</p>
        <ol className="eval-intro-list">
          {instructions.map((line, i) => (
            <li key={line}>
              <span className="eval-intro-bullet">{i + 1}</span>
              <span className="eval-intro-text">{line}</span>
            </li>
          ))}
        </ol>
      </div>
      <ActionButton label="Mulai Evaluasi →" minWidth={320} onPress={onStart} />
    </div>
  )
}

function QuestionCard({
  question,
  index,
  total,
  answer,
  onSelect,
  onNext,
}: {
  question: QuizQuestion
  index: number
  total: number
  answer: Answer | null
  onSelect: (key: string) => void
  onNext: () => void
}) {
  const images = question.images ?? []
  const hasImage = images.length > 0
  const useGrid = useMemo(
    () => question.options.every((option) => option.text.length <= SHORT_OPTION_MAX_LEN),
    [question],
  )

  /**
   * Guards the ~180ms fade between cards. A second tap inside that window
   * rendered the next card twice in the canvas build — the intermittent
   * "answer, then double-tap Soal Berikutnya" crash.
   */
  const navigating = useRef(false)
  useEffect(() => {
    navigating.current = false
  }, [index])

  const isLast = index === total - 1

  return (
    <div className="eval-question edl-fade-down" key={index}>
      {/* Wording, not navigation — there is nothing here to tap. */}
      <p className="eval-progress-label">{`Soal ${index + 1} dari ${total}`}</p>
      <div className="eval-progress-track">
        <div className="eval-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="eval-card" data-with-image={hasImage ? '' : undefined}>
        <div className="eval-card-badge">{index + 1}</div>

        {hasImage && (
          <div className="eval-image-column" data-image-count={images.length}>
            {images.map((key) => (
              <img key={key} className="eval-question-image" src={textureUrl(key)} alt="" draggable={false} />
            ))}
          </div>
        )}

        <div className="eval-answer-column">
          <p className="eval-question-text">{question.question}</p>
          <div className="eval-options" data-layout={useGrid ? 'grid' : 'stack'}>
            {question.options.map((option) => (
              <OptionPill
                key={option.key}
                optionKey={option.key}
                text={option.text}
                state={pillState(option.key, question.correct, answer)}
                disabled={answer !== null}
                onSelect={() => onSelect(option.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {answer && (
        <div className="eval-feedback-row">
          <p className="eval-feedback" data-correct={answer.correct ? '' : undefined}>
            {answer.correct ? '✓ Jawaban benar!' : `✗ Jawaban salah. Jawaban yang benar adalah ${question.correct}.`}
          </p>
          <ActionButton
            label={isLast ? 'Lihat Hasil →' : 'Soal Berikutnya →'}
            minWidth={260}
            onPress={() => {
              if (navigating.current) return
              navigating.current = true
              onNext()
            }}
          />
        </div>
      )}
    </div>
  )
}

type PillState = 'neutral' | 'correct' | 'wrong' | 'dim'

function pillState(key: string, correctKey: string, answer: Answer | null): PillState {
  if (!answer) return 'neutral'
  if (key === correctKey) return 'correct'
  if (key === answer.selectedKey) return 'wrong'
  return 'dim'
}

function OptionPill({
  optionKey,
  text,
  state,
  disabled,
  onSelect,
}: {
  optionKey: string
  text: string
  state: PillState
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className="eval-option"
      data-state={state}
      disabled={disabled}
      onPointerEnter={() => {
        if (!disabled) audio.play('hover')
      }}
      onClick={onSelect}
    >
      <span className="eval-option-badge">{optionKey}</span>
      <span className="eval-option-text">{text}</span>
    </button>
  )
}

function ResultCard({
  config,
  score,
  total,
  onRetry,
  onExitHome,
}: {
  config: EvaluationConfig
  score: number
  total: number
  onRetry: () => void
  onExitHome: () => void
}) {
  /**
   * Passing-grade quizzes (Evaluasi Akhir) score a raw weighted value against
   * a fixed threshold instead of the softer 3-tier read; the tier record is
   * still used to pick an icon and message, collapsed to 'excellent' (pass)
   * and 'retry' (fail) — 'good' never applies there.
   */
  const result = useMemo(() => {
    const passGrade = config.passGrade
    const tier: ScoreTier = passGrade
      ? score * passGrade.weightPerQuestion >= passGrade.threshold
        ? 'excellent'
        : 'retry'
      : scoreTier(score, total)
    const passed = tier === 'excellent'
    const displayScore = passGrade ? score * passGrade.weightPerQuestion : score
    const displayTotal = passGrade ? passGrade.weightPerQuestion * total : total
    const icons = config.resultIcons[tier]

    return {
      tier,
      passed,
      displayScore,
      displayTotal,
      icon: icons[Math.floor(Math.random() * icons.length)],
      message: passGrade
        ? passed
          ? `Selamat! Nilai kamu ${displayScore}. Sudah mencapai passing grade (${passGrade.threshold}).`
          : `Nilai kamu ${displayScore}. Belum mencapai passing grade (${passGrade.threshold}). Pelajari kembali materi dan coba lagi.`
        : config.tierMessage[tier],
    }
    // Drawn once per results card: re-rolling the icon on an unrelated
    // re-render would flicker it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, score, total])

  useEffect(() => {
    // work_theme's job is done — stop it and mark the moment with a one-shot
    // rather than leaving the quiz track running under the results card.
    audio.setProfile('silent')
    audio.play('completeEvaluation')
    config.onComplete?.({ passed: result.passed, score, total })
    // Fires once when the card appears, which is what "quiz finished" means.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="eval-result edl-fade-down">
      <div className="eval-result-card">
        <img className="eval-result-icon" src={textureUrl(result.icon)} alt="" draggable={false} />
        <h2 className="eval-result-heading">Evaluasi Selesai!</h2>
        <p className="eval-result-label">Skor kamu</p>
        <p className="eval-result-score">
          <span className="eval-result-score-value">{result.displayScore}</span>
          <span className="eval-result-score-total">{`/ ${result.displayTotal}`}</span>
        </p>
        <p className="eval-result-message">{result.message}</p>
      </div>

      <div className="eval-result-actions">
        {config.isFinalStep ? (
          <>
            <ActionButton label="Coba Lagi" minWidth={240} onPress={onRetry} />
            <ActionButton label="Ke Beranda" minWidth={240} variant="secondary" pressSound={null} onPress={onExitHome} />
          </>
        ) : (
          <ActionButton label="Lanjutkan →" minWidth={260} pressSound={null} onPress={() => config.onContinue?.()} />
        )}
      </div>
    </div>
  )
}
