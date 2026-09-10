import { useCallback, useEffect, useState } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../state/session'
import { DesignFrame } from '../../ui/stage/StageRoot'
import JourneyHeader from '../../ui/JourneyHeader'
import type { SceneProps } from '../../app/scenes'
import { ASET_GAMBAR, ASET_MUSIK, DAFTAR_PUSTAKA, DEVELOPER_PROFILE } from './tentangContent'
import '../evaluation/scene.css'
import './tentang.css'

/**
 * Tentang — credits page reachable from Home's "Tentang" HUD button. A
 * single static card (no steps, no evaluation), sharing the journey shell's
 * fade-out-on-home transition with `EvaluasiAkhirScene`.
 */

const PROFILE_ROWS: { label: string; value: string }[] = [
  { label: 'Nama', value: DEVELOPER_PROFILE.nama },
  { label: 'Mata Pelajaran', value: DEVELOPER_PROFILE.mataPelajaran },
  { label: 'Instansi', value: DEVELOPER_PROFILE.instansi },
  { label: 'Email', value: DEVELOPER_PROFILE.email },
  { label: 'Tahun Pembuatan', value: DEVELOPER_PROFILE.tahunPembuatan },
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

            <h3 className="tg-section-title" data-spaced="">
              Daftar Pustaka
            </h3>
            {DAFTAR_PUSTAKA.map((entry) => (
              <p className="tg-text tg-pustaka" key={entry}>
                {entry}
              </p>
            ))}
          </section>
        </div>
      </div>
    </DesignFrame>
  )
}
