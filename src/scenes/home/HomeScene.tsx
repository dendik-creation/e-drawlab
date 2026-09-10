import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Info } from 'lucide-react'
import { audio } from '../../audio/director'
import { session } from '../../state/session'
import { isMenuCompleted, isMenuUnlocked } from '../../state/progress'
import { settings, toggleMute } from '../../state/settings'
import { DesignFrame } from '../../ui/stage/StageRoot'
import { useStageBounds } from '../../ui/stage/useStage'
import { BubbleItem, BubbleStage } from '../../ui/motion'
import Pressable from '../../ui/Pressable'
import ConfirmDialog from '../../ui/ConfirmDialog'
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
  MENU_VOICE_LINE,
  TENTANG_HUD_INSET_X,
  type HomeMenuAction,
} from './homeAssets'
import './home.css'

/** Logo, greeting card, then the five menu tiles — the order the canvas build registered them in. */
const BUBBLE_COUNT = 2 + MENU_ITEMS.length

/** Mascot's own entrance: slides in from off-screen right rather than bubbling with the rest. */
const MASCOT_ENTER_DELAY = 450
const MASCOT_ENTER_DURATION = 600

/**
 * A menu tile's voice-over is desktop-hover-only; on touch there is no real
 * hover, so it fires on tap instead, holding navigation open just long enough
 * for the line to start — capped well under 3s so a slow file never stalls
 * the tap.
 */
const MOBILE_VOICE_DELAY_CAP_MS = 2500

function subscribeSettings(listener: () => void) {
  return settings.subscribe(listener)
}

function mutedSnapshot() {
  return settings.get().muted
}

/** Touch/coarse-pointer devices get tap voice-overs instead of hover ones. */
function isCoarsePointer() {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false
}

export default function HomeScene({ navigate }: SceneProps) {
  const bounds = useStageBounds()
  const muted = useSyncExternalStore(subscribeSettings, mutedSnapshot)
  const [exiting, setExiting] = useState(false)
  const [talkingForMs, setTalkingForMs] = useState(0)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const pendingAction = useRef<HomeMenuAction | null>(null)
  /** Whichever menu tile's voice-over is currently playing, if any — at most one at a time. */
  const activeMenuVoice = useRef<HomeMenuAction | null>(null)

  useEffect(() => {
    session.set({ currentScene: 'Home', step: null })
    audio.setProfile('menu')
  }, [])

  /**
   * Fires the greeting voice line once the mascot's entrance has landed and
   * lip-syncs the mouth cycle to its length — self-corrects if the audio file
   * is ever re-recorded, since neither hardcodes a duration. The BGM duck
   * while it plays is `playVoiceLine`'s own doing, not this scene's.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTalkingForMs(audio.playVoiceLine('dubbingGreeting'))
    }, MASCOT_ENTER_DELAY + MASCOT_ENTER_DURATION)

    return () => {
      window.clearTimeout(timer)
      // The greeting is a Home-only one-shot; force it off on the way out so
      // it never bleeds into whatever scene comes next.
      audio.stopVoiceLine('dubbingGreeting')
    }
  }, [])

  /** Whatever menu tile is currently narrating must never survive into the next scene. */
  useEffect(() => {
    return () => {
      const key = activeMenuVoice.current
      if (key) audio.stopVoiceLine(MENU_VOICE_LINE[key]!)
    }
  }, [])

  /** Starts a menu tile's voice-over, stopping any other tile's still-running one first — only one plays at a time. */
  const playMenuVoice = useCallback((action: HomeMenuAction, voiceKey: NonNullable<(typeof MENU_VOICE_LINE)[HomeMenuAction]>) => {
    const previous = activeMenuVoice.current
    if (previous && previous !== action) audio.stopVoiceLine(MENU_VOICE_LINE[previous]!)

    activeMenuVoice.current = action
    const durationMs = audio.playVoiceLine(voiceKey, () => {
      if (activeMenuVoice.current === action) activeMenuVoice.current = null
    })
    return durationMs
  }, [])

  const beginExit = useCallback((action: HomeMenuAction) => {
    if (pendingAction.current) return
    pendingAction.current = action
    setExiting(true)
  }, [])

  /** `keluar` detours through a confirm dialog rather than exiting straight away. */
  const exitTo = useCallback(
    (action: HomeMenuAction) => {
      if (pendingAction.current) return
      if (action === 'keluar') {
        setConfirmExitOpen(true)
        return
      }
      beginExit(action)
    },
    [beginExit],
  )

  const confirmExit = useCallback(() => {
    setConfirmExitOpen(false)
    beginExit('keluar')
  }, [beginExit])

  const cancelExit = useCallback(() => {
    setConfirmExitOpen(false)
  }, [])

  /**
   * A menu tile's press: on a coarse pointer (no real hover to have fired the
   * voice-over already) it plays the tile's line first and holds the exit for
   * just long enough for it to start; on a mouse the line already played on
   * hover, so the press goes straight through.
   */
  const pressMenuItem = useCallback(
    (action: HomeMenuAction) => {
      if (pendingAction.current) return
      const voiceKey = MENU_VOICE_LINE[action]

      if (voiceKey && isCoarsePointer()) {
        const durationMs = playMenuVoice(action, voiceKey)
        const delay = Math.min(durationMs, MOBILE_VOICE_DELAY_CAP_MS)
        if (delay > 0) {
          window.setTimeout(() => exitTo(action), delay)
          return
        }
      }

      exitTo(action)
    },
    [exitTo, playMenuVoice],
  )

  /** Desktop-only: a tile's voice-over on hover, never on click (mobile's tap plays it instead — see `pressMenuItem`). */
  const hoverMenuItem = useCallback(
    (action: HomeMenuAction) => {
      if (isCoarsePointer()) return
      const voiceKey = MENU_VOICE_LINE[action]
      if (voiceKey) playMenuVoice(action, voiceKey)
    },
    [playMenuVoice],
  )

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

          {MENU_ITEMS.map((item, index) => {
            const locked = !isMenuUnlocked(item.action)

            return (
              <BubbleItem key={item.action} index={2 + index} box={{ x: item.x, y: item.y, w: item.width, h: item.height }}>
                <Pressable
                  className={locked ? 'home-menu-item is-locked' : 'home-menu-item'}
                  disabled={exiting || locked || confirmExitOpen}
                  ariaLabel={locked ? `${item.action} terkunci` : item.action}
                  onPress={() => pressMenuItem(item.action)}
                  onHover={() => hoverMenuItem(item.action)}
                >
                  <img className="edl-contain" src={item.src} alt="" draggable={false} />
                  {locked && <LockedMenuOverlay />}
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
            )
          })}
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
                disabled={exiting || confirmExitOpen}
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

        <div className="home-hud" style={{ left: bounds.right - TENTANG_HUD_INSET_X, top: bounds.top + HUD_INSET_Y }}>
          <BubbleStage count={1} exiting={exiting}>
            <BubbleItem index={0} origin="center">
              <Pressable
                className="home-tentang"
                disabled={exiting || confirmExitOpen}
                ariaLabel="tentang"
                onPress={() => pressMenuItem('tentang')}
                onHover={() => hoverMenuItem('tentang')}
              >
                <span className="home-tentang-icon" aria-hidden="true">
                  <Info size={21} strokeWidth={2.5} />
                </span>
                <span>Tentang</span>
              </Pressable>
            </BubbleItem>
          </BubbleStage>
        </div>

        <ConfirmDialog
          open={confirmExitOpen}
          title="Yakin ingin keluar?"
          message="Progres belajarmu tetap tersimpan. Kamu bisa lanjut lagi kapan saja."
          confirmLabel="Ya, Keluar"
          cancelLabel="Tidak"
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      </DesignFrame>
    </>
  )
}

/** Visual-only lock; the disabled native button keeps locked levels non-interactive. */
function LockedMenuOverlay() {
  return (
    <span className="home-menu-lock" aria-hidden="true">
      <svg viewBox="0 0 48 56" focusable="false">
        <path d="M13 24v-8a11 11 0 0 1 22 0v8" />
        <rect x="7" y="23" width="34" height="27" rx="4" />
        <path d="M24 33v8" />
      </svg>
    </span>
  )
}
