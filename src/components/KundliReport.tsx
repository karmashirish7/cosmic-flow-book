import KundaliChart from '@/components/KundaliChart'
import { ASTROKARMAZ } from '@/brand'
import {
  BS_MONTHS, NAKSHATRAS, RASHIS, VARGAS,
  dms, fmtBirthDate, fmtDate, grahaName, isCurrent, pad2,
  type BirthDetails, type KundliResponse, type KundliView,
} from '@/lib/kundli'

/**
 * The printable Kundli: hidden on screen, it replaces the page when printing
 * ("Download PDF"). Laid out for A4 portrait in millimetres and points:
 *   1 · birth details, panchang, essentials, D1 + D9
 *   2 · planetary positions, six divisional charts
 *   3 · the other eight divisional charts, legend
 *   4 · Vimshottari dasha, current pratyantardasha
 * Charts come before the dasha, which closes the report.
 */

const MAROON = '#8B1E1E'

const CSS = `
@page {
  size: A4 portrait;
  margin: 14mm 14mm 16mm;
  @bottom-left  { content: "${ASTROKARMAZ.name} · Janma Kundali"; font: 7pt Inter, Arial, sans-serif; color: #9A7B7B; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 7pt Inter, Arial, sans-serif; color: #9A7B7B; }
}
@media print {
  html, body { background: #fff !important; }
  .kr, .kr * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
.kr { font-family: Inter, Arial, sans-serif; font-size: 8.5pt; line-height: 1.35; color: #2B1A1A; }
.kr-page { break-after: page; }
.kr-page:last-child { break-after: auto; }
.kr h1, .kr h2, .kr h3 { font-family: Cinzel, Georgia, serif; color: ${MAROON}; margin: 0; font-weight: 700; }
.kr-gap > * + * { margin-top: 5mm; }

.kr-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 3mm; border-bottom: 1.2pt solid ${MAROON}; }
.kr-header img { height: 22mm; width: auto; }
.kr-header h1 { font-size: 17pt; letter-spacing: 0.4pt; text-align: right; }
.kr-header p { margin: 1mm 0 0; font-size: 7.5pt; color: #8A6D6D; text-align: right; }
.kr-running { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 2mm; border-bottom: 0.6pt solid #E8CFCF; font-size: 7.5pt; color: #8A6D6D; }
.kr-running strong { font-family: Cinzel, Georgia, serif; color: ${MAROON}; font-size: 9pt; }

.kr-name { font-size: 15pt; }
.kr-name-sub { margin-top: 1mm; color: #6B5050; }
.kr-title { font-size: 10.5pt; padding-bottom: 1.2mm; margin-bottom: 2.5mm; border-bottom: 0.5pt solid #E8CFCF; }

.kr-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.kr-box { border: 0.5pt solid #E8CFCF; border-radius: 2mm; padding: 3mm 3.5mm; break-inside: avoid; }

.kr table { width: 100%; border-collapse: collapse; }
.kr th, .kr td { padding: 0.9mm 1.8mm; text-align: left; vertical-align: top; border-bottom: 0.4pt solid #F0E0E0; }
.kr tr:last-child > * { border-bottom: 0; }
.kr-kv th { width: 36%; font-weight: 500; color: #7A5C5C; padding-left: 0; }
.kr-kv td { font-weight: 600; }
.kr-data thead th { background: #F8EDED; color: #6E1818; font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3pt; border-bottom: 0.6pt solid #E8CFCF; }
.kr-data td.mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; font-size: 7.8pt; }
.kr-flag { color: ${MAROON}; font-size: 6.8pt; font-weight: 600; margin-left: 1mm; }

.kr-essentials { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; }
.kr-essentials dt { font-size: 6.8pt; text-transform: uppercase; letter-spacing: 0.3pt; color: #8A6D6D; }
.kr-essentials dd { margin: 0.6mm 0 0; font-weight: 600; font-size: 9pt; }

.kr-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; padding: 0 4mm; }
.kr-chart { break-inside: avoid; }
.kr-chart-title { font-family: Cinzel, Georgia, serif; color: ${MAROON}; font-weight: 700; font-size: 9pt; text-align: center; margin-bottom: 1.5mm; }
.kr-chart-sub { text-align: center; font-size: 7pt; color: #8A6D6D; margin-top: 1mm; }
.kr-vargas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm 7mm; }

.kr-dasha { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3.5mm; }
.kr-md { border: 0.5pt solid #E8CFCF; border-radius: 2mm; overflow: hidden; break-inside: avoid; }
.kr-md.now { border: 0.9pt solid ${MAROON}; }
.kr-md-head { background: #F8EDED; padding: 1.4mm 2.4mm; }
.kr-md-head strong { font-family: Cinzel, Georgia, serif; color: ${MAROON}; font-size: 8.5pt; }
.kr-md-dates { font-size: 6.8pt; color: #7A5C5C; }
.kr-ad { display: flex; justify-content: space-between; gap: 2mm; padding: 0.55mm 2.4mm; font-size: 7.2pt; border-top: 0.3pt solid #F3E4E4; }
.kr-ad span { color: #7A5C5C; }
.kr-ad.now { background: ${MAROON}; color: #fff; font-weight: 600; }
.kr-ad.now span { color: #fff; }
.kr-badge { display: inline-block; margin-left: 1.5mm; padding: 0.2mm 1.4mm; border-radius: 1mm; background: ${MAROON}; color: #fff; font-family: Inter, Arial, sans-serif; font-size: 6pt; font-weight: 600; vertical-align: middle; }
.kr-pd { display: grid; grid-template-columns: repeat(3, 1fr); column-gap: 5mm; }
.kr-pd div { display: flex; justify-content: space-between; padding: 0.9mm 1.5mm; border-bottom: 0.3pt solid #F3E4E4; font-size: 7.3pt; }
.kr-pd div.now { background: #F8EDED; color: ${MAROON}; font-weight: 600; }
.kr-pd span { color: #7A5C5C; }

.kr-legend { font-size: 7.2pt; color: #6B5050; line-height: 1.6; }
.kr-note { font-size: 7pt; color: #8A6D6D; }
`

const DAY = { day: 'numeric', month: 'short', year: 'numeric' } as const

/** "2047-03-01" → "1 Asar 2047 BS" */
const fmtBs = (bs: string) => {
  const [y, m, d] = bs.split('-').map(Number)
  return `${d} ${BS_MONTHS[m - 1]} ${y} BS`
}

const fmtCoord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`

function Kv({ rows }: { rows: [string, string][] }) {
  return (
    <table className="kr-kv">
      <tbody>
        {rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
      </tbody>
    </table>
  )
}

function Running({ who, label }: { who: string; label: string }) {
  return (
    <div className="kr-running">
      <strong>{who}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function KundliReport({ details, data, view }: {
  details: BirthDetails
  data: KundliResponse
  view: KundliView
}) {
  const { chart, dashas, panchang } = data
  const { lagnaRashi, d1, vargaCharts, moon, sun, birthPanchang, dashaNow, localTime } = view
  const who = details.name || 'Birth Chart'

  // Civil date of birth at the birth place, in AD, and in BS when the API's
  // panchang day is that same civil date (it is the previous one before sunrise).
  const civilAd = new Intl.DateTimeFormat('en-CA', { timeZone: chart.tzId }).format(new Date(chart.utcInstant))
  const adLabel = new Date(chart.utcInstant).toLocaleDateString('en-GB', { ...DAY, timeZone: chart.tzId })
  const bsLabel = details.calendar === 'BS'
    ? fmtBirthDate(details)
    : panchang?.date.bs && panchang.date.ad === civilAd ? fmtBs(panchang.date.bs) : null
  const dateLabel = details.calendar === 'BS' ? `${bsLabel} (${adLabel})` : bsLabel ? `${adLabel} (${bsLabel})` : adLabel

  const currentMd = dashas.find(isCurrent)
  const currentAd = currentMd?.children?.find(isCurrent)
  const otherVargas = VARGAS.filter(v => v.key !== 'D1' && v.key !== 'D9' && vargaCharts[v.key])
  const generated = new Date().toLocaleDateString('en-GB', DAY)

  const vargaCard = (v: (typeof VARGAS)[number]) => (
    <div key={v.key} className="kr-chart">
      <div className="kr-chart-title">{v.key} · {v.name}</div>
      <KundaliChart title={`${v.key} · ${v.name}`} showTitle={false} compact
        lagnaSign={vargaCharts[v.key].lagna} houses={vargaCharts[v.key].houses} />
      <div className="kr-chart-sub">{v.signifies}</div>
    </div>
  )

  return (
    <div className="kr hidden print:block">
      <style>{CSS}</style>

      {/* ── Page 1 · birth details, panchang, essentials, D1 + D9 ── */}
      <section className="kr-page kr-gap">
        <header className="kr-header">
          <img src={ASTROKARMAZ.logoPng} alt={ASTROKARMAZ.name} />
          <div>
            <h1>Janma Kundali</h1>
            <p>Vedic birth chart · generated {generated}</p>
          </div>
        </header>

        <div>
          <h2 className="kr-name">{who}</h2>
          <p className="kr-name-sub">{dateLabel} · {pad2(details.hour)}:{pad2(details.minute)} · {details.place}</p>
        </div>

        <div className="kr-grid2">
          <div className="kr-box">
            <h3 className="kr-title">Birth details</h3>
            <Kv rows={[
              ['Date of birth', dateLabel],
              ['Time of birth', `${pad2(details.hour)}:${pad2(details.minute)} local time`],
              ['Place', details.place],
              ['Coordinates', `${fmtCoord(details.lat, 'N', 'S')}, ${fmtCoord(details.lon, 'E', 'W')}`],
              ['Timezone', chart.tzId],
              ['Ayanamsa', `${chart.ayanamsa.toFixed(4)}° (True Chitra Paksha)`],
            ]} />
          </div>
          <div className="kr-box">
            <h3 className="kr-title">Panchang at birth</h3>
            <Kv rows={[
              ['Vaar', panchang ? `${panchang.vaar.name} (${panchang.vaar.nameNe})` : '—'],
              ['Tithi', birthPanchang ? `${birthPanchang.tithi.paksha} ${birthPanchang.tithi.name}` : '—'],
              ['Nakshatra', birthPanchang ? NAKSHATRAS[birthPanchang.nakshatra - 1] : '—'],
              ['Yoga', birthPanchang?.yoga.name ?? '—'],
              ['Karana', birthPanchang?.karana ?? '—'],
              ['Sunrise · Sunset', panchang ? `${localTime(panchang.sunrise)} · ${localTime(panchang.sunset)}` : '—'],
            ]} />
          </div>
        </div>

        <dl className="kr-box kr-essentials">
          {[
            ['Lagna', chart.lagna ? `${RASHIS[chart.lagna.rashi - 1]} ${dms(chart.lagna.degreeInRashi)}` : '—'],
            ['Rashi (Moon sign)', moon ? RASHIS[moon.rashi - 1] : '—'],
            ['Sun sign', sun ? RASHIS[sun.rashi - 1] : '—'],
            ['Nakshatra', moon ? `${NAKSHATRAS[moon.nakshatra - 1]}, pada ${moon.pada}` : '—'],
            ['Current dasha', dashaNow || '—'],
          ].map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>

        <div className="kr-charts">
          <div className="kr-chart">
            <div className="kr-chart-title">D1 · Rashi (Lagna chart)</div>
            <KundaliChart title="D1 · Rashi" showTitle={false} lagnaSign={lagnaRashi}
              houses={d1.houses} degrees={d1.degrees} retrograde={d1.retrograde} />
          </div>
          {vargaCharts.D9 && (
            <div className="kr-chart">
              <div className="kr-chart-title">D9 · Navamsa</div>
              <KundaliChart title="D9 · Navamsa" showTitle={false}
                lagnaSign={vargaCharts.D9.lagna} houses={vargaCharts.D9.houses} />
            </div>
          )}
        </div>
      </section>

      {/* ── Page 2 · planetary positions, first six divisional charts ── */}
      <section className="kr-page kr-gap">
        <Running who={who} label="Planetary positions · Divisional charts 1 of 2" />

        <div>
          <h3 className="kr-title">Planetary positions</h3>
          <table className="kr-data">
            <thead>
              <tr>{['Graha', 'Rashi', 'Degree', 'Nakshatra', 'Pada', 'House', 'Dignity', 'Navamsa'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {chart.lagna && (
                <tr>
                  <td><strong>Lagna</strong></td>
                  <td>{RASHIS[chart.lagna.rashi - 1]}</td>
                  <td className="mono">{dms(chart.lagna.degreeInRashi)}</td>
                  <td>{NAKSHATRAS[Math.floor(chart.lagna.longitude / (360 / 27))]}</td>
                  <td>—</td>
                  <td>1</td>
                  <td>—</td>
                  <td>{vargaCharts.D9 ? RASHIS[vargaCharts.D9.lagna - 1] : '—'}</td>
                </tr>
              )}
              {chart.positions.map(p => {
                const nav = vargaCharts.D9?.positions.find(x => x.graha === p.graha)
                return (
                  <tr key={p.graha}>
                    <td>
                      <strong>{grahaName(p.graha)}</strong>
                      {p.retrograde && <span className="kr-flag">R</span>}
                      {p.combust && <span className="kr-flag">C</span>}
                    </td>
                    <td>{RASHIS[p.rashi - 1]}</td>
                    <td className="mono">{dms(p.degreeInRashi)}</td>
                    <td>{NAKSHATRAS[p.nakshatra - 1]}</td>
                    <td>{p.pada}</td>
                    <td>{p.house || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.dignity.replace('_', ' ')}</td>
                    <td>
                      {nav ? RASHIS[nav.rashi - 1] : '—'}
                      {nav?.vargottama && <span className="kr-flag">V</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="kr-note" style={{ marginTop: '1.5mm' }}>R retrograde · C combust · V vargottama (same sign in D1 and D9)</p>
        </div>

        <div>
          <h3 className="kr-title">Divisional charts (Shodashavarga)</h3>
          <div className="kr-vargas">{otherVargas.slice(0, 6).map(vargaCard)}</div>
        </div>
      </section>

      {/* ── Page 3 · remaining divisional charts ── */}
      <section className="kr-page kr-gap">
        <Running who={who} label="Divisional charts 2 of 2" />
        <div className="kr-vargas">{otherVargas.slice(6).map(vargaCard)}</div>
        <div className="kr-box kr-legend">
          <h3 className="kr-title">Reading the charts</h3>
          North Indian style: the top centre diamond is the 1st house (Lagna), counted anticlockwise.
          Small numbers are rashis (1 Aries … 12 Pisces). Su Sun · Mo Moon · Ma Mars · Me Mercury ·
          Ju Jupiter · Ve Venus · Sa Saturn · Ra Rahu · Ke Ketu · R retrograde. D1 and D9 appear on page 1.
        </div>
      </section>

      {/* ── Page 4 · Vimshottari dasha ── */}
      <section className="kr-page kr-gap">
        <Running who={who} label="Vimshottari dasha" />

        <div>
          <h3 className="kr-title">Vimshottari dasha</h3>
          <div className="kr-dasha">
            {dashas.map(md => {
              const mdNow = isCurrent(md)
              return (
                <div key={md.from} className={`kr-md${mdNow ? ' now' : ''}`}>
                  <div className="kr-md-head">
                    <strong>{grahaName(md.lord)} Mahadasha</strong>
                    {mdNow && <span className="kr-badge">NOW</span>}
                    <div className="kr-md-dates">{fmtDate(md.from)} – {fmtDate(md.to)}</div>
                  </div>
                  {(md.children ?? []).map(ad => (
                    <div key={ad.from} className={`kr-ad${isCurrent(ad) ? ' now' : ''}`}>
                      {grahaName(md.lord).slice(0, 2)}–{grahaName(ad.lord)}
                      <span>{fmtDate(ad.from)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <p className="kr-note" style={{ marginTop: '1.5mm' }}>Each antardasha is listed with its start date; it runs until the next one begins.</p>
        </div>

        {currentMd && currentAd?.children?.length ? (
          <div className="kr-box">
            <h3 className="kr-title">
              Pratyantardasha · {grahaName(currentMd.lord)} – {grahaName(currentAd.lord)}
              <span className="kr-badge">CURRENT</span>
            </h3>
            <div className="kr-pd">
              {currentAd.children.map(pd => (
                <div key={pd.from} className={isCurrent(pd) ? 'now' : ''}>
                  {grahaName(pd.lord)}
                  <span>{fmtDate(pd.from)} – {fmtDate(pd.to)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="kr-note">
          Calculated by the Akashvani engine {data.engineVersion}: True Chitra Paksha ayanamsa, whole-sign
          houses, mean nodes, 365.2425-day dasha years. Generated by {ASTROKARMAZ.name} on {generated}.
        </p>
      </section>
    </div>
  )
}
