import arusMengalirUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/illustration_arus_mengalir.webp'
import perbandinganLebarUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/illustration_perbandingan_lebar.webp'
import penampangPcbUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/illustration_penampang_pcb.webp'
import perbandinganTipisLebarUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/illustration_perbandingan_tipis_lebar.webp'
import arusDiprosesUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/illustration_arus_diproses.webp'
import pengukuranLebarUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/illustration_pengukuran_lebar.webp'
import iconTrendUpUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_trend_up.svg'
import iconCopperLayerUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_copper_layer.svg'
import iconSubstrateUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_substrate.svg'
import iconFactor01Url from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_factor_01.svg'
import iconFactor02Url from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_factor_02.svg'
import iconFactor03Url from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_factor_03.svg'
import iconFactor04Url from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_factor_04.svg'
import iconArrowRightUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_arrow_right.svg'
import iconArrowLeftRightUrl from '../../../assets/images/03_electronic_assets/grouped/02_Pcb_Path/materi/icons/icon_arrow_left_right.svg'

/**
 * Jalur PCB's own art.
 *
 * The SVG icons are plain `<img>` sources here. The canvas build had to
 * rasterise each one through Phaser's SVG loader at 4x its authored viewBox to
 * survive the camera zoom, and had to force Vite to emit real files
 * (`?no-inline`) because that loader assumed any `data:` URL was base64 and
 * threw on Vite's percent-encoded form. A DOM renderer draws the vector
 * itself, at whatever the stage scale happens to be, so both workarounds are
 * gone.
 */
export const JALUR_ART = {
  arusMengalir: arusMengalirUrl,
  perbandinganLebar: perbandinganLebarUrl,
  penampangPcb: penampangPcbUrl,
  perbandinganTipisLebar: perbandinganTipisLebarUrl,
  arusDiproses: arusDiprosesUrl,
  pengukuranLebar: pengukuranLebarUrl,
} as const

export const JALUR_ICONS = {
  trendUp: iconTrendUpUrl,
  copperLayer: iconCopperLayerUrl,
  substrate: iconSubstrateUrl,
  factor01: iconFactor01Url,
  factor02: iconFactor02Url,
  factor03: iconFactor03Url,
  factor04: iconFactor04Url,
  arrowRight: iconArrowRightUrl,
  arrowLeftRight: iconArrowLeftRightUrl,
} as const

export const JALUR_IMAGE_URLS = [...Object.values(JALUR_ART), ...Object.values(JALUR_ICONS)]
