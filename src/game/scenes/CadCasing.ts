import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { applyStageCamera, STAGE_RESIZE_EVENT } from '../stage'
import { BaseStageScene } from './BaseStageScene'
import { audio } from '../audio/AudioDirector'
import { SETTINGS_CHANGED_EVENT } from '../state/settings'
import { session } from '../state/session'
import { EXIT_FADE_DURATION, type InteractiveTarget, type UiContext } from '../desainSkema/uiKit'
import { CadCasingHeader } from '../cadCasing/header'
import { MateriStep, materiEntranceDuration } from '../cadCasing/materiStep'
import { SimulasiStep } from '../cadCasing/simulasiStep'
import { EvaluationStep } from '../desainSkema/evaluationStep'
import { CAD_CASING_EVALUATION } from '../cadCasing/evaluation'
import goBackUrl from '../../../assets/images/02_global_buttons/go_back.webp'
import goHomeUrl from '../../../assets/images/02_global_buttons/go_home.webp'
import bgmOnUrl from '../../../assets/images/02_global_buttons/global_bgm_on.webp'
import bgmOffUrl from '../../../assets/images/02_global_buttons/global_bgm_off.webp'
import compareUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/materi/illustration_perbandingan_ketat_ideal.png'
import topViewUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/materi/illustration_tampak_atas.png'
import sideViewUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/materi/illustration_tampak_samping.png'
// Langkah 3's evaluasi reuses the same generic scattered-electronics margin
// art and prop icons every other journey's evaluation draws from — not
// CAD-Casing-specific, same reasoning as JalurPcb.ts's own copy of these.
import evalLeftSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/left-side-electronics.webp'
import evalRightSideUrl from '../../../assets/images/03_electronic_assets/grouped/01_Design_Schema/Evaluation/right-side-electronic.webp'
import elecPcbTraceUrl from '../../../assets/images/03_electronic_assets/elec_pcb_trace_icon.webp'
import elecIcChipUrl from '../../../assets/images/03_electronic_assets/elec_ic_chip1.webp'
import elecOpampUrl from '../../../assets/images/03_electronic_assets/elec_opamp_triangle.webp'
import elecBatteryUrl from '../../../assets/images/03_electronic_assets/elec_battery.webp'
import elecTerminalBlockUrl from '../../../assets/images/03_electronic_assets/elec_terminal_block_green.webp'
import elecResistorUrl from '../../../assets/images/03_electronic_assets/elec_resistor.webp'
import elecCapacitorUrl from '../../../assets/images/03_electronic_assets/elec_capacitor.webp'
import elecDiodeUrl from '../../../assets/images/03_electronic_assets/elec_diode.webp'
import elecInductorUrl from '../../../assets/images/03_electronic_assets/elec_inductor_coil.webp'
// `?no-inline` forces Vite to always emit a real fetchable path instead of
// inlining these (small) SVGs as a data URI — see JalurPcb.ts's own note on
// why (Phaser's SVGFile loader atob()s any `data:` URL it gets).
import iconParameterUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_parameter_panel.svg?no-inline'
import iconAtasUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_atas.svg?no-inline'
import iconSampingUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_samping.svg?no-inline'
import iconDepanUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_depan.svg?no-inline'
import iconIsometrikUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_view_isometrik.svg?no-inline'
import iconResetUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/simulasi/icons/icon_reset_view.svg?no-inline'

/**
 * Textures this module draws. go-back/go-home/bgm-on/bgm-off are shared with
 * DesainSkema and JalurPcb (same three keys, same files) — never remove them
 * from a single scene's shutdown handler, or whichever scene loads second
 * will render broken images.
 *
 * The three cad-casing-* diagrams are flattened PNG exports (not webp — this
 * environment has no cwebp/imagemagick to re-encode them; swap for webp
 * later if that tooling becomes available) of Figma's CompareDiagram,
 * TopViewDiagram and SideViewDiagram groups (node 139:311/348/383) — each is
 * a dense nest of small vector groups not worth hand-redrawing in Phaser.
 */
const CAD_CASING_TEXTURES: Record<string, string> = {
  'go-back': goBackUrl,
  'go-home': goHomeUrl,
  'bgm-on': bgmOnUrl,
  'bgm-off': bgmOffUrl,
  'cad-casing-compare': compareUrl,
  'cad-casing-top-view': topViewUrl,
  'cad-casing-side-view': sideViewUrl,
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

/** SVG icons for Langkah 2's parameter panel and camera controls, rasterized at 4x their authored viewBox so they stay crisp under camera zoom + stage overscan — same treatment JalurPcb.ts gives its own icon set. */
const CAD_CASING_ICONS: { key: string; url: string; size: number }[] = [
  { key: 'cad-casing-icon-parameter', url: iconParameterUrl, size: 72 },
  { key: 'cad-casing-icon-atas', url: iconAtasUrl, size: 52 },
  { key: 'cad-casing-icon-samping', url: iconSampingUrl, size: 52 },
  { key: 'cad-casing-icon-depan', url: iconDepanUrl, size: 52 },
  { key: 'cad-casing-icon-isometrik', url: iconIsometrikUrl, size: 52 },
  { key: 'cad-casing-icon-reset', url: iconResetUrl, size: 48 },
]

export function queueCadCasingTextures(scene: Phaser.Scene) {
  Object.entries(CAD_CASING_TEXTURES).forEach(([key, url]) => {
    if (!scene.textures.exists(key)) scene.load.image(key, url)
  })
  CAD_CASING_ICONS.forEach(({ key, url, size }) => {
    if (!scene.textures.exists(key)) scene.load.svg(key, url, { width: size, height: size })
  })
}

/** Keys this module loads that nothing else in the game ever draws. */
const EXCLUSIVE_TO_CAD_CASING = ['cad-casing-compare', 'cad-casing-top-view', 'cad-casing-side-view']

/** Frees the three diagram illustrations and Langkah 2's icon set. Call from this scene's `shutdown` handler, after its own GameObjects are gone. */
export function releaseCadCasingTextures(scene: Phaser.Scene) {
  EXCLUSIVE_TO_CAD_CASING.forEach((key) => {
    if (scene.textures.exists(key)) scene.textures.remove(key)
  })
  CAD_CASING_ICONS.forEach(({ key }) => {
    if (scene.textures.exists(key)) scene.textures.remove(key)
  })
}

export type JourneyStep = 'materi' | 'simulasi' | 'evaluasi'

const STEP_ORDER: JourneyStep[] = ['materi', 'simulasi', 'evaluasi']

/** Each label copied verbatim from its own Figma frame's badge text where one exists — "Step 1" and "Step 2" don't agree on the dash. Langkah 3 has no Figma frame yet, so its badge matches JalurPcb's own evaluasi wording. */
const STEP_BADGE: Record<JourneyStep, string> = {
  materi: 'Langkah 1 - Materi',
  simulasi: 'Langkah 2 Simulasi',
  evaluasi: 'Langkah 3 - Evaluasi',
}

/**
 * CAD Casing PCB journey: theory (Langkah 1), the interactive 3D casing
 * sizing simulator (Langkah 2), then the evaluation quiz (Langkah 3) — see
 * the "Step 1 - Materi" (node 135:30) and "Step 2 - Simulasi" (node 140:504)
 * frames under the "CAD Casing" canvas. Langkah 3 has no Figma frame of its
 * own — it reuses `EvaluationStep` exactly as JalurPcb.ts does, fed this
 * journey's own question bank/copy (`cadCasing/evaluation.ts`).
 *
 * Structured the same way as JalurPcb.ts: a shared `header` + `body` the step
 * panels render into, a `uiContext` handed to every panel, a cross-fade
 * between steps, and one flat exit fade back to Home.
 */
export class CadCasing extends BaseStageScene {
  private body!: Phaser.GameObjects.Container
  private header!: CadCasingHeader
  private interactives: InteractiveTarget[] = []
  private step: JourneyStep = 'materi'
  private materiStep: MateriStep | null = null
  private simulasiStep: SimulasiStep | null = null
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
    super('CadCasing')
  }

  preload() {
    queueCadCasingTextures(this)
  }

  protected onCreate() {
    applyStageCamera(this)
    this.cameras.main.setBackgroundColor('#faf3e7')

    session.set({ currentScene: 'CadCasing' })
    audio.setProfile('menu')

    // The Scene instance is reused across visits — Phaser calls create() again
    // rather than reconstructing the class — so state left over from a
    // previous visit must be cleared explicitly here.
    this.step = 'materi'
    this.exiting = false
    this.transitioning = false
    this.entering = true
    this.interactives = []
    this.materiStep = null
    this.simulasiStep = null
    this.evaluationStep = null

    this.body = this.add.container(0, 0)
    this.header = new CadCasingHeader(
      this.uiContext,
      () => this.goHome(),
      () => this.goToPreviousStep(),
    )
    this.header.render(STEP_BADGE[this.step], false, true)
    this.renderMateri(true)

    this.onBusEvent(STAGE_RESIZE_EVENT, () => applyStageCamera(this))
    this.onBusEvent(SETTINGS_CHANGED_EVENT, () => this.header.syncBgmToggle())
    this.onCleanup(() => {
      this.simulasiStep?.teardown()
      this.evaluationStep?.teardown()
    })
    // Registered last, so both onBusEvent unbinds and the step teardown
    // above have already run by the time this fires — see
    // releaseCadCasingTextures's docstring.
    this.onCleanup(() => releaseCadCasingTextures(this))

    EventBus.emit('current-scene-ready', this)

    this.time.delayedCall(materiEntranceDuration(), () => {
      this.entering = false
    })
  }

  private inputLocked() {
    return this.exiting || this.transitioning || this.entering
  }

  private goHome() {
    if (this.inputLocked()) return
    this.exiting = true

    audio.play('click')
    this.disableInteractives()
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

  // ---------------------------------------------------------------------
  // Langkah 1 — Materi
  // ---------------------------------------------------------------------

  private renderMateri(entrance: boolean) {
    this.materiStep = new MateriStep(this.uiContext)
    this.materiStep.render(this.body, entrance, () => this.goToNextStep())
  }

  // ---------------------------------------------------------------------
  // Langkah 2 — Simulasi
  // ---------------------------------------------------------------------

  private renderSimulasi() {
    this.simulasiStep = new SimulasiStep(this.uiContext)
    this.simulasiStep.render(this.body, () => this.goToNextStep())
  }

  // ---------------------------------------------------------------------
  // Langkah 3 — Evaluasi
  // ---------------------------------------------------------------------

  private renderEvaluasi() {
    this.evaluationStep = new EvaluationStep(this.uiContext, CAD_CASING_EVALUATION, () => this.goHome())
    this.evaluationStep.render(this.body)
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
  private transitionTo(step: JourneyStep) {
    this.transitioning = true
    this.disableInteractives()
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
}
