import { useCallback, useEffect, useState } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../state/session'
import { DesignFrame } from '../../ui/stage/StageRoot'
import JourneyHeader from '../../ui/JourneyHeader'
import type { SceneProps } from '../../app/scenes'
import { ASET_GAMBAR, ASET_MUSIK, DEVELOPER_PROFILE } from './tentangContent'
import mascotUrl from '../../../assets/images/00_identity/mascot.webp'
import MascotMouth from '../home/MascotMouth'
import { MASCOT_BOX } from '../home/homeAssets'
import '../evaluation/scene.css'
import './tentang.css'

/**
 * Tentang — credits page reachable from Home's "Tentang" HUD button. A
 * single static card (no steps, no evaluation), sharing the journey shell's
 * fade-out-on-home transition with `EvaluasiAkhirScene`.
 */

/** Displayed mascot width in the bottom-right pocket; the wrapper is laid out at the art's native size and scaled down, so `MascotMouth`'s frame coordinates (authored against `MASCOT_BOX`) still land correctly. */
const MASCOT_DISPLAY_WIDTH = 260
const MASCOT_SCALE = MASCOT_DISPLAY_WIDTH / MASCOT_BOX.width

const PROFILE_ROWS: { label: string; value: string }[] = [
  { label: 'Judul', value: DEVELOPER_PROFILE.judul },
  ...DEVELOPER_PROFILE.pengembang.map((p) => ({ label: p.peran, value: p.nama })),
  { label: 'Program Keahlian', value: DEVELOPER_PROFILE.programKeahlian },
  { label: 'Instansi', value: DEVELOPER_PROFILE.instansi },
]

export default function TentangScene({ navigate }: SceneProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    session.set({ currentScene: 'Tentang', step: null })
    audio.setProfile('menu')
  }, [])

  const goHome = useCallback(() => {
    if (exiting) return
    setExiting(true)
    audio.play('click')
    window.setTimeout(() => navigate('Home'), 200)
  }, [exiting, navigate])

  return (
    <DesignFrame>
      <div className={exiting ? 'scene-body is-exiting' : 'scene-body'}>
        <JourneyHeader title="Tentang" variant="single" disabled={exiting} onHome={goHome} />

        <div className="scene-step">
          <section className="tg-card edl-fade-down">
            <h3 className="tg-section-title">Profil Pengembang</h3>
            <div className="tg-rows">
              {PROFILE_ROWS.map((row) => (
                <div className="tg-row" key={row.label}>
                  <span className="tg-row-label">{row.label}</span>
                  <span className="tg-row-colon">:</span>
                  <span className="tg-row-value">{row.value}</span>
                </div>
              ))}
            </div>

            <h3 className="tg-section-title" data-spaced="">
              Aset Gambar
            </h3>
            <p className="tg-text">{ASET_GAMBAR}</p>

            <h3 className="tg-section-title" data-spaced="">
              Musik
            </h3>
            <p className="tg-text">{ASET_MUSIK}</p>
          </section>

          <div
            className="tg-mascot"
            style={{ width: MASCOT_BOX.width, height: MASCOT_BOX.height, transform: `scale(${MASCOT_SCALE})` }}
          >
            <img className="edl-contain" src={mascotUrl} alt="" draggable={false} />
            <MascotMouth talkingForMs={0} />
          </div>
        </div>
      </div>
    </DesignFrame>
  )
}
