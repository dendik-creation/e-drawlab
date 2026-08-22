import Phaser from 'phaser'
import menuButtonsImg from '../../assets/images/atlases/menu-buttons.webp'
import menuButtonsJsonUrl from '../../assets/images/atlases/menu-buttons.json?url'
import globalButtonsImg from '../../assets/images/atlases/global-buttons.webp'
import globalButtonsJsonUrl from '../../assets/images/atlases/global-buttons.json?url'
import componentIconsImg from '../../assets/images/atlases/component-icons.webp'
import componentIconsJsonUrl from '../../assets/images/atlases/component-icons.json?url'

/**
 * Groups produced by scripts/pack_atlas.py (run it again after adding/
 * changing a source icon under 01_menu_buttons, 02_global_buttons or
 * 03_electronic_assets — it regenerates the two files below per group).
 * One `load.atlas()` here replaces what used to be one `load.image()` per
 * icon, so a scene that draws a handful of menu buttons or a palette of
 * component icons binds one GPU texture for the whole group instead of one
 * per icon.
 */
const ATLASES = {
  'menu-buttons': { image: menuButtonsImg, json: menuButtonsJsonUrl },
  'global-buttons': { image: globalButtonsImg, json: globalButtonsJsonUrl },
  'component-icons': { image: componentIconsImg, json: componentIconsJsonUrl },
} as const

export type AtlasGroup = keyof typeof ATLASES

/**
 * Every legacy single-image texture key that now lives inside an atlas frame
 * instead, keyed by its old standalone name — see scripts/pack_atlas.py's
 * GROUPS for the source list. Anything not listed here is still loaded as
 * its own standalone texture (one-off illustrations, backgrounds, etc. where
 * bundling into an atlas wouldn't cut a meaningful number of draw calls).
 */
const FRAME_ATLAS: Record<string, AtlasGroup> = {
  'btn-masuklab': 'menu-buttons',
  'menu-desain-skema': 'menu-buttons',
  'menu-jalur-pcb': 'menu-buttons',
  'menu-cad-casing': 'menu-buttons',
  'menu-evaluasi-akhir': 'menu-buttons',
  'menu-keluar': 'menu-buttons',

  'bgm-on': 'global-buttons',
  'bgm-off': 'global-buttons',
  'global-minus': 'global-buttons',
  'global-plus': 'global-buttons',
  'global-pause': 'global-buttons',
  'global-resume-play': 'global-buttons',
  'go-back': 'global-buttons',
  'go-home': 'global-buttons',

  'badge-checklist': 'component-icons',
  'elec-cube': 'component-icons',
  'elec-battery': 'component-icons',
  'elec-capacitor': 'component-icons',
  'elec-diode': 'component-icons',
  'elec-etiket': 'component-icons',
  'elec-ic-chip': 'component-icons',
  'elec-ic-chip-orange': 'component-icons',
  'elec-inductor': 'component-icons',
  'elec-led': 'component-icons',
  'elec-opamp': 'component-icons',
  'elec-pcb-trace': 'component-icons',
  'elec-resistor': 'component-icons',
  'elec-terminal-block': 'component-icons',
  'elec-usb-connector': 'component-icons',
}

/** Queues one atlas's image + JSON, skipping it if another scene already loaded it. */
export function queueAtlas(scene: Phaser.Scene, group: AtlasGroup) {
  if (scene.textures.exists(group)) return
  const atlas = ATLASES[group]
  scene.load.atlas(group, atlas.image, atlas.json)
}

/**
 * Resolves a legacy texture key to Phaser's `(texture, frame)` pair. Spread
 * this straight into `add.image`/`setTexture`/etc: `add.image(x, y,
 * ...iconFrame(scene, key))`. Always a fixed-length 2-tuple (rather than a
 * union of different lengths) so TS can spread it into a fixed-arity call;
 * keys that were never atlased come back with `frame: undefined`, which
 * every one of those call signatures already treats the same as an omitted
 * frame argument.
 */
export function iconFrame(scene: Phaser.Scene, key: string): readonly [string, string | undefined] {
  const group = FRAME_ATLAS[key]
  if (group && scene.textures.exists(group)) return [group, key] as const
  return [key, undefined] as const
}
