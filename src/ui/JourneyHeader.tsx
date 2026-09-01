import { useSyncExternalStore } from 'react'
import { settings, toggleMute } from '../state/settings'
import Pressable from './Pressable'
import { textureUrl } from './assets/textures'
import './journeyHeader.css'

/**
 * Title, "Langkah N" badge, home/back icons and the BGM toggle — the chrome
 * every journey scene wears.
 *
 * One component where the canvas build had four near-identical header classes
 * (`desainSkema/header.ts`, `jalurPcb/header.ts`, `cadCasing/header.ts`,
 * `evaluasiAkhir/header.ts`), each rebuilding the whole container from
 * scratch on every step change. Here a step change is a prop change, so the
 * title and icons are never rebuilt — only the badge text updates.
 */

const BGM_ON_SIZE = { width: 147, height: 66 }
const BGM_OFF_SIZE = { width: 157, height: 70 }

export interface JourneyHeaderProps {
  title: string
  /** "Langkah N - …". Omitted on scenes with no step sequence. */
  badge?: string
  onHome: () => void
  /** Omitted on the first step of a journey, and on single-step scenes. */
  onBack?: () => void
  disabled?: boolean
  /**
   * `single` is Evaluasi Akhir's own geometry: title top-anchored higher, badge
   * lower, home icon further in — the Figma frame for a scene with no back
   * button places them differently rather than just hiding one icon.
   */
  variant?: 'journey' | 'single'
}

function subscribeSettings(listener: () => void) {
  return settings.subscribe(listener)
}

function mutedSnapshot() {
  return settings.get().muted
}

export default function JourneyHeader({
  title,
  badge,
  onHome,
  onBack,
  disabled = false,
  variant = 'journey',
}: JourneyHeaderProps) {
  const muted = useSyncExternalStore(subscribeSettings, mutedSnapshot)

  return (
    <div className="jh-root" data-variant={variant}>
      <h1 className="jh-title">{title}</h1>
      {badge && <div className="jh-badge">{badge}</div>}

      <Pressable className="jh-nav jh-home" disabled={disabled} ariaLabel="Ke beranda" onPress={onHome}>
        <img src={textureUrl('go-home')} alt="" draggable={false} />
      </Pressable>

      {onBack && (
        <Pressable className="jh-nav jh-back" disabled={disabled} ariaLabel="Langkah sebelumnya" onPress={onBack}>
          <img src={textureUrl('go-back')} alt="" draggable={false} />
        </Pressable>
      )}

      <Pressable
        className="jh-bgm"
        disabled={disabled}
        ariaLabel={muted ? 'Nyalakan suara' : 'Matikan suara'}
        onPress={toggleMute}
      >
        <img
          src={textureUrl(muted ? 'bgm-off' : 'bgm-on')}
          alt=""
          draggable={false}
          style={muted ? BGM_OFF_SIZE : BGM_ON_SIZE}
        />
      </Pressable>
    </div>
  )
}
