/**
 * The audio register. Filenames are the canonical ones quoted by the proposal
 * (docs/03_Content/Media-Asset-Register.md §Audio) — do not rename them here;
 * rename the file and the register together.
 *
 * Nothing is imported statically: `assets/sounds/` is still empty, and a static
 * import of a missing file fails the build. The glob picks up whatever is
 * actually on disk, so tracks can be dropped in later with no code change, and
 * anything still missing is simply skipped at load time.
 */
const SOUND_URLS = import.meta.glob('../../assets/sounds/*.{webm,ogg,m4a,mp3,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * Order Phaser is offered the encodings in. It keeps the first one the browser
 * reports as playable (`AudioFile.getAudioURL`), so modern containers lead and
 * the universally-supported ones backstop them. Chromium and Firefox take
 * WebM; Safari does not, and falls through to whatever else is on disk.
 */
const EXTENSION_PREFERENCE = ['webm', 'ogg', 'm4a', 'mp3', 'wav']

function stemOf(filename: string) {
  return filename.replace(/\.[^.]+$/, '')
}

/**
 * Files are matched on stem, not full filename: the register names an encoding
 * the proposal happened to assume, and the actual production format is whatever
 * was delivered. Dropping `click.webm` alongside `click.mp3` yields both, in
 * preference order, and Phaser picks per browser.
 */
const URLS_BY_STEM = new Map<string, string[]>()

Object.entries(SOUND_URLS).forEach(([path, url]) => {
  const filename = path.split('/').pop() as string
  const stem = stemOf(filename)
  URLS_BY_STEM.set(stem, [...(URLS_BY_STEM.get(stem) ?? []), url])
})

URLS_BY_STEM.forEach((urls) =>
  urls.sort((a, b) => {
    const rank = (url: string) =>
      EXTENSION_PREFERENCE.indexOf(url.split('.').pop()?.split('?')[0] ?? '')
    return rank(a) - rank(b)
  }),
)

export type AudioLayer = 'sfx' | 'music' | 'ambience'

export interface AudioAsset {
  file: string
  layer: AudioLayer
}

/**
 * One-shot interaction and validation sounds. Preloaded with the shell
 * (Feature-Audio-System §Engineering constraints 5) since they are tiny and
 * needed the instant the learner touches anything.
 */
export const SFX = {
  click: { file: 'click.mp3', layer: 'sfx' },
  hover: { file: 'sfx_hover.mp3', layer: 'sfx' },
  paper: { file: 'paper.wav', layer: 'sfx' },
  pencil: { file: 'pencil_draw.wav', layer: 'sfx' },
  buzz: { file: 'buzz.wav', layer: 'sfx' },
  connect: { file: 'connect.wav', layer: 'sfx' },
  short: { file: 'short.mp3', layer: 'sfx' },
  lockSuccess: { file: 'lock_success.wav', layer: 'sfx' },
  crash: { file: 'crash.mp3', layer: 'sfx' },
  applause: { file: 'applause.wav', layer: 'sfx' },
  bell: { file: 'bell.wav', layer: 'sfx' },
  buttonClick: { file: 'sfx_click.wav', layer: 'sfx' },
  // Sounds the register does not name; add the files to claim them.
  /** Wrong quiz answer. The register pairs `bell` with nothing for the failure case. */
  quizWrong: { file: 'quiz_wrong.mp3', layer: 'sfx' },
  pause: { file: 'pause.mp3', layer: 'sfx' },
  resume: { file: 'resume.mp3', layer: 'sfx' },
  /** Every component in a Desain Skema work sheet is correctly wired. */
  allConnected: { file: 'all_connected_success.ogg', layer: 'sfx' },
  /** Langkah 3 evaluation quiz finished — plays once the results card appears, replacing work_theme. */
  completeEvaluation: { file: 'complete_evaluation.ogg', layer: 'sfx' },
  /** Detent tick while dragging a simulator slider. Fired per value step, throttled by the widget. */
  sliderTick: { file: 'slider-tick.ogg', layer: 'sfx' },
  /** Jalur PCB simulator verdicts — one per status, fired only when the status actually changes. */
  statusSafe: { file: 'status-safe.ogg', layer: 'sfx' },
  statusWarning: { file: 'status-warning.ogg', layer: 'sfx' },
  statusDanger: { file: 'status-danger.ogg', layer: 'sfx' },
  /** Home's mascot greeting voice line — lip-synced to the mouth-flap cycle, ducks the BGM for its duration. */
  dubbingGreeting: { file: 'dubbing_greeting.ogg', layer: 'sfx' },
} as const satisfies Record<string, AudioAsset>

/** Looping score. One track per context, cross-faded or ducked between scenes. */
export const MUSIC = {
  drawingTheme: { file: 'drawing_theme.mp3', layer: 'music' },
  /**
   * One track for every screen where the learner is working a problem. Not in
   * the register — the proposal assumed a distinct track per stage, but only a
   * single "soal" theme was produced. The per-stage entries below stay so a
   * profile can be pointed back at them the moment those tracks exist.
   */
  workTheme: { file: 'work_theme.mp3', layer: 'music' },
  routingFocus: { file: 'routing_focus.mp3', layer: 'music' },
  cadTension: { file: 'cad_tension.mp3', layer: 'music' },
  victoryDesign: { file: 'victory_design.mp3', layer: 'music' },
} as const satisfies Record<string, AudioAsset>

/** Looping room tone, always the quietest layer. */
export const AMBIENCE = {
  studio: { file: 'studio_ambience.mp3', layer: 'ambience' },
  pcFan: { file: 'pc_fan_hum.mp3', layer: 'ambience' },
  printer3d: { file: '3d_printer.mp3', layer: 'ambience' },
} as const satisfies Record<string, AudioAsset>

export type SfxKey = keyof typeof SFX
export type MusicKey = keyof typeof MUSIC
export type AmbienceKey = keyof typeof AMBIENCE

export const AUDIO_ASSETS: Record<string, AudioAsset> = { ...SFX, ...MUSIC, ...AMBIENCE }

/**
 * Every bundled encoding of a registry key, best-supported first. Empty when the
 * sound has not been produced yet.
 */
export function resolveAudioUrls(key: string): string[] {
  const asset = AUDIO_ASSETS[key]
  return asset ? (URLS_BY_STEM.get(stemOf(asset.file)) ?? []) : []
}

export interface AudioProfile {
  /** Authored volumes, straight from the register. */
  music?: { key: MusicKey; volume: number }
  ambience?: { key: AmbienceKey; volume: number }
}

/**
 * Scene audio contexts. The split that matters is ordinary screens versus
 * screens where the learner is working a problem — `drawing_theme` for the
 * former, `work_theme` for the latter, cross-faded on the way in.
 *
 * The register's ducking spec (15% → 10% "untuk menyokong konsentrasi penuh
 * murid") assumed one shared track riding its volume down. With two tracks the
 * intent survives as the quieter authored volumes below, and the director still
 * ducks rather than restarts whenever two profiles do share a track.
 */
export const AUDIO_PROFILES = {
  /** Nothing playing — splash before unlock, or an explicit silence. */
  silent: {},

  /** Ordinary screens: splash, home, settings, browsing results. */
  menu: {
    music: { key: 'drawingTheme', volume: 0.15 },
    ambience: { key: 'studio', volume: 0.05 },
  },

  /** Stage 1 — schematic workbench. */
  schematic: {
    music: { key: 'workTheme', volume: 0.1 },
    ambience: { key: 'studio', volume: 0.05 },
  },

  /** Stage 2 — PCB router. Swap to `routingFocus` once that track is produced. */
  pcb: {
    music: { key: 'workTheme', volume: 0.12 },
    ambience: { key: 'pcFan', volume: 0.06 },
  },

  /** Stage 3 — casing modeller. Swap to `cadTension` once that track is produced. */
  casing: {
    music: { key: 'workTheme', volume: 0.12 },
    ambience: { key: 'printer3d', volume: 0.05 },
  },

  /** Quiz. */
  quiz: {
    music: { key: 'workTheme', volume: 0.1 },
  },

  /** Results dashboard and badge award. */
  results: {
    music: { key: 'victoryDesign', volume: 0.15 },
  },
} as const satisfies Record<string, AudioProfile>

export type AudioProfileKey = keyof typeof AUDIO_PROFILES
