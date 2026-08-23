import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, STAGE_RESIZE_EVENT } from '../stage'
import { BaseStageScene } from './BaseStageScene'
import { audio } from '../audio/AudioDirector'
import { SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { markMenuCompleted } from '../state/progress'
import { CIRCUIT_LEVELS } from '../desainSkema/circuits'
import { buildDesainSkemaStepEvaluation } from '../desainSkema/evaluation'
import { EXIT_FADE_DURATION, type InteractiveTarget, type UiContext } from '../desainSkema/uiKit'
import { DesainSkemaHeader } from '../desainSkema/header'
import { MateriStep, materiEntranceDuration } from '../desainSkema/materiStep'
import { WorkbenchStep } from '../desainSkema/workbenchStep'
import { EvaluationStep } from '../desainSkema/evaluationStep'
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
import goBackUrl from '../../../assets/images/02_global_buttons/go_back.webp'
import goHomeUrl from '../../../assets/images/02_global_buttons/go_home.webp'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.webp'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.webp'
import paperWork1Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_1.webp'
import paperWork2Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_2.webp'
import paperWork3Url from '../../../assets/images/06_evaluation_pictures/01_Design_Schema/paper_work_3.webp'
import evalLeftSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/left-side-electronics.webp'
import evalRightSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/right-side-electronic.webp'

/**
 * Textures this whole module draws. Kept separate from Home's texture map so
 * each module preloads only what it needs.
 *
 * paper-work-1/2/3 look unused from a code grep alone — they're only ever
 * referenced by key from evaluationQuestions.json's `images` arrays (all 9
 * quiz questions use one), not from any .ts call site. Cross-check that file
 * too before ever "cleaning up" one of these as dead.
 *
 * elec-*, go-back, go-home, bgm-on/off and eval-left-side/eval-right-side are
 * shared with JalurPcb (see JALUR_PCB_IMAGES in scenes/JalurPcb.ts) — never
 * remove them from a single scene's shutdown handler, or whichever of the two
 * scenes loads second will render broken images.
 */
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

/**
 * Keys this module loads that are exclusive to it — nothing else in the game
 * ever draws a paper-work-* diagram (see DESAIN_SKEMA_TEXTURES's docstring:
 * only referenced from evaluationQuestions.json, not from any .ts call
 * site). Deliberately an allowlist rather than "every key minus the shared
 * ones": everything else in DESAIN_SKEMA_TEXTURES is shared with JalurPcb,
 * and an allowlist can't accidentally start releasing a shared key just
 * because the map above grows.
 */
const EXCLUSIVE_TO_DESAIN_SKEMA = ['paper-work-1', 'paper-work-2', 'paper-work-3']

/**
 * Frees the paper-work-* quiz diagrams. Call from this scene's `shutdown`
 * handler, after its own GameObjects are gone.
 */
export function releaseDesainSkemaTextures(scene: Phaser.Scene) {
  EXCLUSIVE_TO_DESAIN_SKEMA.forEach((key) => {
    if (scene.textures.exists(key)) scene.textures.remove(key)
  })
}

export type JourneyStep = 'materi' | 'level-1' | 'eval-1' | 'level-2' | 'eval-2' | 'level-3' | 'eval-3'

type WorkbenchJourneyStep = 'level-1' | 'level-2' | 'level-3'
type EvalJourneyStep = 'eval-1' | 'eval-2' | 'eval-3'

const STEP_ORDER: JourneyStep[] = ['materi', 'level-1', 'eval-1', 'level-2', 'eval-2', 'level-3', 'eval-3']

const LEVEL_NUMBER: Record<WorkbenchJourneyStep, 1 | 2 | 3> = {
  'level-1': 1,
  'level-2': 2,
  'level-3': 3,
}

/** Each Langkah 2.N work sheet is followed immediately by its own 3-question evaluation, filtered to that sheet's topic. */
const EVAL_LEVEL_NUMBER: Record<EvalJourneyStep, 1 | 2 | 3> = {
  'eval-1': 1,
  'eval-2': 2,
  'eval-3': 3,
}

function isEvalStep(step: JourneyStep): step is EvalJourneyStep {
  return step === 'eval-1' || step === 'eval-2' || step === 'eval-3'
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
export class DesainSkema extends BaseStageScene {
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

  protected onCreate() {
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

    this.onBusEvent(STAGE_RESIZE_EVENT, () => applyStageCamera(this))
    this.onBusEvent(SETTINGS_CHANGED_EVENT, () => this.header.syncBgmToggle())
    // Registered last, so both onBusEvent unbinds above have already run by
    // the time this fires — see releaseDesainSkemaTextures's docstring.
    this.onCleanup(() => releaseDesainSkemaTextures(this))

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
    if (this.step === 'eval-3') return 'Langkah 3 - Evaluasi'
    if (this.step === 'eval-1' || this.step === 'eval-2') return 'Langkah 2 - Evaluasi'
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
        else if (isEvalStep(step)) this.renderEvaluasi(step)
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

  private renderLevel(step: WorkbenchJourneyStep) {
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
  // Langkah 2.1-2.3's own evaluations, plus eval-3 doubling as Langkah 3
  // ---------------------------------------------------------------------

  /**
   * Each work sheet is immediately followed by a 3-question evaluation drawn
   * from that sheet's own topic (`questionsForLevel`) — not the old single
   * 9-question quiz at the very end. eval-3 is still the journey's actual
   * last step, so it keeps the "Coba Lagi"/"Ke Beranda" results pair; eval-1
   * and eval-2 get a single "Lanjutkan" button that walks straight into the
   * next work sheet.
   */
  private renderEvaluasi(step: EvalJourneyStep) {
    const isFinalStep = step === 'eval-3'

    // Reaching the final evaluasi (not necessarily finishing it) is the
    // "sudah dipelajari" bar for Home's menu-corner badge — see state/progress.ts.
    if (isFinalStep) markMenuCompleted('desain-skema')

    const config = buildDesainSkemaStepEvaluation({
      level: EVAL_LEVEL_NUMBER[step],
      isFinalStep,
      showIntro: step === 'eval-1',
      onContinue: isFinalStep ? undefined : () => this.goToNextStep(),
      // "Coba Lagi" on the final evaluation goes back to the first work sheet
      // to redo it, rather than just reshuffling this same quiz in place.
      onRetry: isFinalStep ? () => this.transitionTo('level-1') : undefined,
    })

    this.evaluationStep = new EvaluationStep(this.uiContext, config, () => this.goHome())
    this.evaluationStep.render(this.body)
  }
}
