import { useEffect, type ReactNode } from 'react'
import { DESIGN_HEIGHT, DESIGN_WIDTH, observeViewport } from './stageMetrics'
import { useStageMetrics } from './useStage'
import '../tokens.css'
import './stage.css'

/**
 * Mounts the design frame and keeps it fitted to the viewport.
 *
 * The scale is published as a CSS variable rather than applied per element:
 * one composited transform on the stage covers every descendant, so a
 * rotation or a browser-chrome resize costs a single style recalculation
 * instead of a full re-layout of the scene.
 */
export default function StageRoot({ children }: { children: ReactNode }) {
  const metrics = useStageMetrics()

  useEffect(() => observeViewport(), [])

  return (
    <div
      className="edl-stage-viewport"
      style={
        {
          '--edl-scale': metrics.scale,
          '--edl-stage-w': metrics.width,
          '--edl-stage-h': metrics.height,
          '--edl-design-w': DESIGN_WIDTH,
          '--edl-design-h': DESIGN_HEIGHT,
        } as React.CSSProperties
      }
    >
      <div className="edl-stage">{children}</div>
    </div>
  )
}

/** The 1920x1080 safe area every scene lays itself out inside. */
export function DesignFrame({ children }: { children: ReactNode }) {
  return <div className="edl-design-frame">{children}</div>
}
