import ActionButton from '../../ui/ActionButton'
import compareUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/materi/illustration_perbandingan_ketat_ideal.png'
import topViewUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/materi/illustration_tampak_atas.png'
import sideViewUrl from '../../../assets/images/03_electronic_assets/grouped/03_Cad_Casing/materi/illustration_tampak_samping.png'
import './materi.css'

/**
 * Langkah 1 — the CAD Casing theory page: an intro paragraph, three
 * illustrated diagram cards, and a dark formula band recapping the sizing
 * rules. It fits one screen, so unlike Jalur PCB's materi there is nothing to
 * scroll.
 *
 * The three diagrams are flattened PNG exports of Figma's CompareDiagram,
 * TopViewDiagram and SideViewDiagram groups — each is a dense nest of small
 * vector groups not worth hand-redrawing.
 */

/** Three-up diagram grid: sliced from Figma's "Container" 139:305 — a 1573px row centred on the design frame. */
const ROW_WIDTH = 1573
const ROW_LEFT = (1920 - ROW_WIDTH) / 2
const CARD_GAP = 21
const CARD_WIDTH = (ROW_WIDTH - CARD_GAP * 2) / 3

const DIAGRAMS = [
  {
    src: compareUrl,
    panelHeight: 196,
    title: 'Casing Terlalu Ketat vs Ideal',
    caption: 'Casing ideal menyisakan celah merata di semua sisi PCB.',
    body: 'Tanpa celah, PCB sulit dipasang dan berisiko korsleting. Celah merata memberi ruang toleransi yang aman.',
  },
  {
    src: topViewUrl,
    panelHeight: 230,
    title: 'Tampak Atas (X-Y) — Celah & Dinding',
    caption: 'Pandangan orthografis dari atas: PCB, celah samping, lalu dinding casing.',
    body: 'Ukuran X-Y = ukuran PCB + 2× celah samping + 2× tebal dinding. Celah memberi toleransi dan akses solder di tepi papan.',
  },
  {
    src: sideViewUrl,
    panelHeight: 282,
    title: 'Tampak Samping (X-Z) — Lapisan Vertikal',
    caption: 'Penampang samping: pilar, PCB, komponen, dan celah bebas di atasnya.',
    body: 'Standoff menjaga sisi bawah PCB tidak menyentuh casing, sementara celah bebas atas memberi ventilasi dan ruang kabel.',
  },
]

/** One row of the formula band: a bold label, then `term = term + term…` chips. */
const FORMULA_ROWS = [
  { label: 'Dimensi X / Y Casing', terms: ['Dimensi PCB', '2 × Celah Samping', '2 × Tebal Dinding'] },
  { label: 'Tinggi Z Casing', terms: ['Tinggi Pilar', 'Tebal PCB', 'Tinggi Komponen Tertinggi', 'Celah Bebas Atas'] },
]

const INTRO =
  'Casing melindungi PCB dari debu dan kontak listrik yang tidak di inginkan. Namun casing tidak boleh berukuran sama ' +
  'persis dengan PCB. Selalu diperlukan ruang toleransi di sekelilingnya. Ukuran casing yang ideal mempertimbangkan ' +
  'dimensi PCB, celah di sekeliling papan, tebal, tinggi komponen, serta ruang untuk sirkulasi udara dan jalur kabel.'

export default function MateriStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <p className="cm-intro">{INTRO}</p>

      <div className="cm-row" style={{ left: ROW_LEFT, width: ROW_WIDTH }}>
        {DIAGRAMS.map((item, index) => (
          <article
            key={item.title}
            className="cm-card edl-pop-in"
            style={{ width: CARD_WIDTH, animationDelay: `${index * 30}ms` }}
          >
            <h3 className="cm-card-title">{item.title}</h3>
            <div className="cm-card-panel" style={{ height: item.panelHeight }}>
              <img src={item.src} alt="" draggable={false} />
            </div>
            <p className="cm-card-caption">{item.caption}</p>
            <p className="cm-card-body">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="cm-formula" style={{ left: ROW_LEFT, width: ROW_WIDTH, animationDelay: '90ms' }}>
        {FORMULA_ROWS.map((row, index) => (
          <div key={row.label} className="cm-formula-row" data-divided={index > 0 ? '' : undefined}>
            <span className="cm-formula-label">{row.label}</span>
            <span className="cm-formula-equals">=</span>
            {row.terms.map((term, termIndex) => (
              <span key={term} className="cm-formula-term">
                {termIndex > 0 && <span className="cm-formula-plus">+</span>}
                <span className="cm-formula-chip">{term}</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="cm-footer">
        <ActionButton label="Lanjut →" minWidth={220} onPress={onNext} />
      </div>
    </>
  )
}
