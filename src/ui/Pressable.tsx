import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { audio } from '../audio/director'
import './pressable.css'

/**
 * The app's one interaction feel, shared by every clickable thing — menu
 * tiles, nav icons, palette rows, quiz pills. Same choreography the canvas
 * build hand-animated per button (`uiKit.attachButtonBehaviour`): hover grows
 * it 5%, a press dips it to 92% and springs back, with the hover blip and the
 * click sound.
 *
 * The scales are CSS transitions rather than tweens, so a hover costs a
 * compositor animation instead of a per-frame tween the game loop has to run.
 */

export interface PressableProps {
  onPress: () => void
  /** While true, input is ignored and the press/hover states are dropped — the scene is animating in or out. */
  disabled?: boolean
  /** Sound fired on press. `null` for a button whose action makes its own sound. */
  pressSound?: 'click' | null
  className?: string
  style?: CSSProperties
  ariaLabel?: string
  children?: ReactNode
}

export default function Pressable({
  onPress,
  disabled = false,
  pressSound = 'click',
  className,
  style,
  ariaLabel,
  children,
}: PressableProps) {
  const [pressed, setPressed] = useState(false)
  /**
   * Touch has no real hover: a tap fires pointerover/pointerout around
   * pointerdown in either order. Tracking the pressed state in a ref as well
   * keeps the pointerup handler correct even when React has not re-rendered
   * yet, which is what made the canvas version's taps occasionally do nothing.
   */
  const pressedRef = useRef(false)

  const release = useCallback(
    (fire: boolean) => {
      if (!pressedRef.current) return
      pressedRef.current = false
      setPressed(false)
      if (!fire || disabled) return

      if (pressSound) audio.play(pressSound)
      onPress()
    },
    [disabled, onPress, pressSound],
  )

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className ? `edl-pressable ${className}` : 'edl-pressable'}
      data-pressed={pressed ? '' : undefined}
      disabled={disabled}
      style={style}
      onPointerEnter={() => {
        if (!disabled) audio.play('hover')
      }}
      onPointerDown={(event) => {
        if (disabled) return
        // Pointer capture keeps the release on this element even if the finger
        // drifts off it mid-press — a tap that slides slightly must still fire.
        event.currentTarget.setPointerCapture(event.pointerId)
        pressedRef.current = true
        setPressed(true)
      }}
      onPointerUp={() => release(true)}
      onPointerCancel={() => release(false)}
    >
      {children}
    </button>
  )
}
