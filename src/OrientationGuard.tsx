import { useSyncExternalStore } from 'react'
import { LANDSCAPE_ONLY_EXEMPT_SCENES, session } from './game/state/session'

function subscribe(listener: () => void) {
  return session.subscribe(listener)
}

function getSnapshot() {
  const { portrait, currentScene } = session.get()
  return portrait && !LANDSCAPE_ONLY_EXEMPT_SCENES.has(currentScene)
}

/**
 * Full-viewport DOM overlay, sitting above `#phaser-container`, that blocks
 * every scene from Home onward while the device is in portrait. Living
 * outside the Phaser canvas means it can't be skipped by a scene that forgot
 * to wire its own gate — new scenes are covered for free.
 */
export default function OrientationGuard() {
  const blocked = useSyncExternalStore(subscribe, getSnapshot)

  if (!blocked) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: '#f2ecf5',
        color: '#0c6179',
        fontFamily: "'Baloo 2 Variable', 'Baloo 2', sans-serif",
        textAlign: 'center',
        padding: '0 32px',
        touchAction: 'none',
      }}
    >
      <svg width="72" height="72" viewBox="0 0 96 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="90" height="154" rx="18" fill="#ffffff" stroke="#2b909f" strokeWidth="6" />
        <rect x="17" y="25" width="62" height="112" rx="8" fill="#dff0f2" />
        <rect x="35" y="10" width="26" height="5" rx="2.5" fill="#2b909f" />
        <rect x="35" y="145" width="26" height="5" rx="2.5" fill="#2b909f" />
      </svg>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, maxWidth: 420 }}>
        Putar perangkat ke mode lanskap
      </p>
    </div>
  )
}
