import type { ComponentType } from 'react'
import SplashScene from '../scenes/splash/SplashScene'
import HomeScene from '../scenes/home/HomeScene'
import EvaluasiAkhirScene from '../scenes/evaluation/EvaluasiAkhirScene'
import JalurPcbScene from '../scenes/jalurPcb/JalurPcbScene'
import CadCasingScene from '../scenes/cadCasing/CadCasingScene'
import DesainSkemaScene from '../scenes/desainSkema/DesainSkemaScene'

/** Every screen in the app, by the key both renderers agree on. */
export type SceneKey = 'Splash' | 'Home' | 'DesainSkema' | 'JalurPcb' | 'CadCasing' | 'EvaluasiAkhir'

export interface SceneProps {
  /** Leaves for another screen. The router decides whether that screen is React or Phaser. */
  navigate: (scene: SceneKey) => void
}

/**
 * Scenes that have migrated to React.
 *
 * This map is the migration's ledger: a key here renders as DOM, a key
 * missing from it still renders through Phaser, and `main.ts` registers a
 * bridge for every key listed so canvas scenes navigating to a migrated one
 * hand control back rather than drawing their own version. Add an entry as
 * each phase lands; when the map is complete, Phaser goes.
 */
export const REACT_SCENES: Partial<Record<SceneKey, ComponentType<SceneProps>>> = {
  Splash: SplashScene,
  Home: HomeScene,
  EvaluasiAkhir: EvaluasiAkhirScene,
  JalurPcb: JalurPcbScene,
  CadCasing: CadCasingScene,
  DesainSkema: DesainSkemaScene,
}

export function isReactScene(scene: SceneKey) {
  return scene in REACT_SCENES
}

export const REACT_SCENE_KEYS = () => Object.keys(REACT_SCENES) as SceneKey[]
