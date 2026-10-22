import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, FileDown, Loader2, MapPin, RotateCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import KundaliChart from '@/components/KundaliChart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchCities, type City } from '@/lib/cities'
import { VARGAS, buildVargaChart, divisionOf } from '@/lib/vargas'
import { downloadSvgAsPng, slugify } from '@/lib/download'
import { ASTROKARMAZ } from '@/brand'

// ─── API shapes (from the Akashvani API via /api/kundli) ──────────────────────

interface Position {
  longitude: number
  sign: string
  signNumber: number
  degrees: number
  dms: string
  nakshatra: string
  nakshatraPada: number
}

interface Antardasha { lord: string; start: string; end: string }
interface Mahadasha extends Antardasha { years: number; antardashas: Antardasha[] }

interface KundliResponse {
  chart: {
    ayanamsa: number
    lagna: Position
    lagnaSign: number
    planets: Record<string, Position>
    houseNumbers: Record<string, number>
  }
  dashas: Mahadasha[]
}

interface BirthDetails {
  name: string
  birthDate: string
  birthTime: string
  place: string
  lat: number
  lon: number
  timezone: string
}

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Nepal moved from +05:30 to +05:45 on 1 Jan 1986; the city list stores today's offset. */
function suggestTimezone(city: City, birthDate: string): string {
  if (city.country === 'Nepal' && birthDate && birthDate < '1986-01-01') return '+05:30'
  return city.tz
}

const cityLabel = (c: City) => [c.name, c.state, c.country].filter(Boolean).join(', ')

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const today = () => new Date().toISOString().slice(0, 10)
const isCurrent = (p: { start: string; end: string }) => p.start <= today() && today() < p.end

// ─── Birth form ───────────────────────────────────────────────────────────────

const inputClass = 'bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30'

function BirthForm({ loading, error, onSubmit }: {
  loading: boolean
  error: string | null
  onSubmit: (d: BirthDetails) => void
}) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState<City | null>(null)
  const [showSug, setShowSug] = useState(false)
  const [manual, setManual] = useState(false)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [timezone, setTimezone] = useState('')
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

  // Re-suggest the offset when the date crosses a historical change (e.g. Nepal 1986).
  useEffect(() => {
    if (city && !manual) setTimezone(suggestTimezone(city, birthDate))
  }, [city, birthDate, manual])

  const pickCity = (c: City) => {
    setCity(c)
    setQuery(cityLabel(c))
    setLat(String(c.lat))
    setLon(String(c.lon))
    setShowSug(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const missing = [
      !birthDate && 'date of birth',
      !birthTime && 'time of birth',
      !manual && !city && 'place of birth',
      manual && (lat === '' || lon === '') && 'latitude and longitude',
      !/^[+-]\d{1,2}:\d{2}$/.test(timezone) && 'timezone (e.g. +05:45)',
    ].filter(Boolean)
    if (missing.length) { setFormError(`Please fill in: ${missing.join(', ')}.`); return }
    setFormError(null)
    onSubmit({
      name: name.trim(),
      birthDate,
      birthTime,
      place: manual ? `${lat}, ${lon}` : cityLabel(city!),
      lat: Number(lat),
      lon: Number(lon),
      timezone,
    })
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-2xl p-6 md:p-10 space-y-5 max-w-2xl mx-auto">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="text-muted-foreground text-xs mb-1.5 block">Name (optional)</Label>
          <Input className={inputClass} placeholder="e.g. Sita Sharma" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs mb-1.5 block">Date of Birth *</Label>
          <Input type="date" className={inputClass} value={birthDate} max={today()} onChange={e => setBirthDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs mb-1.5 block">Time of Birth *</Label>
          <Input type="time" className={inputClass} value={birthTime} onChange={e => setBirthTime(e.target.value)} />
        </div>

        {!manual ? (
          <div ref={cityRef} className="relative md:col-span-2">
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
          <>
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Latitude * (N +, S −)</Label>
              <Input inputMode="decimal" className={inputClass} placeholder="27.7172" value={lat} onChange={e => setLat(e.target.value)} />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Longitude * (E +, W −)</Label>
              <Input inputMode="decimal" className={inputClass} placeholder="85.3240" value={lon} onChange={e => setLon(e.target.value)} />
            </div>
          </>
        )}

        <div>
          <Label className="text-muted-foreground text-xs mb-1.5 block">Timezone (UTC offset) *</Label>
          <Input className={inputClass} placeholder="+05:45" value={timezone} onChange={e => setTimezone(e.target.value.trim())} />
        </div>
        <div className="flex items-end">
          <button type="button" className="text-xs text-gold underline underline-offset-2 pb-3"
            onClick={() => { setManual(m => !m); setCity(null); setQuery('') }}>
            {manual ? 'Search by city instead' : 'Enter coordinates manually'}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        The timezone is filled from the city. Adjust it if daylight saving or a historical offset applied at birth.
      </p>

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

function DashaTable({ dashas }: { dashas: Mahadasha[] }) {
  const [open, setOpen] = useState<string | null>(() => dashas.find(isCurrent)?.start ?? null)

  return (
    <div className="divide-y divide-border/60 rounded-2xl border border-border/60 overflow-hidden">
      {dashas.map(md => {
        const current = isCurrent(md)
        const expanded = open === md.start
        return (
          <div key={md.start} className="break-inside-avoid">
            <button type="button" onClick={() => setOpen(expanded ? null : md.start)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${current ? 'bg-secondary' : 'hover:bg-muted'}`}>
              <span className="font-semibold w-20">{md.lord}</span>
              <span className="text-muted-foreground flex-1">{fmtDate(md.start)} – {fmtDate(md.end)}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{md.years} yrs</span>
              {current && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Now</span>}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform print:hidden ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {/* Printing expands every period. */}
            <div className={`${expanded ? 'grid' : 'hidden'} print:grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 px-4 pb-3 pt-1 bg-muted/40`}>
              {md.antardashas.map(ad => (
                <div key={ad.start}
                  className={`flex justify-between gap-2 rounded-md px-2 py-1 text-xs ${isCurrent(ad) ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground/80'}`}>
                  <span>{md.lord}–{ad.lord}</span>
                  <span className="text-muted-foreground">{fmtDate(ad.start)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Results({ details, data, onReset }: { details: BirthDetails; data: KundliResponse; onReset: () => void }) {
  const [varga, setVarga] = useState('D9')
  const rashiRef = useRef<SVGSVGElement>(null)
  const vargaRef = useRef<SVGSVGElement>(null)
  const { chart, dashas } = data

  const longitudes = useMemo(
    () => Object.fromEntries(PLANET_ORDER.filter(p => chart.planets[p]).map(p => [p, chart.planets[p].longitude])),
    [chart],
  )
  const charts = useMemo(
    () => Object.fromEntries(VARGAS.map(v => [v.key, buildVargaChart(divisionOf(v.key), chart.lagna.longitude, longitudes)])),
    [chart, longitudes],
  )
  const degrees = useMemo(
    () => Object.fromEntries(PLANET_ORDER.filter(p => chart.planets[p]).map(p => [p, chart.planets[p].degrees])),
    [chart],
  )

  const who = details.name || 'Birth Chart'
  const fileBase = slugify(details.name || `kundli-${details.birthDate}`)
  const selected = VARGAS.find(v => v.key === varga)!
  const moon = chart.planets.Moon
  const currentMd = dashas.find(isCurrent)
  const currentAd = currentMd?.antardashas.find(isCurrent)

  const savePng = (svg: SVGSVGElement | null, key: string) => {
    if (svg) downloadSvgAsPng(svg, `${fileBase}-${key.toLowerCase()}.png`).catch(e => alert((e as Error).message))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between border-b border-border pb-3">
        <img src={ASTROKARMAZ.logoPng} alt={ASTROKARMAZ.name} className="h-14 w-auto" />
        <p className="text-xs text-muted-foreground">Generated {fmtDate(today())}</p>
      </div>

      {/* Summary */}
      <section className="glass rounded-2xl p-6 break-inside-avoid">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-gold">{who}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {fmtDate(details.birthDate)} · {details.birthTime} (UTC{details.timezone}) · {details.place}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => window.print()}
              className="btn-primary-glow inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
              <FileDown className="h-4 w-4" /> Download PDF
            </button>
            <button type="button" onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
              <RotateCcw className="h-4 w-4" /> New chart
            </button>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            ['Lagna', `${chart.lagna.sign} ${chart.lagna.dms}`],
            ['Moon sign', moon?.sign ?? '—'],
            ['Nakshatra', moon ? `${moon.nakshatra} (pada ${moon.nakshatraPada})` : '—'],
            ['Current dasha', currentMd ? `${currentMd.lord}${currentAd ? ` – ${currentAd.lord}` : ''}` : '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="font-semibold mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[11px] text-muted-foreground">Lahiri ayanamsa {chart.ayanamsa.toFixed(4)}° · whole-sign houses</p>
      </section>

      {/* D1 + selected varga */}
      <section className="grid md:grid-cols-2 gap-6 print:hidden">
        <div className="glass rounded-2xl p-4">
          <KundaliChart ref={rashiRef} title="D1 · Rashi (Lagna)" lagnaSign={chart.lagnaSign}
            houses={chart.houseNumbers} degrees={degrees} />
          <button type="button" onClick={() => savePng(rashiRef.current, 'D1')}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
            <Download className="h-3.5 w-3.5" /> Download PNG
          </button>
        </div>
        <div className="glass rounded-2xl p-4">
          <KundaliChart ref={vargaRef} title={`${selected.key} · ${selected.name}`}
            lagnaSign={charts[varga].lagnaSign} houses={charts[varga].houses} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{selected.signifies}</span>
            <button type="button" onClick={() => savePng(vargaRef.current, varga)}
              className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
              <Download className="h-3.5 w-3.5" /> Download PNG
            </button>
          </div>
        </div>
      </section>

      <section className="print:hidden">
        <h3 className="font-serif text-lg font-semibold text-gold mb-3">Divisional charts</h3>
        <div className="flex flex-wrap gap-2">
          {VARGAS.filter(v => v.key !== 'D1').map(v => (
            <button key={v.key} type="button" onClick={() => setVarga(v.key)} title={v.signifies}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${v.key === varga
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/60'}`}>
              <strong>{v.key}</strong> {v.name}
            </button>
          ))}
        </div>
      </section>

      {/* Planet positions */}
      <section className="break-inside-avoid">
        <h3 className="font-serif text-lg font-semibold text-gold mb-3">Planetary positions</h3>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-secondary-foreground">
              <tr>
                {['Planet', 'Sign', 'Degree', 'Nakshatra', 'Pada', 'House', 'D9 sign'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[['Lagna', chart.lagna] as const, ...PLANET_ORDER.filter(p => chart.planets[p]).map(p => [p, chart.planets[p]] as const)]
                .map(([p, pos]) => (
                  <tr key={p}>
                    <td className="px-4 py-2 font-semibold">{p}</td>
                    <td className="px-4 py-2">{pos.sign}</td>
                    <td className="px-4 py-2 font-mono text-xs">{pos.dms}</td>
                    <td className="px-4 py-2">{pos.nakshatra}</td>
                    <td className="px-4 py-2">{pos.nakshatraPada}</td>
                    <td className="px-4 py-2">{p === 'Lagna' ? 1 : chart.houseNumbers[p]}</td>
                    <td className="px-4 py-2">
                      {SIGN_NAMES[(p === 'Lagna' ? charts.D9.lagnaSign : charts.D9.signs[p]) - 1]}
                    </td>
                  </tr>
                ))}
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
          {VARGAS.map(v => (
            <div key={v.key} className="break-inside-avoid">
              <KundaliChart title={`${v.key} · ${v.name}`} lagnaSign={charts[v.key].lagnaSign}
                houses={charts[v.key].houses} degrees={v.key === 'D1' ? degrees : undefined} />
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
        body: JSON.stringify({ birthDate: d.birthDate, birthTime: d.birthTime, timezone: d.timezone, lat: d.lat, lon: d.lon }),
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
