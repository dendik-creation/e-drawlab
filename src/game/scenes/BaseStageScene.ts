import Phaser from 'phaser'
import { EventBus } from '../EventBus'

type Cleanup = () => void

/**
 * Base for stage scenes that bind to `EventBus` (a singleton outside Phaser's
 * own scene lifecycle) and/or release their own exclusive textures on the way
 * out. Phaser already tears down a scene's own tweens/timers/input on
 * shutdown — what it can't know about is a listener registered on an external
 * emitter, which is exactly the leak every one of these scenes was manually
 * guarding against with its own `events.once('shutdown', ...)` block.
 *
 * Subclasses implement `onCreate` instead of overriding `create`.
 */
export abstract class BaseStageScene extends Phaser.Scene {
  private cleanups: Cleanup[] = []

  /** Runs once when this scene shuts down (scene switch or stop) — same call site as the old `events.once('shutdown', ...)` blocks. */
  protected onCleanup(fn: Cleanup) {
    this.cleanups.push(fn)
  }

  /** Binds `EventBus.on(event, handler)` and registers the matching `off` as cleanup — the on/off pairing every scene had to hand-write. */
  protected onBusEvent<T = unknown>(event: string, handler: (payload: T) => void) {
    EventBus.on(event, handler)
    this.onCleanup(() => EventBus.off(event, handler))
  }

  create(data: object): void {
    // Scene instances are reused across visits (Phaser calls create() again
    // rather than reconstructing the class), so a leftover cleanup list from
    // a previous visit must not carry over.
    this.cleanups = []
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.runCleanup())
    this.onCreate(data)
  }

  private runCleanup() {
    // Registration order, not reversed: a texture release registered after
    // an EventBus unbind (the DesainSkema/JalurPcb pattern) relies on that
    // unbind having already run, same as when it was one linear function body.
    for (const cleanup of this.cleanups) cleanup()
    this.cleanups.length = 0
  }

  protected abstract onCreate(data: object): void
}
