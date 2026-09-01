import { useSyncExternalStore } from 'react'
import { stageBounds, stageMetrics, type StageMetrics } from './stageMetrics'

function subscribe(listener: () => void) {
  return stageMetrics.subscribe(listener)
}

function getSnapshot() {
  return stageMetrics.get()
}

/** Current stage geometry in design units, re-rendering the caller when the viewport aspect changes. */
export function useStageMetrics(): StageMetrics {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Stage edges in design coordinates — for chrome that must hug a real viewport edge. */
export function useStageBounds() {
  return stageBounds(useStageMetrics())
}
