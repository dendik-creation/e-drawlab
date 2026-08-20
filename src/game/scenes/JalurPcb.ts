import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, STAGE_RESIZE_EVENT } from '../stage'
import { audio } from '../audio/AudioDirector'
import { SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { EXIT_FADE_DURATION, type InteractiveTarget, type UiContext } from '../desainSkema/uiKit'
import { JalurPcbHeader } from '../jalurPcb/header'
import { MateriStep, materiEntranceDuration } from '../jalurPcb/materiStep'
import { SimulasiStep } from '../jalurPcb/simulasiStep'
import { EvaluationStep } from '../desainSkema/evaluationStep'
import { JALUR_PCB_EVALUATION } from '../jalurPcb/evaluation'
import goHomeUrl from '../../../assets/images/02_global_buttons/go_home.png'
import goBackUrl from '../../../assets/images/02_global_buttons/go_back.png'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.png'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.png'
import illustrationArusMengalirUrl from '../../../assets/images/07_jalur_pcb/materi/illustration_arus_mengalir.png'
import illustrationPerbandinganLebarUrl from '../../../assets/images/07_jalur_pcb/materi/illustration_perbandingan_lebar.png'
import illustrationPenampangPcbUrl from '../../../assets/images/07_jalur_pcb/materi/illustration_penampang_pcb.png'
import illustrationPerbandinganTipisLebarUrl from '../../../assets/images/07_jalur_pcb/materi/illustration_perbandingan_tipis_lebar.png'
import illustrationArusDiprosesUrl from '../../../assets/images/07_jalur_pcb/materi/illustration_arus_diproses.png'
import illustrationPengukuranLebarUrl from '../../../assets/images/07_jalur_pcb/materi/illustration_pengukuran_lebar.png'
// `?no-inline` forces Vite to always emit a real fetchable path instead of
// inlining these (small) SVGs as a data URI — Phaser's SVGFile loader assumes
// any `data:` URL it gets is base64 and unconditionally atob()s it, which
// throws on Vite's percent-encoded inline form.
import iconTrendUpUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_trend_up.svg?no-inline'
import iconCopperLayerUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_copper_layer.svg?no-inline'
import iconSubstrateUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_substrate.svg?no-inline'
import iconFactor01Url from '../../../assets/images/07_jalur_pcb/materi/icons/icon_factor_01.svg?no-inline'
import iconFactor02Url from '../../../assets/images/07_jalur_pcb/materi/icons/icon_factor_02.svg?no-inline'
import iconFactor03Url from '../../../assets/images/07_jalur_pcb/materi/icons/icon_factor_03.svg?no-inline'
import iconFactor04Url from '../../../assets/images/07_jalur_pcb/materi/icons/icon_factor_04.svg?no-inline'
import iconWarningUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_warning.svg?no-inline'
import iconCheckUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_check.svg?no-inline'
import iconArrowRightUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_arrow_right.svg?no-inline'
import iconArrowLeftRightUrl from '../../../assets/images/07_jalur_pcb/materi/icons/icon_arrow_left_right.svg?no-inline'
import rulerTicksUrl from '../../../assets/images/07_jalur_pcb/simulasi/ruler_ticks.svg?no-inline'
import evalQuestion1Url from '../../../assets/images/06_evaluation_pictures/02_Jalur_Pcb/question_image_1.png'
import evalLeftSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/left-side-electronics.png'
import evalRightSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/right-side-electronic.png'
import elecPcbTraceUrl from '../../../assets/images/03_electronic_assets/elec_pcb_trace_icon.png'
import elecIcChipUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip1.png'
import elecOpampUrl from '../../../assets/images/03_electronic_assets/elec_opamp_triangle.png'
import elecBatteryUrl from '../../../assets/images/03_electronic_assets/elec_battery.png'
import elecTerminalBlockUrl from '../../../assets/images/03_electronic_assets/elec_terminal_block_green.png'
import elecResistorUrl from '../../../assets/images/03_electronic_assets/elec_resistor.png'
import elecCapacitorUrl from '../../../assets/images/03_electronic_assets/elec_capacitor.png'
import elecDiodeUrl from '../../../assets/images/03_electronic_assets/elec_diode.png'
import elecInductorUrl from '../../../assets/images/03_electronic_assets/elec_inductor_coil.png'

/** Raster images this module draws — the global nav/bgm icons are the same assets Home/DesainSkema already load, reused by texture key. */
const JALUR_PCB_IMAGES: Record<string, string> = {
  'go-home': goHomeUrl,
  'go-back': goBackUrl,
  'bgm-on': bgmOnUrl,
  'bgm-off': bgmOffUrl,
  'jalur-arus-mengalir': illustrationArusMengalirUrl,
  'jalur-perbandingan-lebar': illustrationPerbandinganLebarUrl,
  'jalur-penampang-pcb': illustrationPenampangPcbUrl,
  'jalur-perbandingan-tipis-lebar': illustrationPerbandinganTipisLebarUrl,
  'jalur-arus-diproses': illustrationArusDiprosesUrl,
  'jalur-pengukuran-lebar': illustrationPengukuranLebarUrl,
  // Langkah 3 — the quiz's reference layout, its margin art, and the props the
  // results card draws from. The margin art and props are the same generic
  // electronics Desain Skema's evaluasi uses; only the question image is this
  // journey's own.
  'jalur-eval-question-1': evalQuestion1Url,
  'eval-left-side': evalLeftSideUrl,
  'eval-right-side': evalRightSideUrl,
  'elec-pcb-trace': elecPcbTraceUrl,
  'elec-ic-chip': elecIcChipUrl,
  'elec-opamp': elecOpampUrl,
  'elec-battery': elecBatteryUrl,
  'elec-terminal-block': elecTerminalBlockUrl,
  'elec-resistor': elecResistorUrl,
  'elec-capacitor': elecCapacitorUrl,
  'elec-diode': elecDiodeUrl,
  'elec-inductor': elecInductorUrl,
}

/** SVG icons, rasterized at 4x their authored viewBox so they stay crisp under camera zoom + stage overscan. */
const JALUR_PCB_ICONS: { key: string; url: string; size: number }[] = [
  { key: 'jalur-icon-trend-up', url: iconTrendUpUrl, size: 88 },
  { key: 'jalur-icon-copper-layer', url: iconCopperLayerUrl, size: 80 },
  { key: 'jalur-icon-substrate', url: iconSubstrateUrl, size: 80 },
  { key: 'jalur-icon-factor-01', url: iconFactor01Url, size: 60 },
  { key: 'jalur-icon-factor-02', url: iconFactor02Url, size: 60 },
  { key: 'jalur-icon-factor-03', url: iconFactor03Url, size: 80 },
  { key: 'jalur-icon-factor-04', url: iconFactor04Url, size: 72 },
  { key: 'jalur-icon-warning', url: iconWarningUrl, size: 80 },
  { key: 'jalur-icon-check', url: iconCheckUrl, size: 80 },
  { key: 'jalur-icon-arrow-right', url: iconArrowRightUrl, size: 80 },
  { key: 'jalur-icon-arrow-left-right', url: iconArrowLeftRightUrl, size: 72 },
]

/** Simulator measurement strip — wide and short, so it gets its own non-square rasterisation. */
const RULER_TEXTURE = { key: 'jalur-sim-ruler', url: rulerTicksUrl, width: 2042, height: 24 }

export function queueJalurPcbTextures(scene: Phaser.Scene) {
  Object.entries(JALUR_PCB_IMAGES).forEach(([key, url]) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  })
  JALUR_PCB_ICONS.forEach(({ key, url, size }) => {
    if (!scene.textures.exists(key)) scene.load.svg(key, url, { width: size, height: size })
  })
  if (!scene.textures.exists(RULER_TEXTURE.key)) {
    scene.load.svg(RULER_TEXTURE.key, RULER_TEXTURE.url, { width: RULER_TEXTURE.width, height: RULER_TEXTURE.height })
  }
}

export type JalurPcbStep = 'materi' | 'simulasi' | 'evaluasi'

const STEP_ORDER: JalurPcbStep[] = ['materi', 'simulasi', 'evaluasi']

const STEP_BADGE: Record<JalurPcbStep, string> = {
  materi: 'Langkah 1 - Materi',
  simulasi: 'Langkah 2 - Simulasi',
  evaluasi: 'Langkah 3 - Evaluasi',
}

/**
 * Jalur PCB journey: theory (Langkah 1), the trace-width simulator
 * (Langkah 2), then the evaluation quiz (Langkah 3).
 *
 * Structured the same way as `DesainSkema.ts`: a shared `header` + `body` the
 * step panels render into, a `uiContext` handed to every panel, a cross-fade
 * between steps, and one flat exit fade back to Home. Langkah 3 reuses
 * `EvaluationStep` itself, handed this journey's own question bank and copy.
 */
export class JalurPcb extends Phaser.Scene {
  private body!: Phaser.GameObjects.Container
  private header!: JalurPcbHeader
  private interactives: InteractiveTarget[] = []
  private step: JalurPcbStep = 'materi'
  private materiStep: MateriStep | null = null
  private simulasiStep: SimulasiStep | null = null
  private evaluationStep: EvaluationStep | null = null
  private exiting = false
  private transitioning = false
  private entering = true

  private readonly uiContext: UiContext = {
    scene: this,
    isLocked: () => this.inputLocked(),
    registerInteractive: (target) => this.interactives.push(target),
    unregisterInteractive: (target) => {
      this.interactives = this.interactives.filter((obj) => obj !== target)
    },
  }

  constructor() {
    super('JalurPcb')
  }

  preload() {
    queueJalurPcbTextures(this)
  }

  create() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#faf3e7')

    session.set({ currentScene: 'JalurPcb' })
    audio.setProfile('menu')

    // Scene instance is reused across visits — same re-entry hazard Home.ts
    // and DesainSkema.ts both guard against.
    this.step = 'materi'
    this.exiting = false
    this.transitioning = false
    this.entering = true
    this.interactives = []
    this.materiStep = null
    this.simulasiStep = null
    this.evaluationStep = null

    this.body = this.add.container(0, 0)
    this.header = new JalurPcbHeader(
      this.uiContext,
      () => this.goHome(),
      () => this.goToPreviousStep(),
    )
    this.header.render(STEP_BADGE[this.step], false, true)

    this.renderMateri(true)

    const recentre = () => applyStageCamera(this)
    const syncToggle = () => this.header.syncBgmToggle()
    EventBus.on(STAGE_RESIZE_EVENT, recentre)
    EventBus.on(SETTINGS_CHANGED_EVENT, syncToggle)
    this.events.once('shutdown', () => {
      EventBus.off(STAGE_RESIZE_EVENT, recentre)
      EventBus.off(SETTINGS_CHANGED_EVENT, syncToggle)
      this.materiStep?.teardown()
      this.simulasiStep?.teardown()
      this.evaluationStep?.teardown()
    })

    EventBus.emit('current-scene-ready', this)

    this.time.delayedCall(materiEntranceDuration(), () => {
      this.entering = false
    })
  }

  private inputLocked() {
    return this.exiting || this.transitioning || this.entering
  }

  private renderMateri(entrance: boolean) {
    this.materiStep = new MateriStep(this.uiContext)
    this.materiStep.render(this.body, entrance, () => this.goToNextStep())
  }

  private renderSimulasi() {
    this.simulasiStep = new SimulasiStep(this.uiContext)
    this.simulasiStep.render(this.body, () => this.goToNextStep())
  }

  /** Langkah 3 — the shared quiz component, fed this journey's own bank/copy (`jalurPcb/evaluation.ts`). */
  private renderEvaluasi() {
    this.evaluationStep = new EvaluationStep(this.uiContext, JALUR_PCB_EVALUATION, () => this.goHome())
    this.evaluationStep.render(this.body)
  }

  private goToPreviousStep() {
    if (this.inputLocked()) return
    const index = STEP_ORDER.indexOf(this.step)
    if (index <= 0) return

    audio.play('click')
    this.transitionTo(STEP_ORDER[index - 1])
  }

  private goToNextStep() {
    if (this.inputLocked()) return

    const next = STEP_ORDER[STEP_ORDER.indexOf(this.step) + 1]
    if (!next) return

    audio.play('click')
    this.transitionTo(next)
  }

  /**
   * Cross-fades body content only; the header stays mounted and is re-rendered
   * for the new step's badge. Every interactive from the old step is gone
   * before new ones register, so `interactives` never holds destroyed refs.
   */
  private transitionTo(step: JalurPcbStep) {
    this.transitioning = true
    this.disableInteractives()
    this.materiStep?.teardown()
    this.simulasiStep?.teardown()
    this.evaluationStep?.teardown()

    this.tweens.add({
      targets: this.body,
      alpha: 0,
      duration: 160,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.body.removeAll(true)
        this.materiStep = null
        this.simulasiStep = null
        this.evaluationStep = null
        this.interactives = []

        this.step = step
        // Evaluasi runs its own audio (quiz theme after the countdown, silence
        // under the results card); every other step sits on the ambient menu track.
        audio.setProfile('menu')
        this.header.render(STEP_BADGE[step], step !== 'materi', false)

        if (step === 'materi') this.renderMateri(false)
        else if (step === 'evaluasi') this.renderEvaluasi()
        else this.renderSimulasi()

        this.body.setAlpha(0)
        this.tweens.add({
          targets: this.body,
          alpha: 1,
          duration: 220,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.transitioning = false
          },
        })
      },
    })
  }

  private goHome() {
    if (this.inputLocked()) return
    this.exiting = true

    audio.play('click')
    this.disableInteractives()
    this.materiStep?.teardown()
    this.simulasiStep?.teardown()
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
