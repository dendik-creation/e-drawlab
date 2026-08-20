import Phaser from 'phaser'
import { DESIGN_WIDTH } from '../stage'
import { coverFit, containFit } from '../coverFit'
import { audio } from '../audio/AudioDirector'
import { EVALUATION_QUESTIONS, shuffleQuestions, scoreTier, SCORE_TIER_MESSAGE, type QuizQuestion, type ScoreTier } from './evaluation'
import {
  attachButtonBehaviour,
  buildActionButton,
  drawCornerOrnament,
  fadeDownIn,
  fadeUpOut,
  BADGE_FILL,
  BADGE_TEXT_COLOR,
  BORDER_COLOR,
  CARD_EDGE,
  MUTED_TEXT_COLOR,
  TEXT_COLOR,
  FONT_BODY,
  FONT_HEADING,
  TEXT_RESOLUTION,
  type UiContext,
} from './uiKit'

const EVAL_CENTER_X = DESIGN_WIDTH / 2
const EVAL_CONTENT_TOP = 200
const EVAL_CARD_WIDTH = 672
const EVAL_CARD_LEFT = EVAL_CENTER_X - EVAL_CARD_WIDTH / 2
const EVAL_PROGRESS_HEIGHT = 10
const EVAL_PROGRESS_ROW_HEIGHT = 20
const EVAL_SECTION_GAP = 24
const EVAL_CARD_TOP = EVAL_CONTENT_TOP + EVAL_PROGRESS_ROW_HEIGHT + EVAL_SECTION_GAP
/** Card padding: extra room up top for the number badge straddling the corner, and around the image row/question text. */
const EVAL_CARD_PAD_TOP = 40
const EVAL_CARD_PAD_X = 32
const EVAL_CARD_PAD_BOTTOM = 26
const EVAL_OPTION_WIDTH = 328
const EVAL_OPTION_HEIGHT = 76
const EVAL_OPTION_GAP_X = 16
const EVAL_OPTION_GAP_Y = 16
/** Options this short (e.g. "Resistor") get the 2-column grid; longer, full-sentence options stack single-column instead. */
const EVAL_SHORT_OPTION_MAX_LEN = 26
/** Gap between the "benar/salah" feedback line and the next-question button below it. */
const EVAL_FEEDBACK_BUTTON_GAP = 96

// Schematic reference image(s) shown inside the question card.
const EVAL_IMAGE_MAX_HEIGHT = 168
const EVAL_IMAGE_PANEL_PAD = 12
const EVAL_IMAGE_GAP = 12
const EVAL_IMAGE_TO_TEXT_GAP = 18

// Langkah 3 intro dialog card, shown before the countdown/quiz start.
const EVAL_INTRO_CARD_WIDTH = 640
const EVAL_INTRO_CARD_TOP = 210
const EVAL_INTRO_INSTRUCTIONS = [
  'Kuis ini terdiri dari 9 soal pilihan ganda seputar skema rangkaian LED.',
  'Perhatikan gambar skema pada tiap soal sebelum memilih jawaban.',
  'Setiap soal hanya bisa dijawab satu kali dan jawabannya tidak bisa diubah.',
  'Skor akhir dihitung dari jumlah jawaban yang benar di semua soal.',
]

// Countdown before the quiz/timer/bgm start.
const COUNTDOWN_Y = 560
const COUNTDOWN_DISTANCE = 70
const COUNTDOWN_IN_DURATION = 260
const COUNTDOWN_HOLD_DURATION = 380
const COUNTDOWN_OUT_DURATION = 220

const QUIZ_CORRECT_FILL = 0xe9f9f1
const QUIZ_CORRECT_BORDER = 0x1fae6b
const QUIZ_CORRECT_TEXT = '#12915a'
const QUIZ_WRONG_FILL = 0xfdecec
const QUIZ_WRONG_BORDER = 0xd9534f
const QUIZ_WRONG_TEXT = '#c0392b'
const QUIZ_NEUTRAL_BORDER = 0x0c6179

/** Decorative background icons scattered either side of the quiz card — "bintang-bintang kecil" that idly rock back and forth. */
const STAR_TEXTURES = [
  'elec-resistor',
  'elec-capacitor',
  'elec-diode',
  'elec-led',
  'elec-ic-chip',
  'elec-ic-chip-orange',
  'elec-inductor',
  'elec-opamp',
  'elec-terminal-block',
  'elec-usb-connector',
  'elec-pcb-trace',
  'elec-battery',
  'elec-cube',
]
const STAR_ZONE_LEFT = { xMin: 60, xMax: EVAL_CARD_LEFT - 50 }
const STAR_ZONE_RIGHT = { xMin: EVAL_CARD_LEFT + EVAL_CARD_WIDTH + 50, xMax: DESIGN_WIDTH - 60 }
const STAR_Y_MIN = 170
const STAR_Y_MAX = 1010
/** Spread evenly across this many vertical bands (one star per band, jittered) so icons fill both margins top-to-bottom instead of clustering. */
const STAR_COUNT_PER_SIDE = 11
const STAR_SIZE_MIN = 36
const STAR_SIZE_MAX = 64
const STAR_ALPHA_MIN = 0.16
const STAR_ALPHA_MAX = 0.34
const STAR_ROTATE_MIN = 12
const STAR_ROTATE_MAX = 34
const STAR_ROTATE_DURATION_MIN = 2200
const STAR_ROTATE_DURATION_MAX = 4200

/** Icons the results card can randomly show, grouped by how well the learner did. */
const RESULT_ICONS: Record<ScoreTier, string[]> = {
  excellent: ['elec-led', 'elec-opamp', 'elec-ic-chip'],
  good: ['elec-battery', 'elec-resistor', 'elec-terminal-block'],
  retry: ['elec-capacitor', 'elec-diode', 'elec-inductor'],
}

const RESULT_CARD_WIDTH = 560
const RESULT_CARD_HEIGHT = 340
const RESULT_CARD_TOP = 250

/** Runtime state for the Langkah 3 quiz — question progress, score, and the decorative background icons. */
interface EvaluationState {
  questions: QuizQuestion[]
  index: number
  score: number
  answered: boolean
  decoration: Phaser.GameObjects.Container
  decorationTweens: Phaser.Tweens.Tween[]
  /** Current intro/countdown/question/result card — swapped out wholesale on navigation. */
  content?: Phaser.GameObjects.Container
  /** Buttons/pills belonging to `content`, tracked so they can be pruned from the shared interactive registry before it's destroyed. */
  contentInteractives: (Phaser.GameObjects.Container | Phaser.GameObjects.Image)[]
  /** Pending "3-2-1" delayed calls, cancelled on teardown so a stale callback can't tween/destroy content after the scene has moved on. */
  countdownTimers: Phaser.Time.TimerEvent[]
  /** The currently-visible countdown digit, if any — tracked so its in-flight tween can be killed on teardown. */
  countdownText?: Phaser.GameObjects.Text
}

/**
 * Langkah 3 — Evaluasi: an intro dialog card, a 3-2-1 countdown, the 9-question
 * quiz (shuffled per attempt), then a results card. One instance per visit;
 * the scene builds a fresh one on every step change.
 */
export class EvaluationStep {
  private state!: EvaluationState
  private body!: Phaser.GameObjects.Container
  private ctx: UiContext
  private onExitHome: () => void
  /**
   * True while a card is mid fadeUpOut, on its way to being replaced. These
   * nav buttons (Mulai/Soal Berikutnya/Lihat Hasil/Coba Lagi) drive their own
   * local transition instead of the scene's `transitioning` lock, and
   * attachButtonBehaviour's re-press guard only covers the ~90ms press
   * animation — a second tap landing during the ~180ms fade-out re-fired
   * fadeUpOut on content already fading out, so two onComplete callbacks both
   * rendered the next card and raced to build/destroy it. That double render
   * was the intermittent "answer, then double-tap Soal Berikutnya" crash.
   */
  private navigating = false

  constructor(ctx: UiContext, onExitHome: () => void) {
    this.ctx = ctx
    this.onExitHome = onExitHome
  }

  private get scene() {
    return this.ctx.scene
  }

  render(body: Phaser.GameObjects.Container) {
    this.body = body

    const { container, tweens } = this.buildEvaluationDecoration()
    body.add(container)

    this.state = {
      questions: shuffleQuestions(EVALUATION_QUESTIONS),
      index: 0,
      score: 0,
      answered: false,
      decoration: container,
      decorationTweens: tweens,
      contentInteractives: [],
      countdownTimers: [],
    }

    this.renderEvaluationIntro()
  }

  /** Same reasoning as WorkbenchStep.teardown(): the decorative stars, any pending countdown step, and in-flight quiz-content tweens must stop before their targets are destroyed. */
  teardown() {
    const state = this.state
    if (!state) return

    state.decorationTweens.forEach((tween) => tween.remove())
    state.countdownTimers.forEach((timer) => timer.remove(false))
    state.countdownTimers = []
    if (state.countdownText) this.scene.tweens.killTweensOf(state.countdownText)
    if (state.content) this.scene.tweens.killTweensOf(state.content)
  }

  /**
   * The dialog card shown before any question renders or work_theme starts:
   * what the evaluation covers and how it's scored, with "Mulai Evaluasi"
   * kicking off the countdown. Content is fixed, so the card is measured
   * top-down the same way buildOptionPill sizes itself off its own text.
   */
  private renderEvaluationIntro() {
    const state = this.state
    this.clearEvaluationContent()

    const content = this.scene.add.container(0, 0)
    this.body.add(content)
    state.content = content

    const cardWidth = EVAL_INTRO_CARD_WIDTH
    const padX = 40
    const padTop = 40
    const padBottom = 36
    const textWidth = cardWidth - padX * 2

    let cursorY = padTop
    const parts: Phaser.GameObjects.GameObject[] = []

    const title = this.scene.add
      .text(0, cursorY, 'Evaluasi Pemahaman', {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '30px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)
    parts.push(title)
    cursorY += title.height + 10

    const subtitle = this.scene.add
      .text(0, cursorY, 'Sebelum mulai, baca dulu petunjuk pengerjaannya:', {
        fontFamily: FONT_BODY,
        fontStyle: '600',
        fontSize: '16px',
        color: MUTED_TEXT_COLOR,
        align: 'center',
        wordWrap: { width: textWidth },
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)
    parts.push(subtitle)
    cursorY += subtitle.height + 26

    const badgeX = -textWidth / 2 + 14
    const rowTextX = badgeX + 30
    EVAL_INTRO_INSTRUCTIONS.forEach((line, i) => {
      const text = this.scene.add
        .text(rowTextX, cursorY, line, {
          fontFamily: FONT_BODY,
          fontStyle: '600',
          fontSize: '16px',
          color: TEXT_COLOR,
          lineSpacing: 4,
          wordWrap: { width: textWidth - (rowTextX - badgeX) - 14 },
          resolution: TEXT_RESOLUTION,
        })
        .setOrigin(0, 0)
      const rowHeight = text.height

      const badge = this.scene.add
        .graphics()
        .fillStyle(BADGE_FILL, 1)
        .fillCircle(badgeX, cursorY + rowHeight / 2 - 8, 12)
      const badgeText = this.scene.add
        .text(badgeX, cursorY + rowHeight / 2 - 8, String(i + 1), {
          fontFamily: FONT_HEADING,
          fontStyle: '800',
          fontSize: '13px',
          color: BADGE_TEXT_COLOR,
          resolution: TEXT_RESOLUTION,
        })
        .setOrigin(0.5)

      parts.push(badge, badgeText, text)
      cursorY += rowHeight + 18
    })

    const cardHeight = cursorY - 18 + padBottom

    const card = this.scene.add
      .graphics()
      .fillStyle(0x000000, 0.08)
      .fillRoundedRect(-cardWidth / 2 + 3, 4, cardWidth, cardHeight, 28)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 28)
      .lineStyle(2, CARD_EDGE, 1)
      .strokeRoundedRect(-cardWidth / 2, 0, cardWidth, cardHeight, 28)

    const cardContainer = this.scene.add.container(EVAL_CENTER_X, EVAL_INTRO_CARD_TOP, [card, ...parts])
    content.add(cardContainer)

    const startBtn = buildActionButton(this.ctx, 'Mulai Evaluasi →', EVAL_CENTER_X, EVAL_INTRO_CARD_TOP + cardHeight + 56, 320, 'primary', () => {
      if (this.navigating) return
      this.navigating = true
      audio.play('click')
      fadeUpOut(this.scene, content, 180, 20, () => this.startCountdown())
    })
    content.add(startBtn)
    state.contentInteractives.push(startBtn)

    fadeDownIn(this.scene, content, 0, 20, 240)
  }

  /**
   * "3 → 2 → 1", each digit dropping in from above and falling on through
   * (opacity + Y both animating the whole time, per the evaluation redesign's
   * animation rule) before the first question renders and work_theme starts.
   */
  private startCountdown() {
    const state = this.state
    this.clearEvaluationContent()

    const content = this.scene.add.container(0, 0)
    this.body.add(content)
    state.content = content

    const playDigit = (value: string, onDone: () => void) => {
      const text = this.scene.add
        .text(EVAL_CENTER_X, COUNTDOWN_Y - COUNTDOWN_DISTANCE, value, {
          fontFamily: FONT_HEADING,
          fontStyle: '800',
          fontSize: '160px',
          color: TEXT_COLOR,
          resolution: TEXT_RESOLUTION,
        })
        .setOrigin(0.5)
        .setAlpha(0)
      content.add(text)
      state.countdownText = text

      this.scene.tweens.add({
        targets: text,
        y: COUNTDOWN_Y,
        alpha: 1,
        duration: COUNTDOWN_IN_DURATION,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          const timer = this.scene.time.delayedCall(COUNTDOWN_HOLD_DURATION, () => {
            this.scene.tweens.add({
              targets: text,
              y: COUNTDOWN_Y + COUNTDOWN_DISTANCE,
              alpha: 0,
              duration: COUNTDOWN_OUT_DURATION,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                text.destroy()
                onDone()
              },
            })
          })
          state.countdownTimers.push(timer)
        },
      })
    }

    const sequence = ['3', '2', '1']
    const playNext = (i: number) => {
      if (i >= sequence.length) {
        this.finishCountdown()
        return
      }
      playDigit(sequence[i], () => playNext(i + 1))
    }
    playNext(0)
  }

  /** Countdown's over: hand off to work_theme and render the first question. */
  private finishCountdown() {
    audio.setProfile('quiz')
    this.renderQuizQuestion(0)
  }

  /** Faint rotating component icons scattered either side of the quiz card — "bintang-bintang kecil" filling the empty margins. */
  private buildEvaluationDecoration() {
    const container = this.scene.add.container(0, 0)
    const tweens: Phaser.Tweens.Tween[] = []
    ;[STAR_ZONE_LEFT, STAR_ZONE_RIGHT].forEach((zone) => {
      // One star per vertical band, jittered inside it — stratified sampling
      // so the margin fills top-to-bottom instead of pure-random picks
      // clumping by chance.
      const bandHeight = (STAR_Y_MAX - STAR_Y_MIN) / STAR_COUNT_PER_SIDE
      for (let i = 0; i < STAR_COUNT_PER_SIDE; i++) {
        const texture = Phaser.Utils.Array.GetRandom(STAR_TEXTURES)
        const size = Phaser.Math.Between(STAR_SIZE_MIN, STAR_SIZE_MAX)
        const x = Phaser.Math.Between(zone.xMin, zone.xMax)
        const bandTop = STAR_Y_MIN + i * bandHeight
        const y = Phaser.Math.Between(Math.round(bandTop), Math.round(bandTop + bandHeight))
        const alpha = Phaser.Math.FloatBetween(STAR_ALPHA_MIN, STAR_ALPHA_MAX)
        const baseAngle = Phaser.Math.Between(-20, 20)
        const swing = Phaser.Math.Between(STAR_ROTATE_MIN, STAR_ROTATE_MAX)
        const duration = Phaser.Math.Between(STAR_ROTATE_DURATION_MIN, STAR_ROTATE_DURATION_MAX)

        const icon = coverFit(this.scene.add.image(x, y, texture), size, size)
          .setAlpha(alpha)
          .setAngle(baseAngle - swing)
        container.add(icon)

        tweens.push(
          this.scene.tweens.add({
            targets: icon,
            angle: baseAngle + swing,
            duration,
            delay: Phaser.Math.Between(0, 600),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          }),
        )
      }
    })

    return { container, tweens }
  }

  /** Destroys the current question/result card and prunes its buttons from the shared interactive registry before they're gone. */
  private clearEvaluationContent() {
    const state = this.state
    state.contentInteractives.forEach((obj) => this.ctx.unregisterInteractive(obj))
    state.contentInteractives = []
    state.content?.destroy(true)
    state.content = undefined
    // A new card is about to render — whichever nav button triggered it is
    // free to fire again.
    this.navigating = false
  }

  private renderQuizQuestion(index: number) {
    const state = this.state
    this.clearEvaluationContent()
    state.index = index
    state.answered = false

    const question = state.questions[index]
    const total = state.questions.length
    const content = this.scene.add.container(0, 0)
    this.body.add(content)
    state.content = content

    // Progress: "N / total" label plus a filled bar showing how far through the quiz this question sits.
    const progressLabel = this.scene.add
      .text(EVAL_CARD_LEFT, EVAL_CONTENT_TOP + EVAL_PROGRESS_ROW_HEIGHT / 2, `${index + 1} / ${total}`, {
        fontFamily: FONT_HEADING,
        fontStyle: '700',
        fontSize: '14px',
        color: MUTED_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)
    content.add(progressLabel)

    const trackX = EVAL_CARD_LEFT + 38
    const trackWidth = EVAL_CARD_WIDTH - 38
    const trackY = EVAL_CONTENT_TOP + (EVAL_PROGRESS_ROW_HEIGHT - EVAL_PROGRESS_HEIGHT) / 2
    const progressBar = this.scene.add
      .graphics()
      .fillStyle(BADGE_FILL, 0.15)
      .fillRoundedRect(trackX, trackY, trackWidth, EVAL_PROGRESS_HEIGHT, EVAL_PROGRESS_HEIGHT / 2)
      .fillStyle(BADGE_FILL, 1)
      .fillRoundedRect(trackX, trackY, trackWidth * ((index + 1) / total), EVAL_PROGRESS_HEIGHT, EVAL_PROGRESS_HEIGHT / 2)
    content.add(progressBar)

    // Question card, with a number badge straddling the top-left corner and a
    // pair of small dash-dot flourishes. Height isn't fixed any more — the
    // schematic image row (when the question has one) plus the question text
    // are measured first, the same way buildOptionPill sizes its own pill.
    const cardTop = EVAL_CARD_TOP
    let cursorY = cardTop + EVAL_CARD_PAD_TOP
    const cardBody: Phaser.GameObjects.GameObject[] = []

    const images = question.images ?? []
    if (images.length > 0) {
      const rowWidth = EVAL_CARD_WIDTH - EVAL_CARD_PAD_X * 2
      const slotWidth = (rowWidth - EVAL_IMAGE_GAP * (images.length - 1)) / images.length
      const imageNodes = images.map((texture) =>
        containFit(
          this.scene.add.image(0, 0, texture),
          slotWidth - EVAL_IMAGE_PANEL_PAD * 2,
          EVAL_IMAGE_MAX_HEIGHT - EVAL_IMAGE_PANEL_PAD * 2,
        ),
      )
      const panelHeight = Math.max(...imageNodes.map((img) => img.displayHeight)) + EVAL_IMAGE_PANEL_PAD * 2
      const rowLeft = EVAL_CARD_LEFT + EVAL_CARD_PAD_X

      imageNodes.forEach((img, i) => {
        const slotX = rowLeft + i * (slotWidth + EVAL_IMAGE_GAP) + slotWidth / 2
        const panel = this.scene.add
          .graphics()
          .fillStyle(0xfaf6ea, 1)
          .fillRoundedRect(slotX - slotWidth / 2, cursorY, slotWidth, panelHeight, 14)
          .lineStyle(2, BORDER_COLOR, 0.25)
          .strokeRoundedRect(slotX - slotWidth / 2, cursorY, slotWidth, panelHeight, 14)
        img.setPosition(slotX, cursorY + panelHeight / 2)
        cardBody.push(panel, img)
      })

      cursorY += panelHeight + EVAL_IMAGE_TO_TEXT_GAP
    }

    const questionText = this.scene.add
      .text(EVAL_CENTER_X, cursorY, question.question, {
        fontFamily: FONT_HEADING,
        fontStyle: '700',
        fontSize: '20px',
        color: TEXT_COLOR,
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: EVAL_CARD_WIDTH - EVAL_CARD_PAD_X * 2 },
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)
    cardBody.push(questionText)
    cursorY += questionText.height

    const cardHeight = cursorY + EVAL_CARD_PAD_BOTTOM - cardTop

    const card = this.scene.add
      .graphics()
      .fillStyle(0x000000, 0.08)
      .fillRoundedRect(EVAL_CARD_LEFT + 3, cardTop + 4, EVAL_CARD_WIDTH, cardHeight, 24)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(EVAL_CARD_LEFT, cardTop, EVAL_CARD_WIDTH, cardHeight, 24)
      .lineStyle(2, BORDER_COLOR, 0.35)
      .strokeRoundedRect(EVAL_CARD_LEFT, cardTop, EVAL_CARD_WIDTH, cardHeight, 24)
    drawCornerOrnament(card, EVAL_CARD_LEFT + EVAL_CARD_WIDTH - 66, cardTop + 22, false)
    drawCornerOrnament(card, EVAL_CARD_LEFT + 66, cardTop + cardHeight - 22, true)
    content.add(card)
    cardBody.forEach((obj) => content.add(obj))

    const badgeGfx = this.scene.add
      .graphics()
      .fillStyle(BADGE_FILL, 1)
      .fillCircle(EVAL_CARD_LEFT + 30, cardTop, 20)
      .lineStyle(3, 0xfaf3e7, 1)
      .strokeCircle(EVAL_CARD_LEFT + 30, cardTop, 20)
    content.add(badgeGfx)

    const questionBadgeText = this.scene.add
      .text(EVAL_CARD_LEFT + 30, cardTop, String(index + 1), {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '16px',
        color: BADGE_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
    content.add(questionBadgeText)

    const optionsTop = cardTop + cardHeight + EVAL_SECTION_GAP

    // Short options ("Resistor") get the Figma 2-column grid; long, full-sentence
    // options stack single-column with wrapped, auto-height pills instead.
    const useGrid = question.options.every((opt) => opt.text.length <= EVAL_SHORT_OPTION_MAX_LEN)
    const pillRefs: (ReturnType<typeof this.buildOptionPill> & { opt: (typeof question.options)[number] })[] = []
    let optionsBottom: number

    if (useGrid) {
      question.options.forEach((opt, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = EVAL_CARD_LEFT + col * (EVAL_OPTION_WIDTH + EVAL_OPTION_GAP_X) + EVAL_OPTION_WIDTH / 2
        const y = optionsTop + row * (EVAL_OPTION_HEIGHT + EVAL_OPTION_GAP_Y) + EVAL_OPTION_HEIGHT / 2
        const built = this.buildOptionPill(opt, EVAL_OPTION_WIDTH)
        built.container.setPosition(x, y)
        content.add(built.container)
        pillRefs.push({ ...built, opt })
      })
      const rows = Math.ceil(question.options.length / 2)
      optionsBottom = optionsTop + rows * (EVAL_OPTION_HEIGHT + EVAL_OPTION_GAP_Y) - EVAL_OPTION_GAP_Y
    } else {
      let optionCursorY = optionsTop
      question.options.forEach((opt) => {
        const built = this.buildOptionPill(opt, EVAL_CARD_WIDTH)
        const y = optionCursorY + built.height / 2
        built.container.setPosition(EVAL_CENTER_X, y)
        content.add(built.container)
        pillRefs.push({ ...built, opt })
        optionCursorY += built.height + EVAL_OPTION_GAP_Y
      })
      optionsBottom = optionCursorY - EVAL_OPTION_GAP_Y
    }

    const selectOption = (selected: (typeof question.options)[number]) => {
      if (state.answered) return
      state.answered = true
      const correct = selected.key === question.correct

      pillRefs.forEach((ref) => {
        const visual: 'correct' | 'wrong' | 'dim' =
          ref.opt.key === question.correct ? 'correct' : ref.opt.key === selected.key ? 'wrong' : 'dim'
        this.paintOptionPill(ref.bg, ref.width, ref.height, visual)

        const accent = visual === 'correct' ? QUIZ_CORRECT_BORDER : visual === 'wrong' ? QUIZ_WRONG_BORDER : QUIZ_NEUTRAL_BORDER
        const accentAlpha = visual === 'dim' ? 0.35 : 1
        ref.badge.clear().lineStyle(2, accent, accentAlpha).strokeCircle(ref.badgeCx, 0, ref.badgeRadius)

        const textColor = visual === 'correct' ? QUIZ_CORRECT_TEXT : visual === 'wrong' ? QUIZ_WRONG_TEXT : TEXT_COLOR
        ref.badgeText.setColor(textColor).setAlpha(accentAlpha)
        ref.text.setColor(textColor).setAlpha(visual === 'dim' ? 0.45 : 1)
        ref.container.disableInteractive()
      })

      if (correct) {
        state.score += 1
        audio.play('bell')
      } else {
        audio.play('quizWrong')
      }

      const feedbackY = optionsBottom + 28
      const feedback = this.scene.add
        .text(
          EVAL_CENTER_X,
          feedbackY,
          correct ? '✓ Jawaban benar!' : `✗ Jawaban salah. Jawaban yang benar adalah ${question.correct}.`,
          {
            fontFamily: FONT_BODY,
            fontStyle: '700',
            fontSize: '17px',
            color: correct ? QUIZ_CORRECT_TEXT : QUIZ_WRONG_TEXT,
            resolution: TEXT_RESOLUTION,
          },
        )
        .setOrigin(0.5, 0)
      content.add(feedback)

      const isLast = index === total - 1
      const nextBtn = buildActionButton(
        this.ctx,
        isLast ? 'Lihat Hasil →' : 'Soal Berikutnya →',
        EVAL_CENTER_X,
        feedbackY + EVAL_FEEDBACK_BUTTON_GAP,
        260,
        'primary',
        () => {
          if (this.navigating) return
          this.navigating = true
          audio.play('click')
          fadeUpOut(this.scene, content, 180, 20, () => {
            if (isLast) this.renderEvaluationResult()
            else this.renderQuizQuestion(index + 1)
          })
        },
      )
      content.add(nextBtn)
      state.contentInteractives.push(nextBtn)
    }

    pillRefs.forEach((ref) => {
      attachButtonBehaviour(this.ctx, ref.container, () => selectOption(ref.opt))
      state.contentInteractives.push(ref.container)
    })

    fadeDownIn(this.scene, content, 0, 20, 240)
  }

  /** A rounded option pill, built at local origin (0,0) — callers position it once its final height is known. */
  private buildOptionPill(opt: QuizQuestion['options'][number], width: number) {
    const paddingX = 20
    const badgeSize = 40
    const badgeCx = -width / 2 + paddingX + badgeSize / 2
    const textX = badgeCx + badgeSize / 2 + 16
    const textWidth = width / 2 - textX - paddingX

    const text = this.scene.add
      .text(textX, 0, opt.text, {
        fontFamily: FONT_BODY,
        fontStyle: '700',
        fontSize: '16px',
        color: TEXT_COLOR,
        wordWrap: { width: textWidth },
        lineSpacing: 4,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)

    const height = Math.max(EVAL_OPTION_HEIGHT, text.height + 32)

    const bg = this.scene.add.graphics()
    this.paintOptionPill(bg, width, height, 'neutral')

    const badgeRadius = badgeSize / 2
    const badge = this.scene.add.graphics().lineStyle(2, QUIZ_NEUTRAL_BORDER, 0.6).strokeCircle(badgeCx, 0, badgeRadius)

    const badgeText = this.scene.add
      .text(badgeCx, 0, opt.key, {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '14px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)

    const container = this.scene.add.container(0, 0, [bg, badge, badgeText, text])
    container.setSize(width, height)

    return { container, bg, badge, badgeText, text, width, height, badgeCx, badgeRadius }
  }

  private paintOptionPill(gfx: Phaser.GameObjects.Graphics, width: number, height: number, state: 'neutral' | 'correct' | 'wrong' | 'dim') {
    const radius = Math.min(height / 2, 26)
    const fill = state === 'correct' ? QUIZ_CORRECT_FILL : state === 'wrong' ? QUIZ_WRONG_FILL : 0xffffff
    const stroke = state === 'correct' ? QUIZ_CORRECT_BORDER : state === 'wrong' ? QUIZ_WRONG_BORDER : state === 'dim' ? 0xd8d8d8 : QUIZ_NEUTRAL_BORDER
    const strokeAlpha = state === 'neutral' ? 0.3 : 1

    gfx
      .clear()
      .fillStyle(fill, 1)
      .fillRoundedRect(-width / 2, -height / 2, width, height, radius)
      .lineStyle(2, stroke, strokeAlpha)
      .strokeRoundedRect(-width / 2, -height / 2, width, height, radius)
  }

  private renderEvaluationResult() {
    const state = this.state
    this.clearEvaluationContent()

    // work_theme's job is done — stop it and mark the moment with a one-shot
    // instead of leaving the quiz track running under the results card.
    audio.setProfile('silent')
    audio.play('completeEvaluation')

    const total = state.questions.length
    const score = state.score
    const tier = scoreTier(score, total)
    const icon = Phaser.Utils.Array.GetRandom(RESULT_ICONS[tier])

    const content = this.scene.add.container(0, 0)
    this.body.add(content)
    state.content = content

    const cardLeft = EVAL_CENTER_X - RESULT_CARD_WIDTH / 2
    const cardTop = RESULT_CARD_TOP

    const card = this.scene.add
      .graphics()
      .fillStyle(0x000000, 0.08)
      .fillRoundedRect(cardLeft + 3, cardTop + 5, RESULT_CARD_WIDTH, RESULT_CARD_HEIGHT, 28)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(cardLeft, cardTop, RESULT_CARD_WIDTH, RESULT_CARD_HEIGHT, 28)
      .lineStyle(2, CARD_EDGE, 1)
      .strokeRoundedRect(cardLeft, cardTop, RESULT_CARD_WIDTH, RESULT_CARD_HEIGHT, 28)
    content.add(card)

    const iconImage = coverFit(this.scene.add.image(EVAL_CENTER_X, cardTop + 76, icon), 76, 76)
    content.add(iconImage)

    const heading = this.scene.add
      .text(EVAL_CENTER_X, cardTop + 142, 'Evaluasi Selesai!', {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '28px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
    content.add(heading)

    const skorLabel = this.scene.add
      .text(EVAL_CENTER_X, cardTop + 184, 'Skor kamu', {
        fontFamily: FONT_BODY,
        fontStyle: '600',
        fontSize: '16px',
        color: MUTED_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
    content.add(skorLabel)

    const scoreBig = this.scene.add
      .text(EVAL_CENTER_X - 6, cardTop + 230, String(score), {
        fontFamily: FONT_HEADING,
        fontStyle: '800',
        fontSize: '48px',
        color: TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(1, 0.5)
    content.add(scoreBig)

    const scoreTotal = this.scene.add
      .text(EVAL_CENTER_X + 6, cardTop + 230, `/ ${total}`, {
        fontFamily: FONT_HEADING,
        fontStyle: '700',
        fontSize: '22px',
        color: MUTED_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)
    content.add(scoreTotal)

    const messageText = this.scene.add
      .text(EVAL_CENTER_X, cardTop + 288, SCORE_TIER_MESSAGE[tier], {
        fontFamily: FONT_BODY,
        fontStyle: '600',
        fontSize: '15px',
        color: TEXT_COLOR,
        align: 'center',
        wordWrap: { width: RESULT_CARD_WIDTH - 96 },
        lineSpacing: 4,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
    content.add(messageText)

    const buttonY = cardTop + RESULT_CARD_HEIGHT + 60
    const retryBtn = buildActionButton(this.ctx, 'Coba Lagi', EVAL_CENTER_X - 132, buttonY, 240, 'primary', () => {
      if (this.navigating) return
      this.navigating = true
      audio.play('click')
      fadeUpOut(this.scene, content, 180, 20, () => this.resetEvaluation())
    })
    content.add(retryBtn)
    state.contentInteractives.push(retryBtn)

    const homeBtn = buildActionButton(this.ctx, 'Ke Beranda', EVAL_CENTER_X + 132, buttonY, 240, 'secondary', () => this.onExitHome())
    content.add(homeBtn)
    state.contentInteractives.push(homeBtn)

    fadeDownIn(this.scene, content, 0, 20, 240)
  }

  /** "Coba Lagi": score/progress reset, then straight back through the countdown (the instructions card was already read). */
  private resetEvaluation() {
    const state = this.state
    state.score = 0
    state.index = 0
    state.questions = shuffleQuestions(EVALUATION_QUESTIONS)
    this.startCountdown()
  }
}
