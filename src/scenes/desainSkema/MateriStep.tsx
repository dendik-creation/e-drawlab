import ActionButton from '../../ui/ActionButton'
import { textureUrl } from '../../ui/assets/textures'
import './materi.css'

/**
 * Langkah 1 — the component-symbol reference grid: an intro paragraph and
 * eleven cards, six to a row, the last row centred on whatever is left.
 * A CSS grid does the row maths the canvas version worked out per card.
 */

const COMPONENTS = [
  { texture: 'elec-resistor', label: 'Resistor', desc: 'Membatasi arus listrik yang mengalir dalam rangkaian.' },
  { texture: 'elec-capacitor', label: 'Kapasitor', desc: 'Menyimpan muatan listrik sementara di dalam rangkaian.' },
  { texture: 'elec-diode', label: 'Dioda', desc: 'Mengalirkan arus hanya satu arah, mencegah arus balik.' },
  { texture: 'elec-led', label: 'LED', desc: 'Memancarkan cahaya saat dialiri arus searah dari anoda ke katoda.' },
  { texture: 'elec-ic-chip', label: 'IC (Chip)', desc: 'Sirkuit terpadu yang menjalankan fungsi elektronik kompleks.' },
  { texture: 'elec-battery', label: 'Baterai', desc: 'Sumber tegangan searah yang mengalirkan arus ke seluruh rangkaian.' },
  { texture: 'elec-inductor', label: 'Induktor', desc: 'Menyimpan energi dalam medan magnet saat dialiri arus.' },
  { texture: 'elec-opamp', label: 'Op-Amp', desc: 'Penguat sinyal tegangan untuk pemrosesan analog.' },
  { texture: 'elec-terminal-block', label: 'Terminal Block', desc: 'Titik sambung kabel yang aman dan rapi ke sumber daya.' },
  { texture: 'elec-usb-connector', label: 'Konektor USB', desc: 'Antarmuka daya dan data standar antar perangkat.' },
  { texture: 'elec-pcb-trace', label: 'Jalur PCB', desc: 'Jalur tembaga yang menghubungkan antar komponen di papan.' },
]

const INTRO =
  'Sebelum mulai merancang, kenali dulu simbol-simbol komponen dasar yang dipakai dalam skema elektronika. ' +
  'Simbol ini mengikuti standar internasional IEC/ANSI, sehingga gambar teknikmu bisa dibaca oleh siapa pun.'

export default function MateriStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <p className="dm-intro">{INTRO}</p>

      <div className="dm-grid">
        {COMPONENTS.map((item, index) => (
          <article key={item.texture} className="dm-card edl-pop-in" style={{ animationDelay: `${index * 30}ms` }}>
            <img className="dm-card-icon" src={textureUrl(item.texture)} alt="" draggable={false} />
            <h3 className="dm-card-label">{item.label}</h3>
            <p className="dm-card-desc">{item.desc}</p>
          </article>
        ))}
      </div>

      <div className="dm-footer">
        <ActionButton label="Lanjut →" minWidth={220} onPress={onNext} />
      </div>
    </>
  )
}
