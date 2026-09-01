import { useMemo, useState } from 'react'
import { audio } from '../../audio/director'
import {
  COPPER_BAND_HEIGHT,
  COPPER_FACTOR,
  COPPER_LABEL,
  MIN_RECOMMENDED_WIDTH,
  POWER_RANGE,
  VOLTAGE_RANGE,
  WIDTH_RANGE,
  convertPower,
  currentFormula,
  decimalsFor,
  evaluate,
  formatFactor,
  formatPower,
  widthFormula,
  type CopperThickness,
  type PowerUnit,
  type SimulatorInput,
  type SliderRange,
  type TraceStatus,
} from '../../game/jalurPcb/traceModel'
import ActionButton from '../../ui/ActionButton'
import SimSlider from '../../ui/SimSlider'
import rulerUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/simulasi/ruler_ticks.svg'
import './simulasi.css'

/**
 * Langkah 2 — "Simulator Lebar Jalur PCB".
 *
 * All arithmetic still comes from `traceModel.ts`, untouched: this component
 * only renders what `evaluate()` returns. What changed is the cost of doing
 * so — the canvas version rebuilt the trace, the pads, the glow, the badge,
 * the cross-section and every readout on each drag tick (throttled to one
 * repaint per frame because it could not keep up), where here a slider move
 * updates the handful of DOM nodes whose text or size actually changed.
 */

/** Status ramps. Only the OK ramp exists in Figma — warning/danger extend it with the app's own semantic gold/red. */
interface StatusStyle {
  trace: string
  highlight: string
  badgeText: string
  evalText: string
  glyph: string
  badgeLabel: string
  message: string
  sfx: 'statusSafe' | 'statusWarning' | 'statusDanger'
}

const STATUS_STYLE: Record<TraceStatus, StatusStyle> = {
  ok: {
    trace: '#3e8b5c',
    highlight: '#7edba4',
    badgeText: '#7edba4',
    evalText: '#2c6b44',
    glyph: '✓',
    badgeLabel: 'Jalur Aman',
    message: 'Jalur memenuhi rekomendasi',
    sfx: 'statusSafe',
  },
  warning: {
    trace: '#c9971f',
    highlight: '#fddc6c',
    badgeText: '#fddc6c',
    evalText: '#8a6414',
    glyph: '!',
    badgeLabel: 'Jalur Kurang Lebar',
    message: 'Lebar jalur mendekati batas rekomendasi',
    sfx: 'statusWarning',
  },
  danger: {
    trace: '#c0392b',
    highlight: '#f08a7c',
    badgeText: '#f5a99e',
    evalText: '#8e2b20',
    glyph: '✕',
    badgeLabel: 'Jalur Berisiko',
    message: 'Lebar jalur di bawah rekomendasi',
    sfx: 'statusDanger',
  },
}

// Layout — design-space coordinates lifted from the Figma frame.
const LEFT_PANEL = { x: 206, y: 196, width: 420, height: 811 }
const RIGHT_PANEL = { x: 646, y: 196, width: 1069, height: 509 }
const BODY_TOP = 79
const SLIDER_WIDTH = 372
const SEGMENT_WIDTH = 118.66
const SEGMENT_GAP = 8

const VIZ_BOX = { x: 24, y: 85, width: 1021, height: 220 }
const TRACE_CENTER_X = 534.5
const TRACE_CENTER_Y = 170
const TRACE_HALF_LENGTH = 200
const PAD_RADIUS = 38.52
const BADGE_CENTER_Y = 285

/** Figma draws a 5.35 mm trace 64.2px tall — exactly 12px per millimetre. */
const TRACE_PX_PER_MM = 12
const HIGHLIGHT_RATIO = 17.976 / 64.2

const RESULT_ROW_Y = 321
const RESULT_ROW_HEIGHT = 168
const CARD_A_WIDTH = 496.71
const CARD_B_X = 536.71
const CARD_B_WIDTH = 508.29

function boundFormatter(range: SliderRange, suffix: string) {
  const decimals = decimalsFor(range.step)
  return (value: number) => `${Number(value.toFixed(decimals))} ${suffix}`
}

export default function SimulasiStep({ onNext }: { onNext: () => void }) {
  const [input, setInput] = useState<SimulatorInput>({
    power: 64600,
    unit: 'mW',
    voltage: 43,
    copper: '2',
    actualWidth: 5.35,
  })
  /** "Ukuran" switch: shows the dimension line + width label on the trace. */
  const [showMeasure, setShowMeasure] = useState(true)
  const [lastStatus, setLastStatus] = useState<TraceStatus | null>(null)

  const result = useMemo(() => evaluate(input), [input])
  const style = STATUS_STYLE[result.status]

  // The verdict sting fires on a *change* of status, never on every repaint,
  // and stays silent on the panel's first paint.
  if (result.status !== lastStatus) {
    if (lastStatus !== null) audio.play(style.sfx)
    setLastStatus(result.status)
  }

  const setUnit = (unit: PowerUnit) => {
    if (input.unit === unit) return
    // The reading is rescaled, not reset: 64600 mW comes back as 64.6 W, so
    // the calculated current is identical either side of the toggle.
    setInput((current) => ({ ...current, power: convertPower(current.power, current.unit, unit), unit }))
  }

  const traceThickness = Math.max(input.actualWidth * TRACE_PX_PER_MM, 2)

  return (
    <>
      <section className="sim-panel sim-left" style={{ left: LEFT_PANEL.x, top: LEFT_PANEL.y, width: LEFT_PANEL.width, height: LEFT_PANEL.height }}>
        <header className="sim-left-head">
          <h3 className="sim-left-title">Kontrol Input</h3>
          <p className="sim-left-subtitle">Atur parameter beban daya sistem</p>
        </header>

        <div className="sim-row" style={{ top: BODY_TOP + 16 }}>
          <SimSlider
            width={SLIDER_WIDTH}
            label="Beban Daya"
            range={POWER_RANGE[input.unit]}
            value={input.power}
            formatValue={(value) => `${formatPower(value, input.unit)} ${input.unit}`}
            formatBound={(value) => `${formatPower(value, input.unit)} ${input.unit}`}
            onChange={(power) => setInput((current) => ({ ...current, power }))}
            trailing={
              <div className="sim-unit-toggle">
                {(['mW', 'W'] as PowerUnit[]).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className="sim-unit-segment"
                    data-active={input.unit === unit ? '' : undefined}
                    onClick={() => setUnit(unit)}
                  >
                    {unit === 'mW' ? 'mW' : 'Watt'}
                  </button>
                ))}
              </div>
            }
          />
        </div>

        <div className="sim-rule" style={{ top: BODY_TOP + 110 }} />

        <div className="sim-row" style={{ top: BODY_TOP + 131 }}>
          <SimSlider
            width={SLIDER_WIDTH}
            label="Tegangan Sistem"
            range={VOLTAGE_RANGE}
            value={input.voltage}
            formatValue={(value) => `${value} V`}
            formatBound={boundFormatter(VOLTAGE_RANGE, 'V')}
            onChange={(voltage) => setInput((current) => ({ ...current, voltage }))}
          />
        </div>

        <div className="sim-rule" style={{ top: BODY_TOP + 223 }} />

        <div className="sim-row" style={{ top: BODY_TOP + 244 }}>
          <span className="sim-field-label">Ketebalan Tembaga PCB</span>
          <div className="sim-copper-segments">
            {(['0.5', '1', '2'] as CopperThickness[]).map((thickness) => (
              <button
                key={thickness}
                type="button"
                className="sim-copper-segment"
                data-active={input.copper === thickness ? '' : undefined}
                style={{ width: SEGMENT_WIDTH, marginRight: SEGMENT_GAP }}
                onClick={() => setInput((current) => ({ ...current, copper: thickness }))}
              >
                <span className="sim-copper-band" style={{ height: COPPER_BAND_HEIGHT[thickness] }} />
                <span className="sim-copper-label">{COPPER_LABEL[thickness]}</span>
              </button>
            ))}
          </div>

          <div className="sim-cross-card" style={{ width: SLIDER_WIDTH }}>
            <CrossSection thickness={input.copper} />
            <div className="sim-cross-copy">
              <span className="sim-cross-title">{COPPER_LABEL[input.copper]}</span>
              <span className="sim-cross-factor">{`Faktor koreksi: ×${formatFactor(COPPER_FACTOR[input.copper])}`}</span>
            </div>
          </div>
        </div>

        <div className="sim-rule" style={{ top: BODY_TOP + 437 }} />

        <div className="sim-row" style={{ top: BODY_TOP + 458 }}>
          <span className="sim-field-label">Arus Terhitung</span>
          <div className="sim-current-card" style={{ width: SLIDER_WIDTH }}>
            <span className="sim-current-value">{`${result.current.toFixed(3)} A`}</span>
            <span className="sim-current-formula">{currentFormula(input)}</span>
          </div>
        </div>

        <div className="sim-rule" style={{ top: BODY_TOP + 582 }} />

        <div className="sim-row sim-width-card" style={{ top: BODY_TOP + 603, width: SLIDER_WIDTH }}>
          <SimSlider
            width={340}
            label="Lebar Jalur Aktual"
            range={WIDTH_RANGE}
            value={input.actualWidth}
            formatValue={(value) => `${value.toFixed(2)} mm`}
            formatBound={boundFormatter(WIDTH_RANGE, 'mm')}
            onChange={(actualWidth) => setInput((current) => ({ ...current, actualWidth }))}
          />
        </div>
      </section>

      <section
        className="sim-panel sim-right"
        style={{ left: RIGHT_PANEL.x, top: RIGHT_PANEL.y, width: RIGHT_PANEL.width, height: RIGHT_PANEL.height }}
      >
        <h3 className="sim-viz-title">VISUALISASI LAYOUT (ZOOM)</h3>
        <div className="sim-rule is-light" style={{ top: 65 }} />

        <div className="sim-measure-switch" style={{ left: RIGHT_PANEL.width - 24 - 88, top: 20 }}>
          <span className="sim-measure-label">Ukuran</span>
          <button
            type="button"
            className="sim-switch"
            data-on={showMeasure ? '' : undefined}
            aria-pressed={showMeasure}
            aria-label="Tampilkan ukuran"
            onClick={() => setShowMeasure((value) => !value)}
          >
            <span className="sim-switch-knob" />
          </button>
        </div>

        {/* Dot grid is a repeating background rather than ~380 drawn circles. */}
        <div className="sim-viz" style={{ left: VIZ_BOX.x, top: VIZ_BOX.y, width: VIZ_BOX.width, height: VIZ_BOX.height }}>
          <img className="sim-ruler" src={rulerUrl} alt="" draggable={false} style={{ width: VIZ_BOX.width, height: 12 }} />

          <div
            className={result.status === 'danger' ? 'sim-trace-glow is-pulsing' : 'sim-trace-glow'}
            style={{
              left: TRACE_CENTER_X - TRACE_HALF_LENGTH,
              top: TRACE_CENTER_Y - VIZ_BOX.y - traceThickness / 2,
              width: TRACE_HALF_LENGTH * 2,
              height: traceThickness,
              background: style.trace,
            }}
          />

          <div
            className="sim-trace"
            style={{
              left: TRACE_CENTER_X - TRACE_HALF_LENGTH,
              top: TRACE_CENTER_Y - VIZ_BOX.y - traceThickness / 2,
              width: TRACE_HALF_LENGTH * 2,
              height: traceThickness,
              background: style.trace,
            }}
          >
            <span
              className="sim-trace-highlight"
              style={{ height: Math.max(traceThickness * HIGHLIGHT_RATIO, 1), background: style.highlight }}
            />
          </div>

          {[TRACE_CENTER_X - TRACE_HALF_LENGTH, TRACE_CENTER_X + TRACE_HALF_LENGTH].map((padX) => (
            <div
              key={padX}
              className="sim-pad"
              style={{ left: padX, top: TRACE_CENTER_Y - VIZ_BOX.y, width: PAD_RADIUS * 2, height: PAD_RADIUS * 2, background: style.trace }}
            >
              <span className="sim-pad-ring" />
              <span className="sim-pad-core" />
            </div>
          ))}

          {showMeasure && (
            <>
              <div
                className="sim-measure-line"
                style={{ left: TRACE_CENTER_X - 8, top: TRACE_CENTER_Y - VIZ_BOX.y - traceThickness / 2, background: style.highlight }}
              />
              <div
                className="sim-measure-line"
                style={{ left: TRACE_CENTER_X - 8, top: TRACE_CENTER_Y - VIZ_BOX.y + traceThickness / 2, background: style.highlight }}
              />
              <span className="sim-measure-chip" style={{ left: TRACE_CENTER_X, top: TRACE_CENTER_Y - VIZ_BOX.y, color: style.trace }}>
                {`${input.actualWidth.toFixed(2)}mm`}
              </span>
            </>
          )}

          <div className="sim-status-badge" style={{ left: TRACE_CENTER_X, top: BADGE_CENTER_Y - VIZ_BOX.y, borderColor: style.trace }}>
            <span className="sim-status-glyph" style={{ background: style.trace }}>
              {style.glyph}
            </span>
            <span className="sim-status-label" style={{ color: style.badgeText }}>
              {style.badgeLabel}
            </span>
          </div>
        </div>

        <div className="sim-result-card is-a" style={{ left: VIZ_BOX.x, top: RESULT_ROW_Y, width: CARD_A_WIDTH, height: RESULT_ROW_HEIGHT }}>
          <span className="sim-result-title">Lebar Jalur Direkomendasikan</span>
          <span className="sim-result-value">{`${result.recommendedWidth.toFixed(3)} mm`}</span>
          <span className="sim-result-formula">{widthFormula(input, result)}</span>
          {result.clamped && <span className="sim-min-badge">{`batas minimum ${MIN_RECOMMENDED_WIDTH} mm`}</span>}
        </div>

        <div
          className="sim-result-card is-b"
          style={{ left: CARD_B_X, top: RESULT_ROW_Y, width: CARD_B_WIDTH, height: RESULT_ROW_HEIGHT, borderLeftColor: style.trace }}
        >
          <span className="sim-result-title">Evaluasi Lebar Jalur</span>
          <div className="sim-eval-row">
            <div className="sim-eval-cell">
              <span className="sim-eval-caption">Direkomendasikan</span>
              <span className="sim-eval-value">{`${result.recommendedWidth.toFixed(2)} mm`}</span>
            </div>
            <div className="sim-eval-cell">
              <span className="sim-eval-caption">Aktual</span>
              <span className="sim-eval-value" style={{ color: style.evalText }}>{`${input.actualWidth.toFixed(2)} mm`}</span>
            </div>
          </div>
          <div className="sim-eval-message">
            <span className="sim-status-glyph" style={{ background: style.trace }}>
              {style.glyph}
            </span>
            <span style={{ color: style.evalText }}>{style.message}</span>
          </div>
        </div>
      </section>

      <div className="sim-footer">
        <ActionButton label="Lanjut →" minWidth={220} onPress={onNext} />
      </div>
    </>
  )
}

/**
 * The copper cross-section illustration, redrawn per thickness. Figma only
 * carries the 2 oz variant as a flat SVG, so the substrate/copper/highlight
 * geometry is reproduced here with that file's own colours and the copper band
 * scaled by the selected thickness.
 */
function CrossSection({ thickness }: { thickness: CopperThickness }) {
  const band = COPPER_BAND_HEIGHT[thickness] * 1.7
  const substrateTop = 17.43
  const copperTop = substrateTop - band

  return (
    <svg className="sim-cross-svg" viewBox="0 0 118 56" width="118" height="56" aria-hidden="true">
      <rect x="6.86" y={substrateTop} width="96" height="34.29" rx="2.5" fill="#66878e" fillOpacity="0.25" stroke="#66878e" strokeOpacity="0.6" />
      <rect x="6.86" y={copperTop} width="96" height={band} rx="1.7" fill="#b87333" />
      <rect x="8.57" y={copperTop + 0.9} width="92.57" height={Math.max(band * 0.35, 1.2)} rx="0.9" fill="#d89a5a" fillOpacity="0.7" />
      {/* Caliper tick marking the copper layer's height, as in the source SVG. */}
      <line x1="109.71" y1={copperTop} x2="109.71" y2={substrateTop} stroke="#0c6179" strokeWidth="1.3" />
    </svg>
  )
}
