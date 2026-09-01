import { memo, useMemo } from 'react'
import { buildScene, type CasingInput } from '../../game/cadCasing/casingModel'
import {
  AXIS_TIPS,
  project,
  projectedExtent,
  shadeColor,
  solidBoxFaces,
  wireBoxEdges,
  type Camera,
} from './projection'

/**
 * The 3D casing preview, as SVG.
 *
 * The canvas version rebuilt this into a Graphics object on every repaint —
 * every slider tick and every frame of an orbit drag — clearing and re-issuing
 * roughly 60 filled quads, 24 wire edges, a dashed void box (stepped by hand,
 * segment by segment) and the axis gizmo. Here the same projection produces
 * SVG elements React diffs: an orbit updates the `points` attributes it has to
 * and nothing else, and the dashed void is one `stroke-dasharray`.
 *
 * `memo` matters here: a slider drag re-renders the whole panel, and this is
 * the only part whose work is non-trivial.
 */

const CASING_COLOR = '#0c6179'
const VOID_COLOR = '#ca8a04'
const PCB_COLOR = '#22c55e'
const COMPONENT_COLOR = '#a855f7'
const PILLAR_COLOR = '#94a3b8'

export interface Viewport3DProps {
  input: CasingInput
  camera: Camera
  width: number
  height: number
  /** Fraction of the box the model should fill — the canvas build's own auto-fit margins. */
  fitWidth: number
  fitHeight: number
  gizmoOrigin: { x: number; y: number }
  gizmoArm: number
}

function Viewport3D({ input, camera, width, height, fitWidth, fitHeight, gizmoOrigin, gizmoArm }: Viewport3DProps) {
  const model = useMemo(() => {
    const scene = buildScene(input)
    const extent = projectedExtent(scene.casing, camera)
    const scale = Math.max(Math.min(fitWidth / Math.max(extent.width, 1), fitHeight / Math.max(extent.height, 1)), 0.1)

    // `casingModel.ts` builds every box on a floor at z=0, so the casing's own
    // centre sits at z=dims.z/2, not at world (0,0,0). Projecting straight onto
    // the viewport centre would therefore centre the world origin, not the box
    // — which visibly overflows the casing toward +Z at every camera angle
    // except a dead-on top-down one. Re-anchor by however far the casing's true
    // centre projects from the world origin.
    const viewportOrigin = { x: width / 2, y: height / 2 }
    const centerShift = project(scene.casing.center, camera, scale, { x: 0, y: 0 })
    const origin = { x: viewportOrigin.x - centerShift.x, y: viewportOrigin.y - centerShift.y }

    const depthOf = (box: (typeof scene)['pcb']) => project(box.center, camera, 1, { x: 0, y: 0 }).depth

    return {
      casingEdges: wireBoxEdges(scene.casing, camera, scale, origin),
      voidEdges: wireBoxEdges(scene.void, camera, scale, origin),
      // Pillars are drawn back to front among themselves; the solids after them
      // are already in a fixed stacking order.
      pillars: [...scene.pillars]
        .sort((a, b) => depthOf(b) - depthOf(a))
        .map((pillar) => solidBoxFaces(pillar, camera, scale, origin)),
      pcb: solidBoxFaces(scene.pcb, camera, scale, origin),
      component: solidBoxFaces(scene.component, camera, scale, origin),
    }
  }, [camera, fitHeight, fitWidth, height, input, width])

  /**
   * The gizmo stays anchored to its own fixed viewport corner — it marks world
   * orientation, not the box's position, so it does not use the model origin.
   */
  const gizmo = useMemo(
    () =>
      AXIS_TIPS.map(({ key, vec, color }) => {
        const tip = project(vec, camera, gizmoArm, gizmoOrigin)
        const dx = tip.x - gizmoOrigin.x
        const dy = tip.y - gizmoOrigin.y
        const len = Math.hypot(dx, dy) || 1
        return { key, color, tip, label: { x: tip.x + (dx / len) * 9, y: tip.y + (dy / len) * 9 } }
      }),
    [camera, gizmoArm, gizmoOrigin],
  )

  return (
    <svg className="cs-viewport-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {model.casingEdges.map((edge, i) => (
        <line key={`c${i}`} {...edge} stroke={CASING_COLOR} strokeOpacity={0.85} strokeWidth={1.5} />
      ))}
      {model.voidEdges.map((edge, i) => (
        <line key={`v${i}`} {...edge} stroke={VOID_COLOR} strokeOpacity={0.55} strokeWidth={1.2} strokeDasharray="5 4" />
      ))}

      {model.pillars.map((faces, pillarIndex) =>
        faces.map((face, i) => (
          <polygon
            key={`p${pillarIndex}-${i}`}
            points={face.points}
            fill={shadeColor(PILLAR_COLOR, face.shade)}
            stroke={PILLAR_COLOR}
            strokeWidth={1}
          />
        )),
      )}
      {model.pcb.map((face, i) => (
        <polygon key={`b${i}`} points={face.points} fill={shadeColor(PCB_COLOR, face.shade)} stroke={PCB_COLOR} strokeWidth={1} />
      ))}
      {model.component.map((face, i) => (
        <polygon
          key={`k${i}`}
          points={face.points}
          fill={shadeColor(COMPONENT_COLOR, face.shade)}
          stroke={COMPONENT_COLOR}
          strokeWidth={1}
        />
      ))}

      {/* Backing plate + white halo: thin coloured lines alone wash out on the
          viewport's cream ground. */}
      <circle cx={gizmoOrigin.x} cy={gizmoOrigin.y} r={gizmoArm + 12} fill="#ffffff" fillOpacity={0.72} />
      {gizmo.map(({ key, color, tip, label }) => (
        <g key={key}>
          <line x1={gizmoOrigin.x} y1={gizmoOrigin.y} x2={tip.x} y2={tip.y} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
          <line x1={gizmoOrigin.x} y1={gizmoOrigin.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
          <text x={label.x} y={label.y} fill={color} fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="middle">
            {key.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default memo(Viewport3D)
