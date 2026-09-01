import { useCallback, useEffect, useState } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../game/state/session'
import { CAD_CASING_EVALUATION } from '../../game/cadCasing/evaluation'
import { DesignFrame } from '../../ui/stage/StageRoot'
import JourneyHeader from '../../ui/JourneyHeader'
import EvaluationView from '../evaluation/EvaluationView'
import MateriStep from './MateriStep'
import SimulasiStep from './SimulasiStep'
import type { SceneProps } from '../../app/scenes'
import '../evaluation/scene.css'

/**
 * CAD Casing journey: theory (Langkah 1), the 3D casing simulator
 * (Langkah 2), then the evaluation quiz (Langkah 3).
 */

type Step = 'materi' | 'simulasi' | 'evaluasi'

const STEP_ORDER: Step[] = ['materi', 'simulasi', 'evaluasi']

/** Each label is copied verbatim from its own Figma frame's badge — "Step 1" and "Step 2" do not agree on the dash. */
const STEP_BADGE: Record<Step, string> = {
  materi: 'Langkah 1 - Materi',
  simulasi: 'Langkah 2 Simulasi',
  evaluasi: 'Langkah 3 - Evaluasi',
}

const SWAP_OUT_MS = 160

export default function CadCasingScene({ navigate }: SceneProps) {
  const [step, setStep] = useState<Step>('materi')
  const [swapping, setSwapping] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    session.set({ currentScene: 'CadCasing', step: { current: STEP_ORDER.indexOf(step) + 1, total: STEP_ORDER.length } })
  }, [step])

  useEffect(() => {
    audio.setProfile('menu')
  }, [])

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
  const disabled = swapping || exiting

  return (
    <DesignFrame>
      <div className={exiting ? 'scene-body is-exiting' : 'scene-body'}>
        <JourneyHeader
          title="Casing PCB yang Ideal"
          badge={STEP_BADGE[step]}
          disabled={disabled}
          onHome={goHome}
          onBack={index > 0 ? () => goToStep(STEP_ORDER[index - 1]) : undefined}
        />

        <div className={swapping ? 'scene-step is-swapping' : 'scene-step'} key={step}>
          {step === 'materi' && <MateriStep onNext={() => goToStep('simulasi')} />}
          {step === 'simulasi' && <SimulasiStep onNext={() => goToStep('evaluasi')} />}
          {step === 'evaluasi' && <EvaluationView config={CAD_CASING_EVALUATION} onExitHome={goHome} />}
        </div>
      </div>
    </DesignFrame>
  )
}
