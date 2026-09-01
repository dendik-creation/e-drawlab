import { useCallback, useMemo, useRef, useState } from 'react'
import { DEFAULT_INPUT, RANGES, computeCasing, type CasingInput } from '../../domain/cadCasing/casingModel'
import ActionButton from '../../ui/ActionButton'
import SimSlider from '../../ui/SimSlider'
import Viewport3D from './Viewport3D'
import { CAMERA_PRESETS, clampPitch, shortestEquivalentAngle, type Camera, type CameraKey } from './projection'
import iconParameterUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_parameter_panel.svg'
import iconAtasUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_atas.svg'
import iconSampingUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_samping.svg'
import iconDepanUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_depan.svg'
import iconIsometrikUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_isometrik.svg'
import iconResetUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_reset_view.svg'
import './simulasi.css'

/**
 * Langkah 2 — "Parameter CAD 3D & PCB" + "Visualisasi 3D".
 *
 * All sizing still comes from `casingModel.ts`, untouched. The model the
 * learner orbits is generated from those dimensions rather than traced from
 * Figma's single static pose — same "recompute, don't trace" approach as
 * before, now projected into SVG (see `Viewport3D`).
 */

const LEFT_PANEL = { x: 206, y: 271, width: 649, height: 580 }
const RIGHT_PANEL = { x: 871, y: 271, width: 844, height: 580 }

const CAMERA_ROW_Y = 22
const CAMERA_ROW_HEIGHT = 46
const VIEWPORT_TOP = CAMERA_ROW_Y + CAMERA_ROW_HEIGHT + 32
const LEGEND_HEIGHT = 46
const VIEWPORT_WIDTH = 842
const VIEWPORT_HEIGHT = RIGHT_PANEL.height - VIEWPORT_TOP - LEGEND_HEIGHT

/** How much of the viewport the model fills — the canvas build's own auto-fit margins. */
const FIT_WIDTH = VIEWPORT_WIDTH * 0.6
const FIT_HEIGHT = VIEWPORT_HEIGHT * 0.74
const GIZMO_ORIGIN = { x: VIEWPORT_WIDTH * 0.09, y: VIEWPORT_HEIGHT * 0.86 }
const GIZMO_ARM = 26

/** Degrees of orbit per pixel dragged. */
const ORBIT_SENSITIVITY = 0.4
/** Camera-preset snap, ms. */
const SNAP_MS = 320

const CAMERA_BUTTONS: { key: CameraKey; label: string; icon: string }[] = [
  { key: 'atas', label: 'Atas', icon: iconAtasUrl },
  { key: 'samping', label: 'Samping', icon: iconSampingUrl },
  { key: 'depan', label: 'Depan', icon: iconDepanUrl },
  { key: 'isometrik', label: 'Isometrik', icon: iconIsometrikUrl },
]

const LEGEND_ITEMS: { key: string; label: string; color: string; dashed?: boolean }[] = [
  { key: 'casing', label: 'Casing', color: '#0c6179' },
  { key: 'void', label: 'Void', color: '#ca8a04', dashed: true },
  { key: 'pcb', label: 'PCB', color: '#22c55e' },
  { key: 'komp', label: 'Komp', color: '#a855f7' },
  { key: 'pilar', label: 'Pilar', color: '#94a3b8' },
]

const GREEN_VALUE = '#22c55e'
const AMBER = '#b45309'
const BLUE = '#3b82f6'
const PURPLE = '#a855f7'
const SLATE = '#64748b'

interface SliderSpec {
  key: keyof CasingInput
  label: string
  color: string
  decimals: number
}

const PCB_SLIDERS: SliderSpec[] = [
  { key: 'pcbLength', label: 'Panjang PCB (X)', color: GREEN_VALUE, decimals: 0 },
  { key: 'pcbWidth', label: 'Lebar PCB (Y)', color: GREEN_VALUE, decimals: 0 },
  { key: 'pcbThickness', label: 'Tebal Papan PCB (Z)', color: GREEN_VALUE, decimals: 1 },
]

const LOWER_SLIDERS: SliderSpec[] = [
  { key: 'sideClearance', label: 'Celah Samping', color: AMBER, decimals: 0 },
  { key: 'wallThickness', label: 'Tebal Dinding', color: BLUE, decimals: 0 },
  { key: 'componentHeight', label: 'Tinggi Komponen', color: PURPLE, decimals: 0 },
  { key: 'pillarHeight', label: 'Tinggi Pilar', color: SLATE, decimals: 0 },
  { key: 'topClearance', label: 'Celah Bebas Atas', color: AMBER, decimals: 0 },
]

/** Trims a computed mm value to one decimal without a trailing ".0". */
function fmt(value: number) {
  return String(Number(value.toFixed(1)))
}

export default function SimulasiStep({ onNext }: { onNext: () => void }) {
  const [input, setInput] = useState<CasingInput>(DEFAULT_INPUT)
  const [camera, setCamera] = useState<Camera>(CAMERA_PRESETS.isometrik)
  const [activePreset, setActivePreset] = useState<CameraKey | null>('isometrik')

  const dims = useMemo(() => computeCasing(input), [input])

  const drag = useRef<{ x: number; y: number; camera: Camera } | null>(null)
  const snapFrame = useRef(0)

  const set = useCallback(
    (key: keyof CasingInput) => (value: number) => setInput((current) => ({ ...current, [key]: value })),
    [],
  )

  /** Tweens to a preset the short way round, rather than unwinding several turns. */
  const snapTo = useCallback((key: CameraKey) => {
    cancelAnimationFrame(snapFrame.current)
    setActivePreset(key)

    setCamera((from) => {
      const target = CAMERA_PRESETS[key]
      const toYaw = shortestEquivalentAngle(from.yaw, target.yaw)
      const started = performance.now()

      const step = () => {
        const t = Math.min(1, (performance.now() - started) / SNAP_MS)
        // Sine.easeInOut, matching the canvas tween.
        const eased = -(Math.cos(Math.PI * t) - 1) / 2
        setCamera({
          pitch: from.pitch + (target.pitch - from.pitch) * eased,
          yaw: from.yaw + (toYaw - from.yaw) * eased,
        })
        if (t < 1) snapFrame.current = requestAnimationFrame(step)
      }

      snapFrame.current = requestAnimationFrame(step)
      return from
    })
  }, [])

  return (
    <>
      <section className="cs-panel cs-left" style={{ left: LEFT_PANEL.x, top: LEFT_PANEL.y, width: LEFT_PANEL.width, height: LEFT_PANEL.height }}>
        <header className="cs-left-head">
          <img className="cs-left-icon" src={iconParameterUrl} alt="" draggable={false} />
          <h3 className="cs-left-title">Parameter CAD 3D &amp; PCB</h3>
        </header>

        <div className="cs-pcb-card">
          <div className="cs-pcb-badge">
            <span className="cs-pcb-badge-title">Ukuran PCB Dinamis</span>
            <span className="cs-pcb-badge-value">{`${fmt(input.pcbLength)} × ${fmt(input.pcbWidth)} × ${fmt(input.pcbThickness)} mm`}</span>
          </div>
          {PCB_SLIDERS.map((spec) => (
            <SimSlider
              key={spec.key}
              className="cs-slider"
              label={spec.label}
              accent={spec.color}
              range={RANGES[spec.key]}
              value={input[spec.key]}
              formatValue={(value) => `${value.toFixed(spec.decimals)} mm`}
              formatBound={(value) => `${value.toFixed(spec.decimals)} mm`}
              onChange={set(spec.key)}
            />
          ))}
        </div>

        <div className="cs-lower">
          {LOWER_SLIDERS.map((spec) => (
            <SimSlider
              key={spec.key}
              className="cs-slider"
              label={spec.label}
              accent={spec.color}
              range={RANGES[spec.key]}
              value={input[spec.key]}
              formatValue={(value) => `${value.toFixed(spec.decimals)} mm`}
              formatBound={(value) => `${value.toFixed(spec.decimals)} mm`}
              onChange={set(spec.key)}
            />
          ))}
        </div>
      </section>

      <section className="cs-panel cs-right" style={{ left: RIGHT_PANEL.x, top: RIGHT_PANEL.y, width: RIGHT_PANEL.width, height: RIGHT_PANEL.height }}>
        <div className="cs-camera-row" style={{ top: CAMERA_ROW_Y, height: CAMERA_ROW_HEIGHT }}>
          {CAMERA_BUTTONS.map((button) => (
            <button
              key={button.key}
              type="button"
              className="cs-camera-pill"
              data-active={activePreset === button.key ? '' : undefined}
              onClick={() => snapTo(button.key)}
            >
              <img src={button.icon} alt="" draggable={false} />
              {button.label}
            </button>
          ))}
          <button type="button" className="cs-camera-pill is-reset" onClick={() => snapTo('isometrik')}>
            <img src={iconResetUrl} alt="" draggable={false} />
            Reset Tampilan
          </button>
        </div>

        <p className="cs-caption" style={{ top: CAMERA_ROW_Y + CAMERA_ROW_HEIGHT + 10 }}>
          Klik untuk melihat sudut tertentu, atau seret gambar untuk memutar bebas.
        </p>

        <div
          className="cs-viewport"
          style={{ top: VIEWPORT_TOP, height: VIEWPORT_HEIGHT }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { x: event.clientX, y: event.clientY, camera }
            cancelAnimationFrame(snapFrame.current)
            setActivePreset(null)
          }}
          onPointerMove={(event) => {
            const start = drag.current
            if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return
            // Screen px are viewport px; the stage scale applies to both axes
            // equally, so the ratio the camera needs is unaffected by it.
            const scale = event.currentTarget.getBoundingClientRect().width / VIEWPORT_WIDTH || 1
            setCamera({
              yaw: start.camera.yaw + ((event.clientX - start.x) / scale) * ORBIT_SENSITIVITY,
              pitch: clampPitch(start.camera.pitch - ((event.clientY - start.y) / scale) * ORBIT_SENSITIVITY),
            })
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
          }}
        >
          <span className="cs-dimension-chip">{`Casing: ${fmt(dims.x)} × ${fmt(dims.y)} × ${fmt(dims.z)} mm`}</span>
          <Viewport3D
            input={input}
            camera={camera}
            width={VIEWPORT_WIDTH}
            height={VIEWPORT_HEIGHT}
            fitWidth={FIT_WIDTH}
            fitHeight={FIT_HEIGHT}
            gizmoOrigin={GIZMO_ORIGIN}
            gizmoArm={GIZMO_ARM}
          />
        </div>

        <div className="cs-legend" style={{ height: LEGEND_HEIGHT }}>
          {LEGEND_ITEMS.map((item) => (
            <span key={item.key} className="cs-legend-item">
              <span
                className="cs-legend-swatch"
                data-dashed={item.dashed ? '' : undefined}
                style={item.dashed ? { borderColor: item.color } : { background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <div className="cs-footer">
        <ActionButton label="Lanjut →" minWidth={220} onPress={onNext} />
      </div>
    </>
  )
}
