import type { SceneKey } from '../../app/scenes'
import homeBgUrl from '../../../assets/images/05_backgrounds/home_bg.webp'
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.webp'
import mascotUrl from '../../../assets/images/00_identity/mascot.webp'
import mascotMouth1Url from '../../../assets/images/00_identity/mascout_mouth_1.webp'
import mascotMouth2Url from '../../../assets/images/00_identity/mascout_mouth_2.webp'
import greetingAppUrl from '../../../assets/images/05_backgrounds/greeting_app.webp'
import greetingMascotUrl from '../../../assets/images/05_backgrounds/greeting_mascot.webp'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.webp'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.webp'
import menuDesainSkemaUrl from '../../../assets/images/01_menu_buttons/menu_desain_skema.webp'
import menuJalurPcbUrl from '../../../assets/images/01_menu_buttons/menu_jalur_pcb.webp'
import menuCadCasingUrl from '../../../assets/images/01_menu_buttons/menu_cad_casing.webp'
import menuEvaluasiAkhirUrl from '../../../assets/images/01_menu_buttons/menu_evaluasi_akhir.webp'
import menuKeluarUrl from '../../../assets/images/01_menu_buttons/menu_keluar.webp'
import badgeChecklistUrl from '../../../assets/images/03_electronic_assets/badge_checklist.webp'

/**
 * Home's art and menu geometry, kept apart from the component so the splash
 * can preload the same list behind its progress bar without importing the
 * scene itself.
 *
 * Every coordinate is sliced straight from the Figma frame "Home" (node
 * 164:3, 1920x1080), as (x, y, width, height) with x/y the element's top-left
 * corner in design space.
 */

export const HOME_ART = {
  background: homeBgUrl,
  logo: mainLogoUrl,
  mascot: mascotUrl,
  greetingApp: greetingAppUrl,
  greetingMascot: greetingMascotUrl,
  bgmOn: bgmOnUrl,
  bgmOff: bgmOffUrl,
  badge: badgeChecklistUrl,
} as const

/** Mouth overlay frames. Talking is simulated by cycling between them — mascot.webp ships with no mouth at all. */
export const MOUTH_FRAMES = [
  { src: mascotMouth1Url, x: 1382.4331, y: 577.65, width: 50.3657, height: 26.7431 },
  { src: mascotMouth2Url, x: 1389.5085, y: 570.54, width: 44.1135, height: 34.5587 },
] as const

export const LOGO_BOX = { x: 213.74, y: 1.1, width: 707.45, height: 239.75 }
export const GREETING_APP_BOX = { x: 165.7, y: 275.15, width: 816.3, height: 169.42 }
export const MASCOT_BOX = { x: 1178.16, y: 247.55, width: 513.35, height: 773.06 }
export const GREETING_MASCOT_BOX = { x: 1104.13, y: 127.38, width: 289.73, height: 170.42 }
export const BGM_BOX = { x: 1711.06, y: 33.27, width: 157, height: 70 }

export const BGM_ON_SIZE = { width: 147, height: 66 }
export const BGM_OFF_SIZE = { width: 157, height: 70 }

/** HUD anchor distances, measured from the design frame's top-right corner to the BGM toggle's centre. */
export const HUD_INSET_X = 1920 - (BGM_BOX.x + BGM_BOX.width / 2)
export const HUD_INSET_Y = BGM_BOX.y + BGM_BOX.height / 2

export type HomeMenuAction = 'desain-skema' | 'jalur-pcb' | 'cad-casing' | 'evaluasi-akhir' | 'keluar'

export interface HomeMenuItem {
  action: HomeMenuAction
  src: string
  x: number
  y: number
  width: number
  height: number
}

/** The 2x2 grid plus the standalone exit button. */
export const MENU_ITEMS: HomeMenuItem[] = [
  { action: 'desain-skema', src: menuDesainSkemaUrl, x: 74.81, y: 475.83, width: 487.45, height: 228.91 },
  { action: 'jalur-pcb', src: menuJalurPcbUrl, x: 585.43, y: 475.83, width: 487.45, height: 228.91 },
  { action: 'cad-casing', src: menuCadCasingUrl, x: 74.81, y: 726.71, width: 487.46, height: 228.91 },
  { action: 'evaluasi-akhir', src: menuEvaluasiAkhirUrl, x: 585.43, y: 723.74, width: 487.45, height: 231.87 },
  { action: 'keluar', src: menuKeluarUrl, x: 76.81, y: 982.47, width: 200.8, height: 72.78 },
]

/** Where each menu action lands. `keluar` has no destination — it closes the tab. */
export const MENU_DESTINATION: Partial<Record<HomeMenuAction, SceneKey>> = {
  'desain-skema': 'DesainSkema',
  'jalur-pcb': 'JalurPcb',
  'cad-casing': 'CadCasing',
  'evaluasi-akhir': 'EvaluasiAkhir',
}

/** "Sudah dipelajari" badge — straddles a completed menu button's top-right corner. */
export const BADGE = { size: 44, insetX: 14, insetY: 10 }

/** Everything the splash decodes behind its progress bar so Home paints on frame one. */
export const HOME_IMAGE_URLS = [
  ...Object.values(HOME_ART),
  ...MOUTH_FRAMES.map((frame) => frame.src),
  ...MENU_ITEMS.map((item) => item.src),
]
