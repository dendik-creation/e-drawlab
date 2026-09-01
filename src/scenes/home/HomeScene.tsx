import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { audio } from '../../audio/director'
import { session } from '../../state/session'
import { isMenuCompleted } from '../../state/progress'
import { settings, toggleMute } from '../../state/settings'
import { DesignFrame } from '../../ui/stage/StageRoot'
import { useStageBounds } from '../../ui/stage/useStage'
import { BubbleItem, BubbleStage } from '../../ui/motion'
import Pressable from '../../ui/Pressable'
import MascotMouth from './MascotMouth'
import type { SceneProps } from '../../app/scenes'
import {
  BADGE,
  BGM_OFF_SIZE,
  BGM_ON_SIZE,
  GREETING_APP_BOX,
  GREETING_MASCOT_BOX,
  HOME_ART,
  HUD_INSET_X,
  HUD_INSET_Y,
  LOGO_BOX,
  MASCOT_BOX,
  MENU_DESTINATION,
  MENU_ITEMS,
  type HomeMenuAction,
} from './homeAssets'
import './home.css'

/** Logo, greeting card, then the five menu tiles — the order the canvas build registered them in. */
const BUBBLE_COUNT = 2 + MENU_ITEMS.length

/** Mascot's own entrance: slides in from off-screen right rather than bubbling with the rest. */
const MASCOT_ENTER_DELAY = 450
const MASCOT_ENTER_DURATION = 600

/** BGM fraction while the greeting voice line is playing — audible underneath, never fighting it. */
const DUBBING_DUCK_FACTOR = 0.2

function subscribeSettings(listener: () => void) {
  return settings.subscribe(listener)
}

function mutedSnapshot() {
  return settings.get().muted
}

export default function HomeScene({ navigate }: SceneProps) {
  const bounds = useStageBounds()
  const muted = useSyncExternalStore(subscribeSettings, mutedSnapshot)
  const [exiting, setExiting] = useState(false)
  const [talkingForMs, setTalkingForMs] = useState(0)
  const pendingAction = useRef<HomeMenuAction | null>(null)

  useEffect(() => {
    session.set({ currentScene: 'Home', step: null })
    audio.setProfile('menu')
  }, [])

  /**
   * Fires the greeting voice line once the mascot's entrance has landed,
   * ducking the BGM out of its way for exactly its length and lip-syncing the
   * mouth cycle to that same length — both self-correct if the audio file is
   * ever re-recorded, since neither hardcodes a duration.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const durationMs = audio.playVoiceLine('dubbingGreeting', () => audio.restoreMusic())
      if (durationMs > 0) audio.duckMusic(DUBBING_DUCK_FACTOR)
      setTalkingForMs(durationMs)
    }, MASCOT_ENTER_DELAY + MASCOT_ENTER_DURATION)

    return () => window.clearTimeout(timer)
  }, [])

  const exitTo = useCallback((action: HomeMenuAction) => {
    if (pendingAction.current) return
    pendingAction.current = action
    setExiting(true)
  }, [])

  /** Runs once the staggered exit has finished — the scene never navigates mid-animation. */
  const onExited = useCallback(() => {
    const action = pendingAction.current
    if (!action) return

    if (action === 'keluar') {
      // Browsers only allow window.close() on tabs opened by script; if it is
      // a no-op there is no further fallback.
      window.close()
      return
    }

    const destination = MENU_DESTINATION[action]
    if (destination) navigate(destination)
  }, [navigate])

  return (
    <>
      <img className="home-bg" src={HOME_ART.background} alt="" draggable={false} />

      <DesignFrame>
        <BubbleStage count={BUBBLE_COUNT} exiting={exiting} onExited={onExited}>
          <BubbleItem
            index={1}
            box={{ x: GREETING_APP_BOX.x, y: GREETING_APP_BOX.y, w: GREETING_APP_BOX.width, h: GREETING_APP_BOX.height }}
          >
            <img className="edl-contain" src={HOME_ART.greetingApp} alt="" draggable={false} />
          </BubbleItem>

          <BubbleItem index={0} box={{ x: LOGO_BOX.x, y: LOGO_BOX.y, w: LOGO_BOX.width, h: LOGO_BOX.height }}>
            {/* The idle rock lives on an inner element: the bubble wrapper
                owns the entrance transform, and two animations cannot share
                one `transform` property. */}
            <div className={exiting ? 'home-logo' : 'home-logo is-idle'}>
              <img className="edl-contain" src={HOME_ART.logo} alt="E-DrawLab" draggable={false} />
            </div>
          </BubbleItem>

          {MENU_ITEMS.map((item, index) => (
            <BubbleItem key={item.action} index={2 + index} box={{ x: item.x, y: item.y, w: item.width, h: item.height }}>
              <Pressable
                className="home-menu-item"
                disabled={exiting}
                ariaLabel={item.action}
                onPress={() => exitTo(item.action)}
              >
                <img className="edl-contain" src={item.src} alt="" draggable={false} />
                {/* Rides inside the button rather than beside it, so it
                    inherits every transform the button gets — a badge that
                    scales on its own schedule reads as pasted on. */}
                {isMenuCompleted(item.action) && (
                  <img
                    className="home-menu-badge"
                    src={HOME_ART.badge}
                    alt="Sudah dipelajari"
                    draggable={false}
                    style={{
                      left: item.width - BADGE.insetX - BADGE.size / 2,
                      top: BADGE.insetY - BADGE.size / 2,
                      width: BADGE.size,
                      height: BADGE.size,
                    }}
                  />
                )}
              </Pressable>
            </BubbleItem>
          ))}
        </BubbleStage>

        <div
          className={exiting ? 'home-mascot is-leaving' : 'home-mascot'}
          style={{
            left: MASCOT_BOX.x,
            top: MASCOT_BOX.y,
            width: MASCOT_BOX.width,
            height: MASCOT_BOX.height,
            animationDuration: `${MASCOT_ENTER_DURATION}ms`,
            animationDelay: exiting ? '0ms' : `${MASCOT_ENTER_DELAY}ms`,
          }}
        >
          <img className="edl-contain" src={HOME_ART.mascot} alt="" draggable={false} />
          <img
            className="home-mascot-bubble"
            src={HOME_ART.greetingMascot}
            alt=""
            draggable={false}
            style={{
              left: GREETING_MASCOT_BOX.x - MASCOT_BOX.x,
              top: GREETING_MASCOT_BOX.y - MASCOT_BOX.y,
              width: GREETING_MASCOT_BOX.width,
              height: GREETING_MASCOT_BOX.height,
            }}
          />
          <MascotMouth talkingForMs={talkingForMs} />
        </div>

        {/* Anchored to the stage's own top-right corner rather than the design
            frame's, so it hugs the true viewport edge at any aspect ratio —
            the design frame does not clip, so the coordinate can sit outside
            it. */}
        <div className="home-hud" style={{ left: bounds.right - HUD_INSET_X, top: bounds.top + HUD_INSET_Y }}>
          <BubbleStage count={1} exiting={exiting}>
            <BubbleItem index={0} origin="center">
              <Pressable
                className="home-bgm"
                disabled={exiting}
                ariaLabel={muted ? 'Nyalakan suara' : 'Matikan suara'}
                onPress={toggleMute}
              >
                <img
                  src={muted ? HOME_ART.bgmOff : HOME_ART.bgmOn}
                  alt=""
                  draggable={false}
                  style={muted ? BGM_OFF_SIZE : BGM_ON_SIZE}
                />
              </Pressable>
            </BubbleItem>
          </BubbleStage>
        </div>
      </DesignFrame>
    </>
  )
}
