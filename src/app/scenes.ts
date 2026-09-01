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

/** Every screen, by key. */
export const REACT_SCENES: Record<SceneKey, ComponentType<SceneProps>> = {
  Splash: SplashScene,
  Home: HomeScene,
  EvaluasiAkhir: EvaluasiAkhirScene,
  JalurPcb: JalurPcbScene,
  CadCasing: CadCasingScene,
  DesainSkema: DesainSkemaScene,
}

