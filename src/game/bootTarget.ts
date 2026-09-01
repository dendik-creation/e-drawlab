/**
 * Which scene Boot hands over to.
 *
 * Its own module, not part of `main`: `main` imports every scene to build the
 * scene list, so a scene importing back from `main` closes a cycle — the same
 * hazard `stage.ts` documents. Nothing here imports a scene.
 */
let requested: string | null = null

/** Set by the React router when the game must open straight into one journey. */
export function setBootTarget(scene: string | null) {
  requested = scene
}

export function bootTarget() {
  return requested ?? 'Splash'
}
