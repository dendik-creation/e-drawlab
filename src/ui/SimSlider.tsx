import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react'
import { audio } from '../audio/director'
import { clampToRange, type SliderRange } from '../domain/jalurPcb/traceModel'
import './simSlider.css'

/**
 * The measurement slider both simulators are built from.
 *
 * The canvas version was ~290 lines per journey of Graphics redraws, a
 * hand-rolled hit area, scene-level pointermove/pointerup bookkeeping, and a
 * throttle on `onChange` because a drag fired several times per frame and each
 * one repainted the whole panel. Here the drag is pointer-captured on one
 * element, the track and fill are two divs, and the thumb moves by `left` —
 * so a drag costs a style update, not a repaint of the scene.
 *
 * The detent tick is still throttled: that is about how the sound *feels*, not
 * about frame cost.
 */

/** Minimum gap between detent ticks. Faster than this and a drag becomes a buzz. */
const TICK_INTERVAL_MS = 55

export interface SimSliderProps {
  label: string
  range: SliderRange
  value: number
  onChange: (value: number) => void
  /** Reading shown at the right of the label row. */
  formatValue: (value: number) => string
  /** Captions under the two ends of the track. */
  formatBound: (value: number) => string
  /** Accent for the fill and thumb — the CAD Casing panel colour-codes each row. */
  accent?: string
  /** Extra control sharing the label row (the mW/Watt toggle). */
  trailing?: ReactNode
  width?: number
  className?: string
  style?: CSSProperties
}

export default function SimSlider({
  label,
  range,
  value,
  onChange,
  formatValue,
  formatBound,
  accent,
  trailing,
  width,
  className,
  style,
}: SimSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const lastTick = useRef(0)
  const lastValue = useRef(value)

  const span = range.max - range.min
  const fraction = span === 0 ? 0 : Math.min(1, Math.max(0, (value - range.min) / span))

  const applyFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return

      const rect = track.getBoundingClientRect()
      const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width
      const next = clampToRange(range.min + Math.min(1, Math.max(0, ratio)) * span, range)
      if (next === lastValue.current) return

      lastValue.current = next
      const now = performance.now()
      if (now - lastTick.current >= TICK_INTERVAL_MS) {
        lastTick.current = now
        audio.play('sliderTick')
      }
      onChange(next)
    },
    [onChange, range, span],
  )

  return (
    <div
      className={className ? `sim-slider ${className}` : 'sim-slider'}
      style={{ ...(width === undefined ? {} : { width }), ...(accent ? ({ '--slider-accent': accent } as CSSProperties) : {}), ...style }}
    >
      <div className="sim-slider-header">
        <span className="sim-slider-label">{label}</span>
        {trailing}
        <span className="sim-slider-value">{formatValue(value)}</span>
      </div>

      <div
        ref={trackRef}
        className="sim-slider-track"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
        onPointerDown={(event) => {
          // Capture on the track, so the value keeps following the finger even
          // once it leaves the 6px-tall strip — which it always does.
          event.currentTarget.setPointerCapture(event.pointerId)
          applyFromPointer(event.clientX)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          applyFromPointer(event.clientX)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          const direction = event.key === 'ArrowRight' ? 1 : -1
          onChange(clampToRange(value + direction * range.step, range))
        }}
      >
        <div className="sim-slider-fill" style={{ width: `${fraction * 100}%` }} />
        <div className="sim-slider-thumb" style={{ left: `${fraction * 100}%` }} />
      </div>

      <div className="sim-slider-bounds">
        <span>{formatBound(range.min)}</span>
        <span>{formatBound(range.max)}</span>
      </div>
    </div>
  )
}
