import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audio } from '../../audio/director'
import {
  SHEET_HEIGHT,
  SHEET_WIDTH,
  SHEET_X,
  SHEET_Y,
  isWireReady,
  resolveWireEnd,
  type CircuitLevel,
  type CircuitSlot,
  type PaletteItem,
} from '../../domain/desainSkema/circuits'
import ActionButton from '../../ui/ActionButton'
import { textureUrl } from '../../ui/assets/textures'
import { GhostSymbol, JunctionDot, SchematicSymbol, WIRE_FLOW_STROKE, WIRE_STROKE } from './SchematicSymbol'
import './workbench.css'

/**
 * Langkah 2.1-2.3 — one "kertas kerja" work sheet: drag components onto the
 * schematic, watch the wires draw themselves in as the circuit completes,
 * then drag the etiket into place to finish.
 *
 * Circuit content is `circuits.ts`, untouched, and the drop rules are the
 * canvas build's: snap within SNAP_RADIUS of a slot, the kind has to match, a
 * wrong slot buzzes and springs back, the etiket unlocks only once every slot
 * is filled.
 *
 * What changed is the cost of a drag. The canvas version repainted the
 * dragged card, every ghost box's highlight state and the palette on each
 * pointermove — with a repaint-skip cache bolted on precisely because that
 * was too much. Here the dragged card moves by `transform`, the ghost
 * highlight is one class toggle on the slot under the pointer, and the sheet
 * itself does not re-render at all.
 */

const LEFT_PANEL = { x: 26, y: 192, width: 382, height: 827 }
const RIGHT_PANEL = { x: 472, y: 192, width: 1355, height: 737 }

/** Row width lives in workbench.css; the height and gap drive the list's own layout maths. */
const PALETTE_ROW_HEIGHT = 84
const PALETTE_ROW_GAP = 14
const PALETTE_TOP = LEFT_PANEL.y + 148
const PALETTE_CENTER_X = LEFT_PANEL.x + LEFT_PANEL.width / 2
const PALETTE_VIEWPORT_TOP = PALETTE_TOP - 6
const PALETTE_VIEWPORT_BOTTOM = LEFT_PANEL.y + LEFT_PANEL.height - 20

const SNAP_RADIUS = 95
const ETIKET_SNAP_RADIUS = 110
const WIRE_DRAW_MS = 260
/** How long a dropped card takes to travel to its slot before the symbol takes over. */
const PLACE_MS = 200

const ETIKET = { width: 322, height: 84 }
const ETIKET_RECT = {
  x: SHEET_X + SHEET_WIDTH - ETIKET.width - 16,
  y: SHEET_Y + SHEET_HEIGHT - ETIKET.height - 16,
  width: ETIKET.width,
  height: ETIKET.height,
}

/** Ghost drop-target box: centred on the slot, name label inside the box, below the symbol. */
const GHOST_PAD = 16
const GHOST_THICKNESS_HALF = 20
const GHOST_LABEL_GAP = 6
const GHOST_LABEL_HEIGHT = 20

function ghostBoxRect(slot: CircuitSlot) {
  const horizontal = slot.orientation === 'horizontal'
  const halfWidth = horizontal ? slot.extent + GHOST_PAD : GHOST_THICKNESS_HALF + GHOST_PAD
  const halfTop = horizontal ? GHOST_THICKNESS_HALF + GHOST_PAD : slot.extent + GHOST_PAD
  const halfBottom = halfTop + GHOST_LABEL_GAP + GHOST_LABEL_HEIGHT

  return {
    x: slot.x - halfWidth,
    y: slot.y - halfTop,
    width: halfWidth * 2,
    height: halfTop + halfBottom,
  }
}

interface DragState {
  item: PaletteItem | 'etiket'
  /** Pointer offset from the card's centre, design px, so it follows from wherever it was grabbed. */
  offsetX: number
  offsetY: number
  x: number
  y: number
}

export interface WorkbenchStepProps {
  level: CircuitLevel
  levelNumber: 1 | 2 | 3
  /** Skips straight to the finished sheet when the learner steps back into a level they already solved. */
  alreadySolved: boolean
  onSolved: () => void
  onNext: () => void
}

export default function WorkbenchStep({ level, levelNumber, alreadySolved, onSolved, onNext }: WorkbenchStepProps) {
  const [filled, setFilled] = useState<Set<string>>(() => (alreadySolved ? new Set(level.slots.map((s) => s.id)) : new Set()))
  const [placed, setPlaced] = useState<Set<string>>(() => (alreadySolved ? new Set(level.palette.map((p) => p.id)) : new Set()))
  const [etiketPlaced, setEtiketPlaced] = useState(alreadySolved)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hoverSlot, setHoverSlot] = useState<string | null>(null)
  const [rejected, setRejected] = useState<string | null>(null)
  /** Wires that have finished (or skipped) their reveal, so they stop animating. */
  const [settledWires, setSettledWires] = useState<Set<string>>(() => (alreadySolved ? new Set(level.wires.map((w) => w.id)) : new Set()))

  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const circuitComplete = filled.size === level.slots.length
  const solved = circuitComplete && etiketPlaced

  /** Wires whose endpoints are all in place — drawn, and animated on the transition. */
  const readyWires = useMemo(() => {
    const allSlotIds = level.slots.map((slot) => slot.id)
    return level.wires.filter((wire) => isWireReady(wire, filled, allSlotIds))
  }, [filled, level])

  useEffect(() => {
    const pending = readyWires.filter((wire) => !settledWires.has(wire.id))
    if (pending.length === 0) return

    const timer = window.setTimeout(() => {
      setSettledWires((current) => {
        const next = new Set(current)
        pending.forEach((wire) => next.add(wire.id))
        return next
      })
    }, WIRE_DRAW_MS)

    return () => window.clearTimeout(timer)
  }, [readyWires, settledWires])

  /** The circuit just finished: the etiket row unlocks so the learner can bring it over. */
  const wasComplete = useRef(circuitComplete)
  useEffect(() => {
    if (circuitComplete && !wasComplete.current) audio.play('allConnected')
    wasComplete.current = circuitComplete
  }, [circuitComplete])

  /** Converts a pointer event to design-space coordinates. */
  const toDesign = useCallback((clientX: number, clientY: number) => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return { x: 0, y: 0 }
    const scale = rect.width / 1920
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
  }, [])

  const beginDrag = useCallback(
    (event: React.PointerEvent, item: PaletteItem | 'etiket', home: { x: number; y: number }) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      const point = toDesign(event.clientX, event.clientY)
      const next: DragState = { item, offsetX: point.x - home.x, offsetY: point.y - home.y, x: point.x, y: point.y }
      dragRef.current = next
      setDrag(next)
    },
    [toDesign],
  )

  const moveDrag = useCallback(
    (event: React.PointerEvent) => {
      const current = dragRef.current
      if (!current) return

      const point = toDesign(event.clientX, event.clientY)
      const next = { ...current, x: point.x, y: point.y }
      dragRef.current = next
      setDrag(next)

      // Drop detection uses the pointer itself, not the card's origin: a card
      // grabbed by its icon would otherwise need to be dropped ~116px past the
      // slot, which reads as "only the text is draggable".
      if (current.item === 'etiket') {
        const cx = ETIKET_RECT.x + ETIKET_RECT.width / 2
        const cy = ETIKET_RECT.y + ETIKET_RECT.height / 2
        setHoverSlot(Math.hypot(point.x - cx, point.y - cy) <= ETIKET_SNAP_RADIUS ? 'etiket' : null)
        return
      }

      const nearest = nearestSlot(level, filled, point)
      setHoverSlot(nearest && nearest.kind === current.item.kind ? nearest.id : null)
    },
    [filled, level, toDesign],
  )

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      const current = dragRef.current
      dragRef.current = null
      setDrag(null)
      setHoverSlot(null)
      if (!current) return

      const point = toDesign(event.clientX, event.clientY)

      if (current.item === 'etiket') {
        const cx = ETIKET_RECT.x + ETIKET_RECT.width / 2
        const cy = ETIKET_RECT.y + ETIKET_RECT.height / 2
        if (Math.hypot(point.x - cx, point.y - cy) <= ETIKET_SNAP_RADIUS) {
          audio.play('pencil')
          window.setTimeout(() => {
            setEtiketPlaced(true)
            audio.play('lockSuccess')
            onSolved()
          }, PLACE_MS)
        }
        return
      }

      const slot = nearestSlot(level, filled, point)
      if (slot && slot.kind === current.item.kind) {
        audio.play('pencil')
        const item = current.item
        setPlaced((set) => new Set(set).add(item.id))
        window.setTimeout(() => setFilled((set) => new Set(set).add(slot.id)), PLACE_MS)
        return
      }

      if (slot) {
        // Wrong component for this slot: buzz and shake, then it springs back.
        audio.play('buzz')
        setRejected(current.item.id)
        window.setTimeout(() => setRejected(null), 300)
      }
    },
    [filled, level, onSolved, toDesign],
  )

  /** Rows still in the palette, in order — the list closes up as components are placed. */
  const remaining = level.palette.filter((item) => !placed.has(item.id))
  const etiketHome = { x: PALETTE_CENTER_X, y: PALETTE_TOP + remaining.length * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) + PALETTE_ROW_HEIGHT / 2 }

  return (
    <div ref={rootRef} className="wb-root" onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div className="wb-panel" style={{ left: LEFT_PANEL.x, top: LEFT_PANEL.y, width: LEFT_PANEL.width, height: LEFT_PANEL.height }}>
        <h3 className="wb-panel-title">Daftar Komponen</h3>
        <p className="wb-panel-subtitle">{'Seret komponen ke kertas kerja\ndi sisi kanan.'}</p>
      </div>

      <div className="wb-panel" style={{ left: RIGHT_PANEL.x, top: RIGHT_PANEL.y, width: RIGHT_PANEL.width, height: RIGHT_PANEL.height }}>
        <h3 className="wb-panel-title is-sheet">{`Kertas Kerja ${levelNumber} dari 3 — ${level.title}`}</h3>
      </div>

      {/* The sheet: dot grid, drop-target ghosts, wires, junctions, symbols. One
          SVG, so nothing here is re-rasterised when the palette changes. */}
      <div className="wb-sheet" style={{ left: SHEET_X, top: SHEET_Y, width: SHEET_WIDTH, height: SHEET_HEIGHT }}>
        <span className="wb-sheet-caption">KERTAS KERJA: AREA EFEKTIF GAMBAR</span>
      </div>

      <svg
        className="wb-layer"
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        aria-hidden="true"
      >
        {level.slots
          .filter((slot) => !filled.has(slot.id))
          .map((slot) => {
            const rect = ghostBoxRect(slot)
            const highlighted = hoverSlot === slot.id
            return (
              <g key={slot.id} className={highlighted ? 'wb-ghost is-active' : 'wb-ghost'}>
                <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={12} />
                <GhostSymbol slot={slot} />
                {slot.nameLabel && (
                  <text className="wb-ghost-label" x={slot.x} y={rect.y + rect.height - 12} textAnchor="middle">
                    {slot.nameLabel}
                  </text>
                )}
              </g>
            )
          })}

        {readyWires.map((wire) => {
          const from = resolveWireEnd(wire.from, level.slots)
          const to = resolveWireEnd(wire.to, level.slots)
          const length = Math.hypot(to.x - from.x, to.y - from.y)
          const settled = settledWires.has(wire.id)
          return (
            <g key={wire.id}>
              <line
                className={settled ? 'wb-wire' : 'wb-wire is-drawing'}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={WIRE_STROKE}
                style={{ '--wire-length': length } as React.CSSProperties}
              />
              {settled && (
                <line className="wb-wire-flow" x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={WIRE_FLOW_STROKE} />
              )}
            </g>
          )
        })}

        {circuitComplete && level.junctions.map((dot, i) => <JunctionDot key={i} x={dot.x} y={dot.y} />)}

        {level.slots
          .filter((slot) => filled.has(slot.id))
          .map((slot) => (
            <g key={slot.id}>
              <SchematicSymbol slot={slot} />
              {slot.nameLabel && (
                <text
                  className="wb-slot-label"
                  x={slot.x + (slot.orientation === 'vertical' ? -50 : 0)}
                  y={slot.y + (slot.orientation === 'horizontal' ? -44 : 0)}
                  textAnchor="middle"
                >
                  {slot.nameLabel}
                </text>
              )}
              {slot.valueLabel && (
                <text
                  className="wb-slot-value"
                  x={slot.x + (slot.orientation === 'horizontal' ? 0 : 60)}
                  y={slot.y + (slot.orientation === 'horizontal' ? 26 : 0)}
                  textAnchor="middle"
                >
                  {slot.valueLabel}
                </text>
              )}
            </g>
          ))}
      </svg>

      {/* Etiket drop target, then the real title block once it lands. */}
      {!etiketPlaced && (
        <div
          className={hoverSlot === 'etiket' ? 'wb-etiket-ghost is-active' : 'wb-etiket-ghost'}
          style={{ left: ETIKET_RECT.x, top: ETIKET_RECT.y, width: ETIKET_RECT.width, height: ETIKET_RECT.height }}
        >
          <img src={textureUrl('elec-etiket')} alt="" draggable={false} />
          Etiket kerja diletakkan di sini
        </div>
      )}
      {etiketPlaced && (
        <div className="wb-etiket" style={{ left: ETIKET_RECT.x, top: ETIKET_RECT.y, width: ETIKET_RECT.width, height: ETIKET_RECT.height }}>
          <div className="wb-etiket-head">
            <span>SKALA: 1:1</span>
            <span>DIGAMBAR: SISWA</span>
          </div>
          <div className="wb-etiket-body">{`${level.levelNumber}: ${level.etiketName}`}</div>
        </div>
      )}

      {/* Palette. Scrolls natively once the rows overflow the panel — level 3's
          full component set plus the etiket routinely does. */}
      <div
        className="wb-palette"
        style={{ left: LEFT_PANEL.x, top: PALETTE_VIEWPORT_TOP, width: LEFT_PANEL.width, height: PALETTE_VIEWPORT_BOTTOM - PALETTE_VIEWPORT_TOP }}
      >
        {remaining.map((item, index) => {
          const home = { x: PALETTE_CENTER_X, y: PALETTE_TOP + index * (PALETTE_ROW_HEIGHT + PALETTE_ROW_GAP) + PALETTE_ROW_HEIGHT / 2 }
          const dragging = drag && drag.item !== 'etiket' && drag.item.id === item.id
          return (
            <div
              key={item.id}
              className={`wb-row${dragging ? ' is-source' : ''}${rejected === item.id ? ' is-rejected' : ''}`}
              style={{ top: home.y - PALETTE_VIEWPORT_TOP - PALETTE_ROW_HEIGHT / 2 }}
              onPointerDown={(event) => beginDrag(event, item, home)}
            >
              <img className="wb-row-icon" src={textureUrl(item.texture)} alt="" draggable={false} />
              <span className="wb-row-label">{item.label}</span>
              <DragHandle />
            </div>
          )
        })}

        {!etiketPlaced && (
          <div
            className={`wb-row wb-row-etiket${circuitComplete ? ' is-unlocked' : ' is-locked'}${
              drag?.item === 'etiket' ? ' is-source' : ''
            }`}
            style={{ top: etiketHome.y - PALETTE_VIEWPORT_TOP - PALETTE_ROW_HEIGHT / 2 }}
            onPointerDown={(event) => {
              if (!circuitComplete) return
              beginDrag(event, 'etiket', etiketHome)
            }}
          >
            <img className="wb-row-icon" src={textureUrl('elec-etiket')} alt="" draggable={false} />
            <span className="wb-row-label">Etiket Kerja</span>
            <DragHandle />
            {!circuitComplete && (
              <span className="wb-row-lock">
                <Padlock />
                Selesaikan rangkaian dulu
              </span>
            )}
          </div>
        )}
      </div>

      {/* The travelling card lives at the root, not inside the palette: the
          palette scrolls, and a card dragged out of it would otherwise be
          clipped at the panel's edge the moment it left. */}
      {drag && (
        <div
          className="wb-row wb-drag-card"
          style={{ left: drag.x - drag.offsetX, top: drag.y - drag.offsetY }}
        >
          <img
            className="wb-row-icon"
            src={textureUrl(drag.item === 'etiket' ? 'elec-etiket' : drag.item.texture)}
            alt=""
            draggable={false}
          />
          <span className="wb-row-label">{drag.item === 'etiket' ? 'Etiket Kerja' : drag.item.label}</span>
          <DragHandle />
        </div>
      )}

      <div className="wb-footer">
        <ActionButton label="Lanjut →" minWidth={220} disabled={!solved} onPress={onNext} />
      </div>
    </div>
  )
}

/** The 3x3 grip dots at a palette row's right edge — the affordance that says "this card moves". */
function DragHandle() {
  return (
    <svg className="wb-row-handle" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {[1, 6, 11].map((y) => [1, 6, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />))}
    </svg>
  )
}

/** Padlock on the still-locked etiket row. */
function Padlock() {
  return (
    <svg className="wb-row-lock-glyph" width="22" height="24" viewBox="0 0 22 24" aria-hidden="true">
      <path d="M6 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="#b8860b" strokeWidth="3" strokeLinecap="round" />
      <rect x="3" y="10" width="16" height="12" rx="3" fill="#b8860b" />
      <circle cx="11" cy="16" r="2" fill="#fbf0dc" />
    </svg>
  )
}

/** Closest unfilled slot within the snap radius, or undefined. */
function nearestSlot(level: CircuitLevel, filled: ReadonlySet<string>, point: { x: number; y: number }) {
  return level.slots
    .filter((slot) => !filled.has(slot.id))
    .map((slot) => ({ slot, distance: Math.hypot(point.x - slot.x, point.y - slot.y) }))
    .filter(({ distance }) => distance <= SNAP_RADIUS)
    .sort((a, b) => a.distance - b.distance)[0]?.slot
}
