import { EventBus } from './eventBus'

export interface Store<T extends object> {
  /** The current state. Treat it as immutable — mutate through `set` so listeners fire. */
  get(): Readonly<T>
  /** Applies a shallow patch. Emits only when a value actually changed. */
  set(patch: Partial<T>): void
  /** Returns an unsubscribe function. */
  subscribe(listener: (state: Readonly<T>) => void): () => void
}

export interface StoreOptions<T extends object> {
  /** EventBus event emitted with the new state after every real change. */
  event: string
  /** Runs before the change is published — sanitising, clamping, persisting. */
  onChange?: (state: T) => void
}

/**
 * Minimal observable state container.
 *
 * Everything global in this app is a handful of scalars read by scenes that are
 * created and destroyed constantly, so the store publishes through the existing
 * EventBus rather than introducing a second notification mechanism.
 */
export function createStore<T extends object>(
  initial: T,
  options: StoreOptions<T>,
): Store<T> {
  const state = { ...initial }

  return {
    get: () => state,

    set(patch) {
      const changed = (Object.keys(patch) as (keyof T)[]).filter(
        (key) => patch[key] !== undefined && patch[key] !== state[key],
      )
      if (changed.length === 0) return

      changed.forEach((key) => {
        state[key] = patch[key] as T[typeof key]
      })
      options.onChange?.(state)
      EventBus.emit(options.event, state)
    },

    subscribe(listener) {
      const handler = (next: T) => listener(next)
      EventBus.on(options.event, handler)
      return () => {
        EventBus.off(options.event, handler)
      }
    },
  }
}
