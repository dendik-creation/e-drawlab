import { useCallback, useEffect, useState } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../state/session'
import { markMenuCompleted } from '../../state/progress'
import { CIRCUIT_LEVELS } from '../../domain/desainSkema/circuits'
import { buildDesainSkemaStepEvaluation } from '../../domain/desainSkema/evaluation'
import { DesignFrame } from '../../ui/stage/StageRoot'
import JourneyHeader from '../../ui/JourneyHeader'
import EvaluationView from '../evaluation/EvaluationView'
import MateriStep from './MateriStep'
import WorkbenchStep from './WorkbenchStep'
import type { SceneProps } from '../../app/scenes'
import '../evaluation/scene.css'

/**
 * Desain Skema journey: theory (Langkah 1), then three progressively harder
 * work sheets, each followed immediately by its own 3-question evaluation
 * drawn from that sheet's topic.
 *
 * The orchestrator only decides which step is current and remembers which
 * levels are already solved; each step owns its own rendering.
 */

type Step = 'materi' | 'level-1' | 'eval-1' | 'level-2' | 'eval-2' | 'level-3' | 'eval-3'

const STEP_ORDER: Step[] = ['materi', 'level-1', 'eval-1', 'level-2', 'eval-2', 'level-3', 'eval-3']

const LEVEL_NUMBER: Record<string, 1 | 2 | 3> = { 'level-1': 1, 'level-2': 2, 'level-3': 3 }
const EVAL_LEVEL_NUMBER: Record<string, 1 | 2 | 3> = { 'eval-1': 1, 'eval-2': 2, 'eval-3': 3 }

const SWAP_OUT_MS = 160

function badgeLabel(step: Step) {
  if (step === 'materi') return 'Langkah 1 - Materi'
  if (step === 'eval-3') return 'Langkah 3 - Evaluasi'
  if (step === 'eval-1' || step === 'eval-2') return 'Langkah 2 - Evaluasi'
  return 'Langkah 2 - Simulasi CAD'
}

export default function DesainSkemaScene({ navigate }: SceneProps) {
  const [step, setStep] = useState<Step>('materi')
  const [solvedLevels, setSolvedLevels] = useState<Set<Step>>(new Set())
  const [swapping, setSwapping] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    session.set({ currentScene: 'DesainSkema', step: null })
  }, [])

  useEffect(() => {
    // work_theme only starts once an evaluation's countdown clears; every
    // other step stays on the ambient menu track.
    audio.setProfile('menu')
  }, [step])

  const goToStep = useCallback(
    (next: Step) => {
      if (swapping || exiting) return
      audio.play('click')
      setSwapping(true)
      window.setTimeout(() => {
        setStep(next)
        setSwapping(false)
      }, SWAP_OUT_MS)
    },
    [exiting, swapping],
  )

  const goHome = useCallback(() => {
    if (exiting) return
    setExiting(true)
    audio.play('click')
    window.setTimeout(() => navigate('Home'), 200)
  }, [exiting, navigate])

  const index = STEP_ORDER.indexOf(step)
  const next = STEP_ORDER[index + 1]
  const disabled = swapping || exiting

  const isLevel = step.startsWith('level-')
  const isEval = step.startsWith('eval-')

  /** Reaching the final evaluasi is the "sudah dipelajari" bar for Home's menu badge. */
  useEffect(() => {
    if (step === 'eval-3') markMenuCompleted('desain-skema')
  }, [step])

  return (
    <DesignFrame>
      <div className={exiting ? 'scene-body is-exiting' : 'scene-body'}>
        <JourneyHeader
          title="Desain Skema Elektronika"
          badge={badgeLabel(step)}
          disabled={disabled}
          onHome={goHome}
          onBack={index > 0 ? () => goToStep(STEP_ORDER[index - 1]) : undefined}
        />

        <div className={swapping ? 'scene-step is-swapping' : 'scene-step'} key={step}>
          {step === 'materi' && <MateriStep onNext={() => goToStep('level-1')} />}

          {isLevel && (
            <WorkbenchStep
              level={CIRCUIT_LEVELS[LEVEL_NUMBER[step] - 1]}
              levelNumber={LEVEL_NUMBER[step]}
              alreadySolved={solvedLevels.has(step)}
              onSolved={() => setSolvedLevels((set) => new Set(set).add(step))}
              onNext={() => next && goToStep(next)}
            />
          )}

          {isEval && (
            <EvaluationView
              config={buildDesainSkemaStepEvaluation({
                level: EVAL_LEVEL_NUMBER[step],
                isFinalStep: step === 'eval-3',
                // Only the first one shows the instructions dialog — the rules
                // do not change between sheets.
                showIntro: step === 'eval-1',
                onContinue: step === 'eval-3' ? undefined : () => next && goToStep(next),
                // "Coba Lagi" on the final evaluation goes back to the first
                // work sheet rather than reshuffling this quiz in place.
                onRetry: step === 'eval-3' ? () => goToStep('level-1') : undefined,
              })}
              onExitHome={goHome}
            />
          )}
        </div>
      </div>
    </DesignFrame>
  )
}
