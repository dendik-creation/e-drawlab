import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../game/state/session'
import { DesignFrame } from '../../ui/stage/StageRoot'
import { BubbleItem, BubbleStage } from '../../ui/motion'
import PhoneOutline from '../../ui/PhoneOutline'
import { enterFullscreen } from '../../ui/fullscreen'
import { preloadImages } from '../../ui/assets/preload'
import { HOME_IMAGE_URLS } from '../home/homeAssets'
import type { SceneProps } from '../../app/scenes'
import splashBgUrl from '../../../assets/images/05_backgrounds/splash_bg.webp'
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.webp'
import touchToHomeUrl from '../../../assets/images/05_backgrounds/touch_to_home.webp'
import './splash.css'

/**
 * Splash — both frames (loading / ready) as one scene: the logo and subtitle
 * are laid out once and never re-rendered, and only the bar↔gate region swaps
 * when loading finishes.
 *
 * Every coordinate below is the same design-space number the canvas version
 * used; see the constants at the top of the old `game/scenes/Splash.ts`.
 */

const BAR = { x: 960, y: 704.5, width: 738, height: 41 }
const GATE = { x: 960, y: 770.5 }

/** touch_to_home.webp's native canvas, displayed 1.5x so the tap affordance reads at splash scale. */
const TOUCH_ICON = { width: 115 * 1.5, height: 160 * 1.5 }
const HINT_BOX = { width: 480, height: 48 }
const HINT_Y = TOUCH_ICON.height / 2 + 18 + HINT_BOX.height / 2

/** Mock progress ahead of the real load, so the bar never sits at 0 while images are still being fetched. */
const MOCK_DURATION = 1000
const MOCK_TARGET = 0.4

const ENTRANCE_STAGGER = 120
const ENTRANCE_DURATION = 320

const SUBTITLE = 'Laboratorium Maya Interaktif\nuntuk Desain CAD Elektronika'
const HINT_LABEL = 'Ketuk dimana saja untuk melanjutkan'
const FOOTER_LABEL = 'Untuk Siswa Kelas X SMK Program Keahlian Teknik Elektronika'
const ROTATE_LABEL = 'Putar perangkat ke mode lanskap'

function subscribePortrait(listener: () => void) {
  return session.subscribe(listener)
}

function portraitSnapshot() {
  return session.get().portrait
}

export default function SplashScene({ navigate }: SceneProps) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [entering, setEntering] = useState(false)
  const portrait = useSyncExternalStore(subscribePortrait, portraitSnapshot)
  const enteringRef = useRef(false)

  useEffect(() => {
    session.set({ currentScene: 'Splash', step: null })
  }, [])

  useEffect(() => {
    let cancelled = false
    let frame = 0

    // The mock pass covers the gap before any real byte count exists; the
    // real load then drives the remaining 60%.
    const started = performance.now()
    const runMock = () => {
      const t = Math.min(1, (performance.now() - started) / MOCK_DURATION)
      // Sine.easeInOut, matching the canvas version's tween.
      const eased = -(Math.cos(Math.PI * t) - 1) / 2
      setProgress(eased * MOCK_TARGET)

      if (t < 1) {
        frame = requestAnimationFrame(runMock)
        return
      }
      void runRealLoad()
    }

    const runRealLoad = async () => {
      const onProgress = (value: number) => {
        if (!cancelled) setProgress(MOCK_TARGET + value * (1 - MOCK_TARGET))
      }

      // Home's art plus this scene's own tap affordance, so the next scene
      // paints without a pop-in — the same set the canvas build queued here.
      await preloadImages([touchToHomeUrl, ...HOME_IMAGE_URLS], onProgress)
      if (!cancelled) setReady(true)
    }

    frame = requestAnimationFrame(runMock)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [])

  const enterLab = useCallback(() => {
    if (enteringRef.current || portrait || !ready) return
    enteringRef.current = true
    setEntering(true)

    // This press is the browser's autoplay unlock point and the only gesture
    // that can grant fullscreen, so both happen here, synchronously.
    enterFullscreen()
    audio.play('click')
    audio.setProfile('menu')

    window.setTimeout(() => navigate('Home'), 180)
  }, [navigate, portrait, ready])

  const percent = Math.round(progress * 100)

  return (
    <>
      <img className="splash-bg" src={splashBgUrl} alt="" draggable={false} />

      {/* Drawn here rather than baked into splash_bg.webp so it always spans
          the true viewport edge, flush to the bottom, at any aspect ratio.
          Arrives with the tap gate, not during loading. */}
      {ready && (
        <div className="splash-footer">
          <span className="splash-footer-label">{FOOTER_LABEL}</span>
        </div>
      )}

      <DesignFrame>
        <BubbleStage count={3} stagger={ENTRANCE_STAGGER} duration={ENTRANCE_DURATION}>
          <BubbleItem index={0} origin="center" scaleFrom={0.6} box={{ x: 960, y: 390.5, w: 790, h: 263 }}>
            <img className="edl-cover" src={mainLogoUrl} alt="E-DrawLab" draggable={false} />
          </BubbleItem>

          <BubbleItem index={1} origin="center" scaleFrom={0.6} box={{ x: 960, y: 576 }}>
            <p className="splash-subtitle">{SUBTITLE}</p>
          </BubbleItem>

          <BubbleItem
            index={2}
            origin="center"
            scaleFrom={0.6}
            className={ready ? 'is-done' : undefined}
            box={{ x: BAR.x, y: BAR.y, w: BAR.width, h: BAR.height }}
          >
            <div
              className="splash-bar"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="splash-bar-fill"
                style={{ width: `${Math.max(progress * 100, (BAR.height / BAR.width) * 100)}%` }}
              />
            </div>
          </BubbleItem>

          <BubbleItem
            index={2}
            origin="center"
            scaleFrom={0.6}
            className={ready ? 'is-done' : undefined}
            box={{ x: 960, y: 768.5 }}
          >
            <p className="splash-progress-label">{`${percent}% Memuat Konten`}</p>
          </BubbleItem>
        </BubbleStage>

        {/* The two gates are mutually exclusive: the product is landscape-first
            (ADR-009), so a portrait viewport is asked to turn rather than
            served a reflowed layout. */}
        {ready && !portrait && (
          <div className="splash-gate" style={{ '--gate-x': `${GATE.x}px`, '--gate-y': `${GATE.y}px` } as React.CSSProperties}>
            <img
              className={entering ? 'splash-touch-icon is-pressed' : 'splash-touch-icon'}
              style={{ width: TOUCH_ICON.width, height: TOUCH_ICON.height }}
              src={touchToHomeUrl}
              alt=""
              draggable={false}
            />
            <div className="splash-hint" style={{ width: HINT_BOX.width, height: HINT_BOX.height, top: HINT_Y }}>
              {HINT_LABEL}
            </div>
          </div>
        )}

        {ready && portrait && (
          <div className="splash-gate" style={{ '--gate-x': `${GATE.x}px`, '--gate-y': `${GATE.y}px` } as React.CSSProperties}>
            <PhoneOutline className="splash-rotate-phone" size={160} />
            <p className="splash-rotate-label">{ROTATE_LABEL}</p>
          </div>
        )}
      </DesignFrame>

      {/* The icon is only the affordance hint — the whole screen is the
          hitbox, so a tap anywhere enters the lab. Left out entirely while
          portrait, so a stray tap cannot slip past the rotate gate. */}
      {ready && !portrait && (
        <button type="button" className="splash-tap-zone" aria-label="Masuk lab" onPointerDown={enterLab} />
      )}
    </>
  )
}
