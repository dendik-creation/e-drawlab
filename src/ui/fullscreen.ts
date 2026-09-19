/**
 * Takes the lab fullscreen on the way in.
 *
 * Deliberately silent: no prompt before, no notice after, and no fallback UI
 * where the API is missing (for example iPhone Safari). There the lab simply
 * opens windowed; the stage's existing resize listeners handle viewport
 * changes in the same way as a rotation.
 *
 * Must be called synchronously inside a real user-gesture handler. A React
 * click handler runs in that trusted event, so the browser can grant the
 * fullscreen request.
 */
export function enterFullscreen() {
  const target = document.documentElement
  if (document.fullscreenElement || !target.requestFullscreen) return

  try {
    // Several mobile browsers reject orientation locking until fullscreen has
    // finished. Chaining it here avoids a timing race between the two APIs.
    void target
      .requestFullscreen()
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {})
  } catch {
    // Refused by permissions policy, or a gesture the browser did not count.
    // Entering the lab must not depend on it.
  }
}
