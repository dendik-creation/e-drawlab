import goHomeUrl from '../../../assets/images/02_global_buttons/go_home.webp'
import goBackUrl from '../../../assets/images/02_global_buttons/go_back.webp'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.webp'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.webp'
import elecResistorUrl from '../../../assets/images/03_electronic_assets/elec_resistor.webp'
import elecCapacitorUrl from '../../../assets/images/03_electronic_assets/elec_capacitor.webp'
import elecDiodeUrl from '../../../assets/images/03_electronic_assets/elec_diode.webp'
import elecLedUrl from '../../../assets/images/03_electronic_assets/elec_led.webp'
import elecIcChipUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip1.webp'
import elecIcChipOrangeUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip_orange.webp'
import elecInductorUrl from '../../../assets/images/03_electronic_assets/elec_inductor_coil.webp'
import elecOpampUrl from '../../../assets/images/03_electronic_assets/elec_opamp_triangle.webp'
import elecTerminalBlockUrl from '../../../assets/images/03_electronic_assets/elec_terminal_block_green.webp'
import elecUsbConnectorUrl from '../../../assets/images/03_electronic_assets/elec_usb_connector.webp'
import elecPcbTraceUrl from '../../../assets/images/03_electronic_assets/elec_pcb_trace_icon.webp'
import elecBatteryUrl from '../../../assets/images/03_electronic_assets/elec_battery.webp'
import elecEtiketUrl from '../../../assets/images/03_electronic_assets/elec_etiket.webp'
import elecCubeUrl from '../../../assets/images/03_electronic_assets/elec_3d_cube_icon.webp'
import badgeChecklistUrl from '../../../assets/images/03_electronic_assets/badge_checklist.webp'
import paperWork1Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_1.webp'
import paperWork2Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_2.webp'
import paperWork3Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_3.webp'
import jalurEvalQuestion1Url from '../../../assets/images/06_evaluation_pictures/02_Jalur_Pcb/question_image_1.webp'
import evalLeftSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/left-side-electronics.webp'
import evalRightSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/right-side-electronic.webp'

/**
 * Texture key -> URL.
 *
 * The content modules (`evaluationQuestions.json`, the per-journey
 * `EvaluationConfig`s) name their art by the texture keys the Phaser loader
 * used, and those files are content, not rendering — ADR-003 keeps them
 * unchanged through this migration. So the DOM renderer resolves the same
 * keys here instead, and a question bank a teacher edits keeps working.
 */
export const TEXTURE_URLS: Record<string, string> = {
  'go-home': goHomeUrl,
  'go-back': goBackUrl,
  'bgm-on': bgmOnUrl,
  'bgm-off': bgmOffUrl,

  'elec-resistor': elecResistorUrl,
  'elec-capacitor': elecCapacitorUrl,
  'elec-diode': elecDiodeUrl,
  'elec-led': elecLedUrl,
  'elec-ic-chip': elecIcChipUrl,
  'elec-ic-chip-orange': elecIcChipOrangeUrl,
  'elec-inductor': elecInductorUrl,
  'elec-opamp': elecOpampUrl,
  'elec-terminal-block': elecTerminalBlockUrl,
  'elec-usb-connector': elecUsbConnectorUrl,
  'elec-pcb-trace': elecPcbTraceUrl,
  'elec-battery': elecBatteryUrl,
  'elec-etiket': elecEtiketUrl,
  'elec-cube': elecCubeUrl,
  'badge-checklist': badgeChecklistUrl,

  'paper-work-1': paperWork1Url,
  'paper-work-2': paperWork2Url,
  'paper-work-3': paperWork3Url,
  'jalur-eval-question-1': jalurEvalQuestion1Url,
  'eval-left-side': evalLeftSideUrl,
  'eval-right-side': evalRightSideUrl,
}

/** Resolves a content-declared texture key. Unknown keys yield an empty src rather than throwing — a missing diagram must not take the quiz down. */
export function textureUrl(key: string): string {
  return TEXTURE_URLS[key] ?? ''
}
