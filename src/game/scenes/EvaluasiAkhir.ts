import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, STAGE_RESIZE_EVENT } from '../stage'
import { BaseStageScene } from './BaseStageScene'
import { audio } from '../audio/AudioDirector'
import { SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { EXIT_FADE_DURATION, type InteractiveTarget, type UiContext } from '../desainSkema/uiKit'
import { EvaluasiAkhirHeader } from '../evaluasiAkhir/header'
import { EvaluationStep } from '../desainSkema/evaluationStep'
import { EVALUASI_AKHIR_EVALUATION } from '../evaluasiAkhir/evaluation'
import goHomeUrl from '../../../assets/images/02_global_buttons/go_home.webp'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.webp'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.webp'
// Question reference images: paper-work-* is Desain Skema's, jalur-eval-question-1
// is Jalur PCB's — CAD Casing's bank has no image questions. Both are pulled in
// standalone here since this scene can be entered straight from Home without
// either journey scene ever having run first.
import paperWork1Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_1.webp'
import paperWork2Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_2.webp'
import paperWork3Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_3.webp'
import jalurEvalQuestion1Url from '../../../assets/images/06_evaluation_pictures/02_Jalur_Pcb/question_image_1.webp'
import evalLeftSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/left-side-electronics.webp'
import evalRightSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/right-side-electronic.webp'
import elecLedUrl from '../../../assets/images/03_electronic_assets/elec_led.webp'
import elecOpampUrl from '../../../assets/images/03_electronic_assets/elec_opamp_triangle.webp'
import elecIcChipUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip1.webp'
import elecBatteryUrl from '../../../assets/images/03_electronic_assets/elec_battery.webp'
import elecResistorUrl from '../../../assets/images/03_electronic_assets/elec_resistor.webp'
import elecTerminalBlockUrl from '../../../assets/images/03_electronic_assets/elec_terminal_block_green.webp'
import elecCapacitorUrl from '../../../assets/images/03_electronic_assets/elec_capacitor.webp'
import elecDiodeUrl from '../../../assets/images/03_electronic_assets/elec_diode.webp'
import elecInductorUrl from '../../../assets/images/03_electronic_assets/elec_inductor_coil.webp'

/** Textures this scene draws — the combined quiz's own question images plus the shared evaluasi chrome/props every journey's Langkah 3 already uses. */
const EVALUASI_AKHIR_TEXTURES: Record<string, string> = {
  'go-home': goHomeUrl,
  'bgm-on': bgmOnUrl,
  'bgm-off': bgmOffUrl,
  'paper-work-1': paperWork1Url,
  'paper-work-2': paperWork2Url,
  'paper-work-3': paperWork3Url,
  'jalur-eval-question-1': jalurEvalQuestion1Url,
  'eval-left-side': evalLeftSideUrl,
  'eval-right-side': evalRightSideUrl,
  'elec-led': elecLedUrl,
  'elec-opamp': elecOpampUrl,
  'elec-ic-chip': elecIcChipUrl,
  'elec-battery': elecBatteryUrl,
  'elec-resistor': elecResistorUrl,
  'elec-terminal-block': elecTerminalBlockUrl,
  'elec-capacitor': elecCapacitorUrl,
  'elec-diode': elecDiodeUrl,
  'elec-inductor': elecInductorUrl,
}

export function queueEvaluasiAkhirTextures(scene: Phaser.Scene) {
  Object.entries(EVALUASI_AKHIR_TEXTURES).forEach(([key, url]) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  })
}

/**
 * Evaluasi Akhir — Home's fourth menu item: a single-step scene (no materi,
 * no simulasi) that runs the shared `EvaluationStep` over a 10-question draw
 * pooled from every other journey's own bank. See `../evaluasiAkhir/evaluation.ts`
 * for the pooling + passing-grade rules.
 */
export class EvaluasiAkhir extends BaseStageScene {
  private body!: Phaser.GameObjects.Container
  private header!: EvaluasiAkhirHeader
  private interactives: InteractiveTarget[] = []
  private evaluationStep: EvaluationStep | null = null
  private exiting = false

  private readonly uiContext: UiContext = {
    scene: this,
    isLocked: () => this.inputLocked(),
    registerInteractive: (target) => this.interactives.push(target),
    unregisterInteractive: (target) => {
      this.interactives = this.interactives.filter((obj) => obj !== target)
    },
  }

  constructor() {
    super('EvaluasiAkhir')
  }

  preload() {
    queueEvaluasiAkhirTextures(this)
  }

  protected onCreate() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#faf3e7')

    session.set({ currentScene: 'EvaluasiAkhir' })
    audio.setProfile('menu')

    // Scene instance is reused across visits — same re-entry hazard every
    // other journey scene guards against.
    this.exiting = false
    this.interactives = []
    this.evaluationStep = null

    this.body = this.add.container(0, 0)
    this.header = new EvaluasiAkhirHeader(this.uiContext, () => this.goHome())
    this.header.render(true)

    this.evaluationStep = new EvaluationStep(this.uiContext, EVALUASI_AKHIR_EVALUATION, () => this.goHome())
    this.evaluationStep.render(this.body)

    this.onBusEvent(STAGE_RESIZE_EVENT, () => applyStageCamera(this))
    this.onBusEvent(SETTINGS_CHANGED_EVENT, () => this.header.syncBgmToggle())
    this.onCleanup(() => this.evaluationStep?.teardown())

    EventBus.emit('current-scene-ready', this)
  }

  private inputLocked() {
    return this.exiting
  }

  private goHome() {
    if (this.inputLocked()) return
    this.exiting = true

    audio.play('click')
    this.disableInteractives()
    this.evaluationStep?.teardown()

    this.tweens.add({
      targets: [this.header.container, this.body],
      alpha: 0,
      duration: EXIT_FADE_DURATION,
      ease: 'Sine.easeIn',
      onComplete: () => this.scene.start('Home'),
    })
  }

  private disableInteractives() {
    this.interactives.forEach((obj) => {
      this.tweens.killTweensOf(obj)
      obj.disableInteractive()
    })
  }
}
