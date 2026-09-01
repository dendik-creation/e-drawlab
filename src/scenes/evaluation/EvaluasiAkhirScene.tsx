import { useCallback, useEffect, useState } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../state/session'
import { EVALUASI_AKHIR_EVALUATION } from '../../domain/evaluasiAkhir/evaluation'
import { DesignFrame } from '../../ui/stage/StageRoot'
import JourneyHeader from '../../ui/JourneyHeader'
import EvaluationView from './EvaluationView'
import type { SceneProps } from '../../app/scenes'
import './scene.css'

/**
 * Evaluasi Akhir — Home's fourth menu item: a single-step scene (no materi,
 * no simulasi) running the shared `EvaluationView` over a 10-question draw
 * pooled from every other journey's bank. Pooling and passing-grade rules
 * live in `evaluasiAkhir/evaluation.ts`, unchanged.
 */
export default function EvaluasiAkhirScene({ navigate }: SceneProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    session.set({ currentScene: 'EvaluasiAkhir', step: null })
    audio.setProfile('menu')
  }, [])

  const goHome = useCallback(() => {
    if (exiting) return
    setExiting(true)
    audio.play('click')
    // One flat fade covers the whole scene on the way out — no per-item
    // stagger to sit through.
    window.setTimeout(() => navigate('Home'), 200)
  }, [exiting, navigate])

  return (
    <DesignFrame>
      <div className={exiting ? 'scene-body is-exiting' : 'scene-body'}>
        <JourneyHeader
          title="Evaluasi Akhir"
          badge="Uji Pemahamanmu Seputar Elektronika"
          variant="single"
          disabled={exiting}
          onHome={goHome}
        />
        <div className="scene-step">
          <EvaluationView config={EVALUASI_AKHIR_EVALUATION} onExitHome={goHome} />
        </div>
      </div>
    </DesignFrame>
  )
}
