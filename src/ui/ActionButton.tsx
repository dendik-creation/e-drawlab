import Pressable from './Pressable'
import './actionButton.css'

/**
 * The pill button used for every forward action in a journey — "Mulai
 * Evaluasi", "Soal Berikutnya", "Lihat Hasil", "Coba Lagi", "Ke Beranda",
 * "Lanjut". `primary` is the filled teal; `secondary` the outlined white.
 *
 * Sizing is content-driven rather than a caller-supplied pixel width: the
 * canvas version had to pass one because a Graphics rectangle cannot measure
 * its own label.
 */
export default function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  minWidth,
  className,
  pressSound = 'click',
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  /** Design-px floor, for rows where two buttons should match. */
  minWidth?: number
  className?: string
  /**
   * `null` where the action's own handler already makes the sound — the
   * canvas build hit a double click-tone exactly there ("Lanjutkan", whose
   * step transition plays its own).
   */
  pressSound?: 'click' | null
}) {
  return (
    <Pressable
      className={className ? `edl-action ${className}` : 'edl-action'}
      style={{ minWidth }}
      disabled={disabled}
      onPress={onPress}
      pressSound={pressSound}
    >
      <span className="edl-action-label" data-variant={variant}>
        {label}
      </span>
    </Pressable>
  )
}
