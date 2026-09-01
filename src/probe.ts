import { session } from './state/session'
import { audio } from './audio/director'

/**
 * Test probe for the render-migration harness (`scripts/perf`).
 *
 * The whole app draws into a canvas, so an automated run has no DOM to wait
 * on — it would otherwise have to guess how long each scene's entrance
 * animation takes, which is exactly what made the first baseline capture
 * click through a menu that had not become interactive yet. Exposing the
 * scene key lets the harness wait for a real state change instead.
 *
 * Opt-in via `?probe=1` so nothing is attached to `window` in a normal
 * session. A separate flag from index.html's `?debug=1` overlay, which paints
 * a log panel over the page and would end up in every screenshot.
 */
export function installProbe() {
  if (!/[?&]probe(=1)?(&|$)/.test(window.location.search)) return

  Object.defineProperty(window, '__edrawlab', {
    configurable: true,
    value: {
      /** Key of the scene currently on screen, e.g. 'Home', 'JalurPcb'. */
      get scene() {
        return session.get().currentScene
      },
      get session() {
        return session.get()
      },
      /** Which BGM/ambience track each layer is on — see AudioDirector.debugState. */
      get audio() {
        return audio.debugState
      },
    },
  })
}
