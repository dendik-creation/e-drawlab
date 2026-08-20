import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, STAGE_RESIZE_EVENT } from '../stage'
import { audio } from '../audio/AudioDirector'
import { SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { markMenuCompleted } from '../state/progress'
import { CIRCUIT_LEVELS } from '../desainSkema/circuits'
import { DESAIN_SKEMA_EVALUATION } from '../desainSkema/evaluation'
import { EXIT_FADE_DURATION, type InteractiveTarget, type UiContext } from '../desainSkema/uiKit'
import { DesainSkemaHeader } from '../desainSkema/header'
import { MateriStep, materiEntranceDuration } from '../desainSkema/materiStep'
import { WorkbenchStep } from '../desainSkema/workbenchStep'
import { EvaluationStep } from '../desainSkema/evaluationStep'
import elecResistorUrl from '../../../assets/images/03_electronic_assets/elec_resistor.png'
import elecCapacitorUrl from '../../../assets/images/03_electronic_assets/elec_capacitor.png'
import elecDiodeUrl from '../../../assets/images/03_electronic_assets/elec_diode.png'
import elecLedUrl from '../../../assets/images/03_electronic_assets/elec_led.png'
import elecIcChipUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip1.png'
import elecIcChipOrangeUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip_orange.png'
import elecInductorUrl from '../../../assets/images/03_electronic_assets/elec_inductor_coil.png'
import elecOpampUrl from '../../../assets/images/03_electronic_assets/elec_opamp_triangle.png'
import elecTerminalBlockUrl from '../../../assets/images/03_electronic_assets/elec_terminal_block_green.png'
import elecUsbConnectorUrl from '../../../assets/images/03_electronic_assets/elec_usb_connector.png'
import elecPcbTraceUrl from '../../../assets/images/03_electronic_assets/elec_pcb_trace_icon.png'
import elecBatteryUrl from '../../../assets/images/03_electronic_assets/elec_battery.png'
import elecEtiketUrl from '../../../assets/images/03_electronic_assets/elec_etiket.png'
import elecCubeUrl from '../../../assets/images/03_electronic_assets/elec_3d_cube_icon.png'
import goBackUrl from '../../../assets/images/02_global_buttons/go_back.png'
import goHomeUrl from '../../../assets/images/02_global_buttons/go_home.png'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.png'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.png'
import paperWork1Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_1.png'
import paperWork2Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_2.png'
import paperWork3Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_3.png'
import evalLeftSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/left-side-electronics.png'
import evalRightSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/right-side-electronic.png'

/** Textures this whole module draws. Kept separate from Home's texture map so each module preloads only what it needs. */
const DESAIN_SKEMA_TEXTURES: Record<string, string> = {
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
  'go-back': goBackUrl,
  'go-home': goHomeUrl,
  'bgm-on': bgmOnUrl,
  'bgm-off': bgmOffUrl,
  'paper-work-1': paperWork1Url,
  'paper-work-2': paperWork2Url,
  'paper-work-3': paperWork3Url,
  'eval-left-side': evalLeftSideUrl,
  'eval-right-side': evalRightSideUrl,
}

export function queueDesainSkemaTextures(scene: Phaser.Scene) {
  Object.entries(DESAIN_SKEMA_TEXTURES).forEach(([key, url]) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  })
}

export type JourneyStep = 'materi' | 'level-1' | 'level-2' | 'level-3' | 'evaluasi'

const STEP_ORDER: JourneyStep[] = ['materi', 'level-1', 'level-2', 'level-3', 'evaluasi']

const LEVEL_NUMBER: Record<Exclude<JourneyStep, 'materi' | 'evaluasi'>, 1 | 2 | 3> = {
  'level-1': 1,
  'level-2': 2,
  'level-3': 3,
}

/**
 * Desain Skema journey: theory (Langkah 1), then three progressively harder
 * schematic-building sheets (Langkah 2.1-2.3), then an evaluation quiz
 * (Langkah 3), matching the E-DrawLab Figma file's "Design Schema Scene"
 * (node 29:30).
 *
 * This class is the orchestrator only — header chrome, and each step's own
 * rendering, own interactive drag/drop or quiz logic, and own teardown live
 * in `../desainSkema/{header,materiStep,workbenchStep,evaluationStep}.ts`,
 * sharing the button/animation vocabulary in `../desainSkema/uiKit.ts`. This
 * scene's job is just: which step is current, the shared `body` content
 * container transitions swap in and out of, and the handful of things that
 * cross step boundaries (input lock, the interactive registry, solved-level
 * memory).
 *
 * Circuit content lives in `../desainSkema/circuits.ts`, per ADR-003
 * (content as data): C1/C2/C3 from Stage-1-Schematic-Standards.
 */
export class DesainSkema extends Phaser.Scene {
  private body!: Phaser.GameObjects.Container
  private header!: DesainSkemaHeader
  private interactives: InteractiveTarget[] = []
  private step: JourneyStep = 'materi'
  private solvedLevels = new Set<JourneyStep>()
  private workbenchStep: WorkbenchStep | null = null
  private evaluationStep: EvaluationStep | null = null
  private exiting = false
  private transitioning = false
  /** True until the initial entrance lands — input is ignored until then, same as Home. */
  private entering = true

  /** Handed to every step panel: where to add tweens, whether input is locked, and the shared interactive registry. */
  private readonly uiContext: UiContext = {
    scene: this,
    isLocked: () => this.inputLocked(),
    registerInteractive: (target) => this.interactives.push(target),
    unregisterInteractive: (target) => {
      this.interactives = this.interactives.filter((obj) => obj !== target)
    },
  }

  constructor() {
    super('DesainSkema')
  }

  preload() {
    queueDesainSkemaTextures(this)
  }

  create() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#faf3e7')

    session.set({ currentScene: 'DesainSkema' })
    // Drawing theme is the default global bgm for every non-evaluation scene;
    // only an actual soal/evaluasi scene should switch profile and resume this after.
    audio.setProfile('menu')

    // The Scene instance is reused across visits — Phaser calls create() again
    // rather than reconstructing the class — so state left over from a
    // previous visit must be cleared explicitly here. Leaving `interactives`
    // populated with refs Phaser's own shutdown just destroyed (header/body
    // teardown on the way out via goHome()) is exactly what crashed
    // disableInteractives() on a second visit's first Lanjut click.
    this.step = 'materi'
    this.solvedLevels = new Set()
    this.exiting = false
    this.transitioning = false
    this.entering = true
    this.interactives = []
    this.workbenchStep = null
    this.evaluationStep = null

    this.body = this.add.container(0, 0)
    this.header = new DesainSkemaHeader(
      this.uiContext,
      () => this.goHome(),
      () => this.goToPreviousStep(),
    )
    this.header.render(this.badgeLabel(), false, true)
    this.renderMateri(true)

    const recentre = () => applyStageCamera(this)
    const syncToggle = () => this.header.syncBgmToggle()
    EventBus.on(STAGE_RESIZE_EVENT, recentre)
    EventBus.on(SETTINGS_CHANGED_EVENT, syncToggle)
    this.events.once('shutdown', () => {
      EventBus.off(STAGE_RESIZE_EVENT, recentre)
      EventBus.off(SETTINGS_CHANGED_EVENT, syncToggle)
    })

    EventBus.emit('current-scene-ready', this)

    // Entrance is a handful of independent fades rather than one sequence with
    // a completion callback, so the input lock just clears once the slowest
    // of them is done.
    this.time.delayedCall(materiEntranceDuration(), () => {
      this.entering = false
    })
  }

  private inputLocked() {
    return this.exiting || this.transitioning || this.entering
  }

  private badgeLabel() {
    if (this.step === 'materi') return 'Langkah 1 - Materi'
    if (this.step === 'evaluasi') return 'Langkah 3 - Evaluasi'
    return 'Langkah 2 - Simulasi CAD'
  }

  private goHome() {
    if (this.inputLocked()) return
    this.exiting = true

    audio.play('click')
    this.disableInteractives()
    this.workbenchStep?.teardown()
    this.evaluationStep?.teardown()

    // One flat fade covers header + body regardless of which step we're
    // leaving from — no per-item stagger to sit through on the way out.
    this.tweens.add({
      targets: [this.header.container, this.body],
      alpha: 0,
      duration: EXIT_FADE_DURATION,
      ease: 'Sine.easeIn',
      onComplete: () => this.scene.start('Home'),
    })
  }

  // ---------------------------------------------------------------------
  // Step transitions
  // ---------------------------------------------------------------------

  private goToPreviousStep() {
    if (this.inputLocked()) return
    const index = STEP_ORDER.indexOf(this.step)
    if (index <= 0) return

    audio.play('click')
    this.transitionTo(STEP_ORDER[index - 1])
  }

  private goToNextStep() {
    if (this.inputLocked()) return
    const index = STEP_ORDER.indexOf(this.step)
    const next = STEP_ORDER[index + 1]
    if (!next) return

    audio.play('click')
    this.transitionTo(next)
  }

  /**
   * Cross-fades body content only — the header stays mounted throughout, it
   * just gets torn down and rebuilt for the new step's badge/back-icon state.
   * Every interactive from the old step is gone by the time new ones are
   * pushed, so `interactives` never accumulates stale, destroyed refs (the
   * bug fixed in Home.ts's own create() reuse).
   */
  private transitionTo(step: JourneyStep) {
    this.transitioning = true
    this.disableInteractives()
    this.workbenchStep?.teardown()
    this.evaluationStep?.teardown()

    this.tweens.add({
      targets: this.body,
      alpha: 0,
      duration: 160,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.body.removeAll(true)
        this.workbenchStep = null
        this.evaluationStep = null
        this.interactives = []

        this.step = step
        // work_theme (the 'quiz' profile) only kicks in once the learner
        // clears the intro card and countdown — see EvaluationStep. Arriving
        // at (or leaving) any step, evaluasi included, just stays on the
        // ambient menu track until then.
        audio.setProfile('menu')
        this.header.render(this.badgeLabel(), step !== 'materi', false)

        if (step === 'materi') this.renderMateri(false)
        else if (step === 'evaluasi') this.renderEvaluasi()
        else this.renderLevel(step)

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

  private disableInteractives() {
    this.interactives.forEach((obj) => {
      this.tweens.killTweensOf(obj)
      obj.disableInteractive()
    })
  }

  // ---------------------------------------------------------------------
  // Langkah 1 — Materi
  // ---------------------------------------------------------------------

  private renderMateri(entrance: boolean) {
    new MateriStep(this.uiContext).render(this.body, entrance, () => this.goToNextStep())
  }

  // ---------------------------------------------------------------------
  // Langkah 2.1-2.3 — Simulasi CAD work sheets
  // ---------------------------------------------------------------------

  private renderLevel(step: Exclude<JourneyStep, 'materi' | 'evaluasi'>) {
    const levelNumber = LEVEL_NUMBER[step]
    const level = CIRCUIT_LEVELS[levelNumber - 1]
    const hasNextStep = STEP_ORDER.indexOf(step) < STEP_ORDER.length - 1

    this.workbenchStep = new WorkbenchStep(this.uiContext)
    this.workbenchStep.render(this.body, {
      level,
      levelNumber,
      alreadySolved: this.solvedLevels.has(step),
      hasNextStep,
      onSolved: () => this.solvedLevels.add(step),
      onNext: () => this.goToNextStep(),
    })
  }

  // ---------------------------------------------------------------------
  // Langkah 3 — Evaluasi (quiz)
  // ---------------------------------------------------------------------

  private renderEvaluasi() {
    // Reaching evaluasi (not necessarily finishing it) is the "sudah dipelajari"
    // bar for Home's menu-corner badge — see state/progress.ts.
    markMenuCompleted('desain-skema')

    this.evaluationStep = new EvaluationStep(this.uiContext, DESAIN_SKEMA_EVALUATION, () => this.goHome())
    this.evaluationStep.render(this.body)
  }
}
