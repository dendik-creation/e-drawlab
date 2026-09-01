/**
 * Takes the lab fullscreen on the way in.
 *
 * Deliberately silent: no prompt before, no notice after, and no fallback UI
 * where the API is missing (iPhone Safari has no `Element.requestFullscreen`)
 * — there the lab simply opens windowed. The resulting viewport change is
 * picked up by the stage's existing resize listeners, same as a rotation.
 *
 * Must be called synchronously inside a real user-gesture handler. In the
 * canvas build this needed a raw DOM listener bolted onto the canvas, because
 * Phaser dispatches its own pointer events a frame later through an internal
 * queue — by which point Chrome no longer counts the gesture. A React
 * onPointerDown *is* the DOM event, so that workaround is gone.
 */
export function enterFullscreen() {
  const target = document.documentElement
  if (document.fullscreenElement || !target.requestFullscreen) return

  try {
    void target.requestFullscreen().catch(() => {})
  } catch {
    // Refused by permissions policy, or a gesture the browser did not count —
    // entering the lab must not depend on it.
  }

  // Best-effort: most browsers only grant Screen Orientation lock inside an
  // active fullscreen session, and several (iOS Safari) never expose the API
  // at all. Silently swallowed either way — the manual "please rotate" gate
  // already covers the case where this fails.
  void screen.orientation?.lock?.('landscape').catch(() => {})
}
