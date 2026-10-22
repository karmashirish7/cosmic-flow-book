import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, FileDown, Loader2, MapPin, RotateCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import KundaliChart from '@/components/KundaliChart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchCities, type City } from '@/lib/cities'
import { downloadSvgAsPng, slugify } from '@/lib/download'
import { panchangAt } from '@/lib/panchang'
import { ASTROKARMAZ } from '@/brand'

// ─── API shapes (Akashvani Partner API, trimmed by /api/kundli) ───────────────

type Graha = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu'

interface GrahaPosition {
  graha: Graha
  longitude: number
  rashi: number
  degreeInRashi: number
  nakshatra: number
  pada: number
  retrograde: boolean
  combust: boolean
  dignity: string
  house: number
}

interface VargaChart {
  varga: string
  lagnaRashi: number | null
  positions: { graha: Graha; rashi: number; vargottama?: boolean }[]
}

interface DashaPeriod {
  lord: string
  from: string
  to: string
  level: number
  children?: DashaPeriod[]
}

interface KundliResponse {
  engineVersion: string
  chart: {
    ayanamsa: number
    utcInstant: string
    tzId: string
    lagna: { longitude: number; rashi: number; degreeInRashi: number } | null
    positions: GrahaPosition[]
    vargas: VargaChart[]
  }
  currentDasha: DashaPeriod[]
  dashas: DashaPeriod[]
  /** The Vedic day of the birth (sunrise to sunrise); null if the API could not provide it */
  panchang: {
    date: { ad: string; bs: string | null }
    vaar: { number: number; name: string; nameNe: string }
    sunrise: string
    sunset: string
  } | null
}

interface BirthDetails {
  name: string
  calendar: 'AD' | 'BS'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  place: string
  lat: number
  lon: number
}

// ─── Reference data ───────────────────────────────────────────────────────────

const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

const GRAHA_NAMES: Record<Graha, string> = {
  sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter',
  venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu',
}

const VARGAS: { key: string; name: string; signifies: string }[] = [
  { key: 'D1',  name: 'Rashi',          signifies: 'Body, overall life' },
  { key: 'D2',  name: 'Hora',           signifies: 'Wealth' },
  { key: 'D3',  name: 'Drekkana',       signifies: 'Siblings, courage' },
  { key: 'D4',  name: 'Chaturthamsa',   signifies: 'Property, fortune' },
  { key: 'D7',  name: 'Saptamsa',       signifies: 'Children' },
  { key: 'D9',  name: 'Navamsa',        signifies: 'Spouse, dharma' },
  { key: 'D10', name: 'Dasamsa',        signifies: 'Career' },
  { key: 'D12', name: 'Dwadasamsa',     signifies: 'Parents' },
  { key: 'D16', name: 'Shodasamsa',     signifies: 'Vehicles, comforts' },
  { key: 'D20', name: 'Vimsamsa',       signifies: 'Spiritual practice' },
  { key: 'D24', name: 'Chaturvimsamsa', signifies: 'Education' },
  { key: 'D27', name: 'Bhamsa',         signifies: 'Strength, stamina' },
  { key: 'D30', name: 'Trimsamsa',      signifies: 'Misfortunes' },
  { key: 'D40', name: 'Khavedamsa',     signifies: 'Maternal legacy' },
  { key: 'D45', name: 'Akshavedamsa',   signifies: 'Paternal legacy' },
  { key: 'D60', name: 'Shashtiamsa',    signifies: 'Past karma' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cityLabel = (c: City) => [c.name, c.state, c.country].filter(Boolean).join(', ')
const grahaName = (g: string) => GRAHA_NAMES[g as Graha] ?? g
const pad2 = (n: number) => String(n).padStart(2, '0')

/** 9.6192 → 9°37'09" */
function dms(deg: number): string {
  const totalSec = Math.round(deg * 3600)
  const d = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  return `${d}°${pad2(m)}'${pad2(totalSec % 60)}"`
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtBirthDate = (d: BirthDetails) =>
  d.calendar === 'BS'
    ? `${d.day} ${BS_MONTHS[d.month - 1]} ${d.year} BS`
    : new Date(Date.UTC(d.year, d.month - 1, d.day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

const isCurrent = (p: { from: string; to: string }) => {
  const now = Date.now()
  return Date.parse(p.from) <= now && now < Date.parse(p.to)
}

const yearsBetween = (from: string, to: string) =>
  ((Date.parse(to) - Date.parse(from)) / (365.2425 * 86400000)).toFixed(1)

const todayIso = () => new Date().toISOString().slice(0, 10)

/** House of a rashi counted from the lagna rashi (whole-sign). */
const houseOf = (rashi: number, lagnaRashi: number) => ((rashi - lagnaRashi + 12) % 12) + 1

// ─── Birth form ───────────────────────────────────────────────────────────────

/** Chart card header: the D1 title box and the varga dropdown look identical. */
const chartLabelClass = 'mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground'
const chartHeaderClass = 'mb-3 flex h-11 w-full items-center rounded-lg border border-border/50 bg-input/50 px-3 font-serif text-sm sm:text-base font-semibold text-gold'
const vargaLabel = (v: { key: string; name: string; signifies: string }) => `${v.key} · ${v.name} (${v.signifies})`

const inputClass = 'bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30'
const selectClass = `flex h-10 w-full rounded-md border px-3 py-2 text-sm ${inputClass}`

function BirthForm({ loading, error, onSubmit }: {
  loading: boolean
  error: string | null
  onSubmit: (d: BirthDetails) => void
}) {
  const [name, setName] = useState('')
  const [calendar, setCalendar] = useState<'AD' | 'BS'>('AD')
  const [adDate, setAdDate] = useState('')
  const [bsYear, setBsYear] = useState('')
  const [bsMonth, setBsMonth] = useState('')
  const [bsDay, setBsDay] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState<City | null>(null)
  const [showSug, setShowSug] = useState(false)
  const [manual, setManual] = useState(false)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => (query.length >= 2 && !city ? searchCities(query) : []), [query, city])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowSug(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pickCity = (c: City) => {
    setCity(c)
    setQuery(cityLabel(c))
    setShowSug(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const [y, m, d] = calendar === 'AD'
      ? adDate.split('-').map(Number)
      : [Number(bsYear), Number(bsMonth), Number(bsDay)]
    const [hour, minute] = birthTime.split(':').map(Number)
    const latN = manual ? Number(lat) : city?.lat
    const lonN = manual ? Number(lon) : city?.lon

    const missing = [
      !(y && m && d) && 'date of birth',
      !birthTime && 'time of birth',
      !manual && !city && 'place of birth',
      manual && (lat === '' || lon === '' || !Number.isFinite(latN) || !Number.isFinite(lonN)) && 'latitude and longitude',
    ].filter(Boolean)
    if (missing.length) { setFormError(`Please fill in: ${missing.join(', ')}.`); return }
    setFormError(null)

    onSubmit({
      name: name.trim(),
      calendar, year: y, month: m, day: d, hour, minute,
      place: manual ? `${lat}, ${lon}` : cityLabel(city!),
      lat: latN!,
      lon: lonN!,
    })
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-2xl p-4 sm:p-6 md:p-10 space-y-5 max-w-2xl mx-auto">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="text-muted-foreground text-xs mb-1.5 block">Name (optional)</Label>
          <Input className={inputClass} placeholder="e.g. Sita Sharma" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <Label className="text-muted-foreground text-xs mb-1.5 block">Date of Birth *</Label>
          <div className="mb-2 inline-flex rounded-lg border border-border p-0.5 text-xs">
            {(['AD', 'BS'] as const).map(c => (
              <button key={c} type="button" onClick={() => setCalendar(c)}
                className={`rounded-md px-3 py-1 font-semibold transition-colors ${calendar === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {c === 'AD' ? 'AD (English)' : 'BS (Nepali)'}
              </button>
            ))}
          </div>
          {calendar === 'AD' ? (
            <Input type="date" className={inputClass} value={adDate} min="1900-01-01" max={todayIso()} onChange={e => setAdDate(e.target.value)} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Input inputMode="numeric" className={inputClass} placeholder="Year" value={bsYear}
                onChange={e => setBsYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <select className={selectClass} value={bsMonth} onChange={e => setBsMonth(e.target.value)}>
                <option value="">Month</option>
                {BS_MONTHS.map((mo, i) => <option key={mo} value={i + 1}>{mo}</option>)}
              </select>
              <select className={selectClass} value={bsDay} onChange={e => setBsDay(e.target.value)}>
                <option value="">Day</option>
                {Array.from({ length: 32 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <Label className="text-muted-foreground text-xs mb-1.5 block">Time of Birth *</Label>
          <Input type="time" className={inputClass} value={birthTime} onChange={e => setBirthTime(e.target.value)} />
        </div>

        {!manual ? (
          <div ref={cityRef} className="relative">
            <Label className="text-muted-foreground text-xs mb-1.5 block">Place of Birth *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className={`${inputClass} pl-9`}
                placeholder="Start typing a city…"
                value={query}
                onChange={e => { setQuery(e.target.value); setCity(null); setShowSug(true) }}
                onFocus={() => setShowSug(true)}
              />
            </div>
            {showSug && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {suggestions.map(c => (
                  <li key={`${c.name}-${c.country}-${c.lat}`}>
                    <button type="button" onClick={() => pickCity(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                      {cityLabel(c)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showSug && query.length >= 2 && !city && suggestions.length === 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                City not listed?{' '}
                <button type="button" className="text-gold underline underline-offset-2" onClick={() => setManual(true)}>
                  Enter coordinates instead
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Latitude * (N +)</Label>
              <Input inputMode="decimal" className={inputClass} placeholder="27.7172" value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Longitude * (E +)</Label>
              <Input inputMode="decimal" className={inputClass} placeholder="85.3240" value={lon} onChange={e => setLon(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>The timezone is worked out from the place, including Nepal's pre-1986 offset.</span>
        <button type="button" className="text-gold underline underline-offset-2"
          onClick={() => { setManual(m => !m); setCity(null); setQuery('') }}>
          {manual ? 'Search by city instead' : 'Enter coordinates manually'}
        </button>
      </div>

      {(formError || error) && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError ?? error}
        </p>
      )}

      <button type="submit" disabled={loading}
        className="btn-primary-glow w-full rounded-xl py-3 text-sm tracking-wide disabled:opacity-60 inline-flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Calculating…' : 'Generate Kundli'}
      </button>
    </form>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────

const NowBadge = () => (
  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Now</span>
)

/** One period row: lord, dates (under the lord on phones), Now badge, chevron. */
function PeriodRow({ label, period, expanded, expandable, onToggle, className }: {
  label: string
  period: DashaPeriod
  expanded: boolean
  expandable: boolean
  onToggle: () => void
  className: string
}) {
  const current = isCurrent(period)
  return (
    <button type="button" onClick={onToggle} disabled={!expandable}
      className={`w-full flex items-center gap-2 sm:gap-3 text-left transition-colors ${current ? 'bg-secondary' : expandable ? 'hover:bg-muted' : ''} ${className}`}>
      <span className="flex-1 min-w-0 sm:flex sm:items-center sm:gap-3">
        <span className="block font-semibold sm:w-36 sm:shrink-0 truncate">{label}</span>
        <span className="block text-xs sm:text-[inherit] text-muted-foreground">
          {fmtDate(period.from)} – {fmtDate(period.to)}
        </span>
      </span>
      {period.level === 1 && (
        <span className="hidden sm:inline text-xs text-muted-foreground">{yearsBetween(period.from, period.to)} yrs</span>
      )}
      {current && <NowBadge />}
      {expandable && (
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform print:hidden ${expanded ? 'rotate-180' : ''}`} />
      )}
    </button>
  )
}

/** Mahadasha → antardasha → pratyantardasha. Opens on the periods running now. */
function DashaTable({ dashas }: { dashas: DashaPeriod[] }) {
  const [openMd, setOpenMd] = useState<string | null>(() => dashas.find(isCurrent)?.from ?? null)
  const [openAd, setOpenAd] = useState<string | null>(
    () => dashas.find(isCurrent)?.children?.find(isCurrent)?.from ?? null,
  )

  return (
    <div className="divide-y divide-border/60 rounded-2xl border border-border/60 overflow-hidden">
      {dashas.map(md => {
        const mdOpen = openMd === md.from
        return (
          <div key={md.from}>
            <PeriodRow label={grahaName(md.lord)} period={md} expanded={mdOpen} expandable={!!md.children?.length}
              onToggle={() => setOpenMd(mdOpen ? null : md.from)} className="px-4 py-3 text-sm" />

            {/* Printing lists every antardasha; pratyantardashas print only where opened. */}
            <div className={`${mdOpen ? 'block' : 'hidden'} print:block bg-muted/30 border-t border-border/40 pl-3 sm:pl-6`}>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Antardasha in {grahaName(md.lord)}
              </p>
              {(md.children ?? []).map(ad => {
                const adOpen = openAd === ad.from
                return (
                  <div key={ad.from} className="break-inside-avoid">
                    <PeriodRow label={`${grahaName(md.lord)} – ${grahaName(ad.lord)}`} period={ad}
                      expanded={adOpen} expandable={!!ad.children?.length}
                      onToggle={() => setOpenAd(adOpen ? null : ad.from)} className="px-3 py-2 text-xs sm:text-sm rounded-md" />

                    {adOpen && (
                      <div className="ml-3 sm:ml-6 mb-2 border-l-2 border-primary/30 pl-2">
                        <p className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          Pratyantardasha
                        </p>
                        <div className="max-w-xl">
                          {(ad.children ?? []).map(pd => (
                            <div key={pd.from}
                              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs ${isCurrent(pd) ? 'bg-primary/10 font-semibold text-primary' : ''}`}>
                              <span>{grahaName(pd.lord)}</span>
                              <span className="text-muted-foreground text-right">
                                {fmtDate(pd.from)} – {fmtDate(pd.to)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SummaryGrid({ items, className = '' }: { items: [string, string][]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-x-4 gap-y-3 text-sm ${className}`}>
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
          <dd className="font-semibold mt-0.5">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Results({ details, data, onReset }: { details: BirthDetails; data: KundliResponse; onReset: () => void }) {
  const [varga, setVarga] = useState('D9')
  const rashiRef = useRef<SVGSVGElement>(null)
  const vargaRef = useRef<SVGSVGElement>(null)
  const { chart, dashas, currentDasha } = data
  const lagnaRashi = chart.lagna?.rashi ?? 1

  const d1 = useMemo(() => ({
    houses: Object.fromEntries(chart.positions.map(p => [grahaName(p.graha), p.house])),
    degrees: Object.fromEntries(chart.positions.map(p => [grahaName(p.graha), Math.floor(p.degreeInRashi)])),
    retrograde: Object.fromEntries(chart.positions.map(p => [grahaName(p.graha), p.retrograde])),
  }), [chart])

  /** Each varga as the chart component needs it: lagna rashi + planet → house. */
  const vargaCharts = useMemo(() => Object.fromEntries(chart.vargas.map(v => {
    const lagna = v.lagnaRashi ?? lagnaRashi
    return [v.varga, {
      lagna,
      houses: Object.fromEntries(v.positions.map(p => [grahaName(p.graha), houseOf(p.rashi, lagna)])),
      positions: v.positions,
    }]
  })), [chart, lagnaRashi])

  const who = details.name || 'Birth Chart'
  const fileBase = slugify(details.name || `kundli-${details.year}-${details.month}-${details.day}`)
  const selected = VARGAS.find(v => v.key === varga)!
  const moon = chart.positions.find(p => p.graha === 'moon')
  const sun = chart.positions.find(p => p.graha === 'sun')
  const birthPanchang = sun && moon ? panchangAt(sun.longitude, moon.longitude) : null
  const localTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { timeZone: chart.tzId, hour: '2-digit', minute: '2-digit' })
  const d9 = vargaCharts.D9
  const dashaNow = currentDasha.slice(0, 3).map(p => grahaName(p.lord)).join(' – ')  // MD – AD – PD

  const savePng = (svg: SVGSVGElement | null, key: string, title: string) => {
    if (svg) downloadSvgAsPng(svg, `${fileBase}-${key.toLowerCase()}.png`, title).catch(e => alert((e as Error).message))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between border-b border-border pb-3">
        <img src={ASTROKARMAZ.logoPng} alt={ASTROKARMAZ.name} className="h-14 w-auto" />
        <p className="text-xs text-muted-foreground">Generated {fmtDate(new Date().toISOString())}</p>
      </div>

      {/* Summary */}
      <section className="glass rounded-2xl p-4 sm:p-6 break-inside-avoid">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gold break-words">{who}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {fmtBirthDate(details)} · {pad2(details.hour)}:{pad2(details.minute)} ({chart.tzId}) · {details.place}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto print:hidden">
            <button type="button" onClick={() => window.print()}
              className="btn-primary-glow inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 sm:px-4 py-2 text-sm">
              <FileDown className="h-4 w-4" /> Download PDF
            </button>
            <button type="button" onClick={onReset}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border px-3 sm:px-4 py-2 text-sm hover:bg-muted transition-colors">
              <RotateCcw className="h-4 w-4" /> New chart
            </button>
          </div>
        </div>
        <SummaryGrid className="mt-5 md:grid-cols-5" items={[
          ['Lagna', chart.lagna ? `${RASHIS[chart.lagna.rashi - 1]} ${dms(chart.lagna.degreeInRashi)}` : '—'],
          ['Rashi (Moon sign)', moon ? RASHIS[moon.rashi - 1] : '—'],
          ['Sun sign', sun ? RASHIS[sun.rashi - 1] : '—'],
          ['Nakshatra', moon ? `${NAKSHATRAS[moon.nakshatra - 1]} (pada ${moon.pada})` : '—'],
          ['Current dasha', dashaNow || '—'],
        ]} />

        {birthPanchang && (
          <div className="mt-5 border-t border-border/50 pt-4">
            <h3 className="font-serif text-sm font-semibold text-gold mb-3">Panchang at birth</h3>
            <SummaryGrid className="md:grid-cols-4" items={[
              ['Vaar', data.panchang ? `${data.panchang.vaar.name} (${data.panchang.vaar.nameNe})` : '—'],
              ['Tithi', birthPanchang.tithi.name],
              ['Nakshatra', NAKSHATRAS[birthPanchang.nakshatra - 1]],
              ['Yoga', birthPanchang.yoga.name],
              ['Karana', birthPanchang.karana],
              ['Paksha', `${birthPanchang.tithi.paksha} paksha`],
              ['Sunrise', data.panchang ? localTime(data.panchang.sunrise) : '—'],
              ['Sunset', data.panchang ? localTime(data.panchang.sunset) : '—'],
            ]} />
          </div>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Ayanamsa {chart.ayanamsa.toFixed(4)}° (True Chitra Paksha) · whole-sign houses · mean nodes · Akashvani engine {data.engineVersion}
        </p>
      </section>

      {/* D1 + selected varga */}
      <section className="grid md:grid-cols-2 gap-4 sm:gap-6 print:hidden">
        {/* Both cards share one layout: label, a header box of equal height, chart, download. */}
        <div className="glass rounded-2xl p-3 sm:p-4">
          <span className={chartLabelClass}>Birth chart</span>
          <div className={chartHeaderClass}>
            <span className="truncate">D1 · Rashi (Lagna chart)</span>
          </div>
          <KundaliChart ref={rashiRef} title="D1 · Rashi" showTitle={false} lagnaSign={lagnaRashi}
            houses={d1.houses} degrees={d1.degrees} retrograde={d1.retrograde} />
          <button type="button" onClick={() => savePng(rashiRef.current, 'D1', 'D1 · Rashi (Lagna chart)')}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
            <Download className="h-3.5 w-3.5" /> Download PNG
          </button>
        </div>
        <div className="glass rounded-2xl p-3 sm:p-4">
          <label htmlFor="varga-select" className={chartLabelClass}>Divisional chart</label>
          <div className="relative">
            <select id="varga-select" value={varga} onChange={e => setVarga(e.target.value)}
              className={`${chartHeaderClass} appearance-none cursor-pointer pr-9 focus:outline-none focus:border-primary`}>
              {VARGAS.filter(v => v.key !== 'D1' && vargaCharts[v.key]).map(v => (
                <option key={v.key} value={v.key}>{vargaLabel(v)}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
          </div>
          <KundaliChart ref={vargaRef} title={`${selected.key} · ${selected.name}`} showTitle={false}
            lagnaSign={vargaCharts[varga].lagna} houses={vargaCharts[varga].houses} />
          <button type="button" onClick={() => savePng(vargaRef.current, varga, vargaLabel(selected))}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
            <Download className="h-3.5 w-3.5" /> Download PNG
          </button>
        </div>
      </section>

      {/* Planet positions */}
      <section className="break-inside-avoid">
        <h3 className="font-serif text-lg font-semibold text-gold mb-3">Planetary positions</h3>

        {/* Phones: one card per graha */}
        <div className="md:hidden print:hidden divide-y divide-border/60 rounded-2xl border border-border/60">
          {chart.lagna && (
            <div className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold">Lagna</span>
                <span>{RASHIS[chart.lagna.rashi - 1]} <span className="font-mono text-xs">{dms(chart.lagna.degreeInRashi)}</span></span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {NAKSHATRAS[Math.floor(chart.lagna.longitude / (360 / 27))]} · House 1{d9 ? ` · D9 ${RASHIS[d9.lagna - 1]}` : ''}
              </p>
            </div>
          )}
          {chart.positions.map(p => {
            const nav = d9?.positions.find(x => x.graha === p.graha)
            const flags = [p.retrograde && 'R', p.combust && 'combust'].filter(Boolean).join(', ')
            return (
              <div key={p.graha} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {grahaName(p.graha)}
                    {flags && <span className="ml-1 text-[10px] font-medium text-primary">({flags})</span>}
                  </span>
                  <span>{RASHIS[p.rashi - 1]} <span className="font-mono text-xs">{dms(p.degreeInRashi)}</span></span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {NAKSHATRAS[p.nakshatra - 1]} {p.pada} · House {p.house || '—'} · <span className="capitalize">{p.dignity.replace('_', ' ')}</span>
                  {nav && <> · D9 {RASHIS[nav.rashi - 1]}{nav.vargottama && <span className="text-primary"> (vargottama)</span>}</>}
                </p>
              </div>
            )
          })}
        </div>

        <div className="hidden md:block print:block overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-secondary-foreground">
              <tr>
                {['Planet', 'Sign', 'Degree', 'Nakshatra', 'House', 'Dignity', 'D9 sign'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {chart.lagna && (
                <tr>
                  <td className="px-4 py-2 font-semibold">Lagna</td>
                  <td className="px-4 py-2">{RASHIS[chart.lagna.rashi - 1]}</td>
                  <td className="px-4 py-2 font-mono text-xs">{dms(chart.lagna.degreeInRashi)}</td>
                  <td className="px-4 py-2">{NAKSHATRAS[Math.floor(chart.lagna.longitude / (360 / 27))]}</td>
                  <td className="px-4 py-2">1</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2">{d9 ? RASHIS[d9.lagna - 1] : '—'}</td>
                </tr>
              )}
              {chart.positions.map(p => {
                const nav = d9?.positions.find(x => x.graha === p.graha)
                const flags = [p.retrograde && 'R', p.combust && 'combust'].filter(Boolean).join(', ')
                return (
                  <tr key={p.graha}>
                    <td className="px-4 py-2 font-semibold whitespace-nowrap">
                      {grahaName(p.graha)}
                      {flags && <span className="ml-1 text-[10px] font-medium text-primary">({flags})</span>}
                    </td>
                    <td className="px-4 py-2">{RASHIS[p.rashi - 1]}</td>
                    <td className="px-4 py-2 font-mono text-xs">{dms(p.degreeInRashi)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{NAKSHATRAS[p.nakshatra - 1]} · {p.pada}</td>
                    <td className="px-4 py-2">{p.house || '—'}</td>
                    <td className="px-4 py-2 capitalize whitespace-nowrap">{p.dignity.replace('_', ' ')}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {nav ? RASHIS[nav.rashi - 1] : '—'}
                      {nav?.vargottama && <span className="ml-1 text-[10px] font-medium text-primary">vargottama</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dasha */}
      <section>
        <h3 className="font-serif text-lg font-semibold text-gold mb-3">Vimshottari Dasha</h3>
        <DashaTable dashas={dashas} />
      </section>

      {/* Print: every divisional chart */}
      <section className="hidden print:block" style={{ breakBefore: 'page' }}>
        <h3 className="font-serif text-lg font-semibold text-gold mb-3">Divisional charts</h3>
        <div className="grid grid-cols-3 gap-4">
          {VARGAS.filter(v => vargaCharts[v.key]).map(v => (
            <div key={v.key} className="break-inside-avoid">
              {v.key === 'D1' ? (
                <KundaliChart title="D1 · Rashi" lagnaSign={lagnaRashi} houses={d1.houses}
                  degrees={d1.degrees} retrograde={d1.retrograde} />
              ) : (
                <KundaliChart title={`${v.key} · ${v.name}`} lagnaSign={vargaCharts[v.key].lagna}
                  houses={vargaCharts[v.key].houses} />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Kundli() {
  const [details, setDetails] = useState<BirthDetails | null>(null)
  const [data, setData] = useState<KundliResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.add('theme-astrokarmaz')
    document.title = 'Free Kundli · Astrokarmaz'
    return () => document.documentElement.classList.remove('theme-astrokarmaz')
  }, [])

  const generate = async (d: BirthDetails) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kundli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendar: d.calendar, year: d.year, month: d.month, day: d.day,
          hour: d.hour, minute: d.minute, lat: d.lat, lon: d.lon, placeName: d.place,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`)
      setDetails(d)
      setData(body as KundliResponse)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError((e as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cosmic">
      <div className="print:hidden">
        <Navbar />
        <div className="h-24 md:h-32" />
      </div>

      <main className="px-4 pb-16 print:p-0">
        <div className="max-w-5xl mx-auto mb-6 print:hidden">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to consultations
          </Link>
        </div>

        {data && details ? (
          <Results details={details} data={data} onReset={() => { setData(null); setDetails(null) }} />
        ) : (
          <>
            <div className="text-center mb-8 max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3">
                Free <span className="gradient-gold-text">Kundli</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Enter your birth details to generate your Vedic birth chart, Vimshottari dasha and all
                16 divisional charts — downloadable as PDF or images.
              </p>
              <div className="constellation-line w-24 mx-auto mt-4" />
            </div>
            <BirthForm loading={loading} error={error} onSubmit={generate} />
          </>
        )}
      </main>
    </div>
  )
}
