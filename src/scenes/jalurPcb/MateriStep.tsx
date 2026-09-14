import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import ActionButton from '../../ui/ActionButton'
import Pressable from '../../ui/Pressable'
import { JALUR_ART, JALUR_ICONS } from './jalurAssets'
import './materi.css'

/**
 * Langkah 1 — the Jalur PCB theory page.
 *
 * Nine authored sections, paged one at a time through a carousel instead of
 * one long scroll — each slide fits comfortably inside the materi container
 * (tallest section is 535px against a 620px stage), so nothing here needs
 * `content-visibility` culling or a hand-rolled scrollbar. "Lanjut" unlocks
 * once the learner has paged through to the last slide.
 */

const CONTENT_WIDTH = 1096
const STAGE_TOP = 176
const STAGE_HEIGHT = 620
const DOTS_TOP = STAGE_TOP + STAGE_HEIGHT + 22

/** Authored section heights, straight from the Figma frame's section tops. */
const SECTION_HEIGHTS = [386.25, 430.17, 406, 315.28, 378, 411, 535, 390, 264.375]
const TOTAL_SLIDES = SECTION_HEIGHTS.length
const LAST_SLIDE = TOTAL_SLIDES - 1

function px(value: number) {
  return `${value}px`
}

/** Absolutely-positioned block at an authored offset inside its slide. */
function At({
  x,
  y,
  w,
  h,
  className,
  style,
  children,
}: {
  x: number
  y: number
  w?: number
  h?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: px(x),
        top: px(y),
        ...(w === undefined ? {} : { width: px(w) }),
        ...(h === undefined ? {} : { height: px(h) }),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** White rounded card with a subtle border and drop shadow — the wrapper around every illustration. */
function AssetPanel({ x, y, w, h, src, imgW, imgH }: { x: number; y: number; w: number; h: number; src: string; imgW: number; imgH: number }) {
  return (
    <At x={x} y={y} w={w} h={h} className="jm-panel">
      <img src={src} alt="" draggable={false} style={{ width: px(imgW), height: px(imgH) }} />
    </At>
  )
}

function Icon({ src, size, className, style }: { src: string; size: number; className?: string; style?: CSSProperties }) {
  return <img className={className} src={src} alt="" draggable={false} style={{ width: px(size), height: px(size), ...style }} />
}

export default function MateriStep({ onNext }: { onNext: () => void }) {
  const [index, setIndex] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const readToEnd = maxReached >= LAST_SLIDE

  useEffect(() => {
    setMaxReached((prev) => Math.max(prev, index))
  }, [index])

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex((i) => Math.min(LAST_SLIDE, i + 1)), [])
  const goTo = useCallback((i: number) => setIndex(i), [])

  return (
    <>
      <div className="jm-stage" style={{ top: px(STAGE_TOP), height: px(STAGE_HEIGHT) }}>
        <Pressable
          className="jm-nav-btn"
          ariaLabel="Konten sebelumnya"
          disabled={index === 0}
          onPress={goPrev}
        >
          <Icon src={JALUR_ICONS.arrowRight} size={18} style={{ transform: 'scaleX(-1)' }} />
        </Pressable>

        <div className="jm-slide-frame" style={{ width: px(CONTENT_WIDTH) }}>
          <div key={index} className="jm-slide edl-fade-down" style={{ width: px(CONTENT_WIDTH), height: px(SECTION_HEIGHTS[index]) }}>
            {SLIDE_CONTENT[index]}
          </div>
        </div>

        <Pressable
          className="jm-nav-btn"
          ariaLabel="Konten berikutnya"
          disabled={index === LAST_SLIDE}
          onPress={goNext}
        >
          <Icon src={JALUR_ICONS.arrowRight} size={18} />
        </Pressable>
      </div>

      <div className="jm-dots" style={{ top: px(DOTS_TOP) }}>
        {SECTION_HEIGHTS.map((_, i) => (
          <Pressable
            key={i}
            className={i === index ? 'jm-dot is-active' : 'jm-dot'}
            ariaLabel={`Ke konten ${i + 1}`}
            pressSound={null}
            onPress={() => goTo(i)}
          />
        ))}
      </div>

      <div className="jm-footer">
        <ActionButton label="Lanjut →" minWidth={220} disabled={!readToEnd} onPress={onNext} />
      </div>
    </>
  )
}

const SLIDE_CONTENT: ReactNode[] = [
  // 0 — Penentuan Lebar Jalur PCB
  <>
    <At x={0} y={0} w={460}>
      <h2 className="jm-hero-heading">{'Penentuan Lebar\nJalur PCB'}</h2>
    </At>
    <At x={0} y={106} w={460}>
      <p className="jm-para" style={{ fontSize: px(17) }}>
        Jalur PCB adalah jalur tembaga yang menghubungkan komponen dan membawa arus listrik pada rangkaian. Lebar
        jalur perlu ditentukan agar mampu membawa arus dengan aman tanpa mengalami pemanasan berlebihan.
      </p>
    </At>
    <AssetPanel x={572} y={0} w={524} h={290} src={JALUR_ART.arusMengalir} imgW={474} imgH={240} />
    <At x={572} y={302} w={524}>
      <p className="jm-caption">Arus mengalir melalui jalur tembaga pada PCB.</p>
    </At>
  </>,

  // 1 — Mengapa Lebar Jalur Penting?
  <>
    <At x={0} y={0} w={472}>
      <h3 className="jm-title">Mengapa Lebar Jalur Penting?</h3>
    </At>
    <At x={0} y={46} w={440}>
      <p className="jm-para">
        Semakin besar arus yang mengalir, semakin besar kemampuan penghantaran yang dibutuhkan oleh jalur PCB. Salah
        satu pendekatan sederhana adalah menggunakan jalur yang lebih lebar.
      </p>
    </At>
    <At x={0} y={158} w={440} h={146} className="jm-dark-card">
      <span className="jm-dark-label">ARUS MENINGKAT</span>
      <Icon src={JALUR_ICONS.trendUp} size={22} style={{ opacity: 0.85 }} />
      <span className="jm-dark-label jm-dark-label-wrap">KEBUTUHAN LEBAR JALUR MENINGKAT</span>
    </At>
    <AssetPanel x={520} y={51} w={432} h={264} src={JALUR_ART.perbandinganLebar} imgW={386} imgH={218} />
    {[
      ['Arus kecil', '0,5 A', '1 mm'],
      ['Arus sedang', '1,5 A', '2,5 mm'],
      ['Arus besar', '3 A', '5 mm'],
    ].map(([label, value, sub], i) => (
      <At key={label} x={520 + 432 + 28} y={71 + i * 80} w={140} h={64} className="jm-legend-row">
        <span className="jm-legend-label">{label}</span>
        <span className="jm-legend-value">{value}</span>
        <span className="jm-legend-sub">{sub}</span>
      </At>
    ))}
  </>,

  // 2 — Apa yang Membentuk Jalur PCB?
  <>
    <At x={0} y={0} w={CONTENT_WIDTH}>
      <h3 className="jm-title jm-center">Apa yang Membentuk Jalur PCB?</h3>
    </At>
    <At x={0} y={130} w={275} className="jm-right-align">
      <span className="jm-label">Lapisan Tembaga</span>
    </At>
    <At x={285} y={132}>
      <Icon src={JALUR_ICONS.copperLayer} size={20} />
    </At>
    <At x={0} y={165} w={275}>
      <p className="jm-para jm-para-sm jm-right-align">Bagian penghantar yang membawa arus listrik.</p>
    </At>
    <AssetPanel x={307} y={32} w={482} h={278} src={JALUR_ART.penampangPcb} imgW={424} imgH={220} />
    <At x={821} y={130} w={276}>
      <span className="jm-label">Substrat PCB</span>
    </At>
    <At x={789 + 32} y={132} style={{ left: px(789 + 32 - 32) }}>
      <Icon src={JALUR_ICONS.substrate} size={20} />
    </At>
    <At x={821} y={165} w={276}>
      <p className="jm-para jm-para-sm">Material dasar tempat lapisan tembaga berada.</p>
    </At>
  </>,

  // 3 — Faktor yang Memengaruhi Lebar Jalur
  <>
    <At x={0} y={0} w={CONTENT_WIDTH}>
      <h3 className="jm-title">Faktor yang Memengaruhi Lebar Jalur</h3>
    </At>
    {[
      { icon: JALUR_ICONS.factor01, number: '01', label: 'Besarnya Arus', desc: 'Arus yang lebih besar membutuhkan kemampuan penghantaran yang lebih besar.' },
      { icon: JALUR_ICONS.factor02, number: '02', label: 'Ketebalan Tembaga', desc: 'Ketebalan lapisan tembaga memengaruhi kemampuan jalur membawa arus.' },
      { icon: JALUR_ICONS.factor03, number: '03', label: 'Panjang Jalur', desc: 'Panjang jalur perlu diperhatikan dalam desain PCB.' },
      { icon: JALUR_ICONS.factor04, number: '04', label: 'Kemampuan Pembuatan', desc: 'Jalur yang terlalu tipis lebih sulit dibuat pada proses PCB sederhana.' },
    ].map((card, i) => (
      <At key={card.number} x={i * (259 + 20)} y={60} w={259} h={191.28} className="jm-factor-card">
        <div className="jm-factor-badge">
          <Icon src={card.icon} size={20} />
        </div>
        <span className="jm-factor-number">{card.number}</span>
        <span className="jm-factor-label">{card.label}</span>
        <p className="jm-para jm-para-xs jm-factor-desc">{card.desc}</p>
      </At>
    ))}
  </>,

  // 4 — Mengapa Jalur Tidak Boleh Terlalu Tipis?
  <>
    <At x={0} y={0} w={CONTENT_WIDTH}>
      <h3 className="jm-title jm-center">Mengapa Jalur Tidak Boleh Terlalu Tipis?</h3>
    </At>
    <At x={0} y={111} w={313} h={92.5} className="jm-compare-card is-soft">
      <span className="jm-compare-title jm-right-align">Jalur terlalu tipis</span>
      <div className="jm-compare-meta is-right">
        <span className="jm-compare-meta-text">pemanasan berlebihan</span>
        <Icon src={JALUR_ICONS.arrowRight} size={15} />
      </div>
    </At>
    <AssetPanel x={345} y={57.25} w={407} h={200} src={JALUR_ART.perbandinganTipisLebar} imgW={357} imgH={200} />
    <At x={784} y={111} w={313} h={92.5} className="jm-compare-card is-dark">
      <span className="jm-compare-title">Lebar sesuai</span>
      <div className="jm-compare-meta">
        <Icon src={JALUR_ICONS.arrowRight} size={15} style={{ opacity: 0.9 }} />
        <span className="jm-compare-meta-text">penghantaran lebih aman</span>
      </div>
    </At>
  </>,

  // 5 — Rumus Praktis Penentuan Lebar Jalur
  <>
    <At x={0} y={0} w={CONTENT_WIDTH}>
      <h3 className="jm-title jm-center">Rumus Praktis Penentuan Lebar Jalur</h3>
    </At>
    <At x={0} y={32} w={CONTENT_WIDTH} h={283} className="jm-formula-card">
      <p className="jm-formula">Lebar Jalur (mm)&nbsp;&nbsp;=&nbsp;&nbsp;Arus (A)&nbsp;&nbsp;×&nbsp;&nbsp;Faktor Pengali</p>
      <p className="jm-subformula">Arus (I)&nbsp;&nbsp;=&nbsp;&nbsp;Daya (P)&nbsp;&nbsp;/&nbsp;&nbsp;Tegangan (V)</p>
      <div className="jm-divider" />
      <p className="jm-para jm-para-xs jm-center jm-formula-note">
        Rumus ini digunakan sebagai pendekatan sederhana dalam simulator pembelajaran. Dalam desain PCB sebenarnya,
        penentuan lebar jalur mempertimbangkan lebih banyak parameter teknis.
      </p>
    </At>
  </>,

  // 6 — Contoh Perhitungan
  <>
    <At x={0} y={0} w={CONTENT_WIDTH}>
      <h3 className="jm-title">Contoh Perhitungan</h3>
    </At>
    <At x={0} y={42} w={CONTENT_WIDTH} className="jm-calc-row">
      <div className="jm-chip" style={{ width: px(120) }}>
        <span className="jm-chip-label">Arus</span>
        <span className="jm-chip-value">1 A</span>
      </div>
      <span className="jm-op">×</span>
      <div className="jm-chip" style={{ width: px(135) }}>
        <span className="jm-chip-label">Faktor Pengali</span>
        <span className="jm-chip-value">2</span>
      </div>
      <span className="jm-op">=</span>
      <div className="jm-chip" style={{ width: px(123) }}>
        <span className="jm-chip-label">Perhitungan</span>
        <span className="jm-chip-value">1 × 2</span>
      </div>
      <span className="jm-op">=</span>
      <div className="jm-chip is-dark" style={{ width: px(180) }}>
        <span className="jm-chip-label">Lebar Jalur</span>
        <span className="jm-chip-value is-big">2 mm</span>
      </div>
    </At>
    <AssetPanel x={0} y={179} w={601} h={260} src={JALUR_ART.arusDiproses} imgW={551} imgH={210} />
    {[
      { value: '1 A', barH: 8, width: 90, result: '2 mm' },
      { value: '2 A', barH: 16, width: 90, result: '4 mm' },
    ].map((row, i) => (
      <At key={row.value} x={633} y={189 + i * 86} w={463} h={70} className="jm-step-row">
        <span className="jm-step-value">{row.value}</span>
        <Icon src={JALUR_ICONS.arrowRight} size={18} />
        <div className="jm-step-bar" style={{ width: px(row.width), height: px(row.barH), borderRadius: px(row.barH / 2) }} />
        <span className="jm-step-result">{row.result}</span>
      </At>
    ))}
    <At x={633} y={373} w={463}>
      <p className="jm-para jm-para-sm jm-muted">
        •&nbsp;&nbsp;Arus bertambah lebar jalur bertambah. Nilai 2 A × 2 = 4 mm menghasilkan jalur yang tampak dua kali
        lebih lebar.
      </p>
    </At>
  </>,

  // 7 — Apa Arti Lebar Jalur 2 mm?
  <>
    <AssetPanel x={0} y={0} w={576} h={270} src={JALUR_ART.pengukuranLebar} imgW={526} imgH={220} />
    <At x={0} y={286} w={576} className="jm-measure-legend">
      <Icon src={JALUR_ICONS.arrowLeftRight} size={18} />
      <span className="jm-measure-pill">2 mm</span>
      <Icon src={JALUR_ICONS.arrowLeftRight} size={18} />
    </At>
    <At x={624} y={81} w={472}>
      <h3 className="jm-title">Apa Arti Lebar Jalur 2 mm?</h3>
    </At>
    <At x={624} y={127} w={472}>
      <p className="jm-para">
        Lebar jalur adalah ukuran melintang dari satu sisi jalur tembaga ke sisi lainnya. Angka 2 mm yang dihasilkan
        simulator mewakili lebar fisik yang nyata pada papan PCB.
      </p>
    </At>
  </>,

  // 8 — Yang Perlu Kamu Ingat
  <>
    <At x={0} y={0} w={CONTENT_WIDTH}>
      <h3 className="jm-title">Yang Perlu Kamu Ingat</h3>
    </At>
    {[
      { number: '01', label: 'Arus lebih besar', desc: 'jalur cenderung membutuhkan lebar yang lebih besar.' },
      { number: '02', label: 'Lebar jalur', desc: 'menentukan kemampuan penghantaran pada pendekatan pembelajaran ini.' },
      { number: '03', label: 'Simulator', desc: 'digunakan untuk menerapkan konsep tersebut secara langsung.' },
    ].map((item, i) => (
      <At key={item.number} x={i * (352 + 20)} y={60} w={352} h={204.375} className="jm-recap-card">
        <span className="jm-recap-number">{item.number}</span>
        <span className="jm-recap-label">{item.label}</span>
        <p className="jm-para jm-para-sm jm-recap-desc">{item.desc}</p>
      </At>
    ))}
  </>,
]
