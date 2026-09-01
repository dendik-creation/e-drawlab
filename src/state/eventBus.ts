type Handler = (...args: never[]) => void

interface Binding {
  handler: Handler
  context?: unknown
}

/**
 * The app's one event bus, used by the state stores to publish changes.
 *
 * Previously a `Phaser.Events.EventEmitter`, which is why removing Phaser left
 * a 1 MB dependency in the bundle for the sake of three methods. This is those
 * three methods.
 *
 * `context` is supported because a listener registered as a bound method needs
 * an identity to be removed by — `off(event, this.handler, this)` has to match
 * the same pair `on` was given.
 */
class EventEmitter {
  private bindings = new Map<string, Binding[]>()

  on(event: string, handler: (...args: never[]) => void, context?: unknown) {
    const list = this.bindings.get(event) ?? []
    list.push({ handler: handler as Handler, context })
    this.bindings.set(event, list)
  }

  off(event: string, handler: (...args: never[]) => void, context?: unknown) {
    const list = this.bindings.get(event)
    if (!list) return

    const next = list.filter((binding) => binding.handler !== handler || (context !== undefined && binding.context !== context))
    if (next.length === 0) this.bindings.delete(event)
    else this.bindings.set(event, next)
  }

  emit(event: string, ...args: unknown[]) {
    // Iterate a copy: a handler that unsubscribes itself (or another) while
    // the event is being dispatched must not shift the list underneath us.
    const list = this.bindings.get(event)
    if (!list) return

    for (const binding of [...list]) {
      binding.handler.apply(binding.context, args as never[])
    }
  }
}

export const EventBus = new EventEmitter()
