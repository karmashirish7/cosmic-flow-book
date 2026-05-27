import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Send, RotateCcw } from 'lucide-react'
import NorthIndianKundali from '@/components/NorthIndianKundali'
import { searchCities, type City } from '@/lib/cities'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0C0C14' }}>
          <div className="max-w-lg text-center">
            <p className="text-red-400 font-bold mb-2">Chart rendering error</p>
            <pre className="text-red-300/70 text-xs text-left bg-white/5 p-4 rounded-xl overflow-auto">{this.state.error}</pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlanetPosition {
  longitude: number
  sign: string
  signNumber: number
  degrees: number
  minutes: number
  seconds: number
  dms: string
  formatted: string
  speed: number
  nakshatra: string
}

interface DashaPeriod {
  planet: string
  startDate: string
  endDate: string
  durationYears: number
}

interface CurrentDasha {
  mahadasha: DashaPeriod
  antardasha: DashaPeriod
  pratyantardasha: DashaPeriod
}

interface ChartData {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  timezone: string
  lagnaSign: number
  lagna: PlanetPosition
  planets: Record<string, PlanetPosition>
  houseNumbers: Record<string, number>
  ayanamsa: number
  dignity: Record<string, string>
  atmakaraka: string
  darakaraka: string
  currentDasha: CurrentDasha | null
  summary: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGN_NAMES = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
]

const PLANET_COLORS: Record<string, string> = {
  Sun: '#F59E0B', Moon: '#E2E8F0', Mars: '#EF4444',
  Mercury: '#10B981', Jupiter: '#F97316', Venus: '#EC4899',
  Saturn: '#6366F1', Rahu: '#8B5CF6', Ketu: '#78716C',
}

const DIGNITY_COLORS: Record<string, string> = {
  exalted:     '#10B981',
  own:         '#A78BFA',
  moolatrikona:'#60A5FA',
  neutral:     '#94A3B8',
  debilitated: '#EF4444',
}

const SUGGESTED_QUESTIONS = [
  'What does my lagna sign reveal about my personality?',
  'How does my current dasha period affect me?',
  'What are the key themes of my 7th house (relationships)?',
  'Which houses and planets indicate career and success?',
  'What does my Moon nakshatra say about my mind?',
  'Where is my Atmakaraka and what does it mean?',
]

const ALL_PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DignityBadge({ d }: { d: string }) {
  const color = DIGNITY_COLORS[d] ?? '#94A3B8'
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
      style={{ color, background: `${color}22` }}
    >
      {d}
    </span>
  )
}

// ─── Birth Form ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  birthDate: string
  birthTime: string
  city: City | null
  cityQuery: string
}

function BirthForm({ onSubmit, loading }: { onSubmit: (f: FormState) => void; loading: boolean }) {
  const [form, setForm] = useState<FormState>({ name: '', birthDate: '', birthTime: '', city: null, cityQuery: '' })
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [showSug, setShowSug] = useState(false)
  const cityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (form.cityQuery.length < 2) { setSuggestions([]); return }
    setSuggestions(searchCities(form.cityQuery))
    setShowSug(true)
  }, [form.cityQuery])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowSug(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.birthDate || !form.birthTime || !form.city) return
    onSubmit(form)
  }

  const cityDisplayValue = form.city
    ? `${form.city.name}${form.city.state ? ', ' + form.city.state : ''}, ${form.city.country}`
    : form.cityQuery

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/60 transition-all"

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: 'linear-gradient(135deg, #0C0C14 0%, #12121C 50%, #0C0C14 100%)' }}
    >
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs text-purple-300 font-semibold tracking-wider uppercase">Vedic AI Predictor</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Birth Chart Analysis</h1>
          <p className="text-white/40 text-sm">Enter your birth details to generate your Jyotish chart</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 ml-1">Full Name</label>
            <input
              className={inputCls}
              placeholder="e.g. Arjun Sharma"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 ml-1">Date of Birth</label>
              <input
                type="date"
                className={inputCls}
                value={form.birthDate}
                onChange={e => setField('birthDate', e.target.value)}
                required
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 ml-1">Time of Birth</label>
              <input
                type="time"
                className={inputCls}
                value={form.birthTime}
                onChange={e => setField('birthTime', e.target.value)}
                required
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div ref={cityRef} className="relative">
            <label className="block text-xs text-white/50 font-medium mb-1.5 ml-1">Birth Place</label>
            <input
              className={inputCls}
              placeholder="Search city…"
              value={cityDisplayValue}
              onChange={e => {
                setField('cityQuery', e.target.value)
                setField('city', null)
              }}
              onFocus={() => { if (suggestions.length) setShowSug(true) }}
              required
            />
            {showSug && suggestions.length > 0 && (
              <div
                className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl border border-white/10"
                style={{ background: '#16162A' }}
              >
                {suggestions.map(c => (
                  <button
                    key={`${c.name}-${c.country}`}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    onClick={() => {
                      setField('city', c)
                      setField('cityQuery', c.name)
                      setShowSug(false)
                    }}
                  >
                    <span className="text-white font-medium">{c.name}</span>
                    {c.state && <span className="text-white/40 ml-1">{c.state},</span>}
                    <span className="text-white/40 ml-1">{c.country}</span>
                    <span className="text-purple-400/60 ml-2 text-xs">{c.tz}</span>
                  </button>
                ))}
              </div>
            )}
            {form.city && (
              <p className="text-xs text-white/30 mt-1 ml-1">
                {form.city.lat.toFixed(4)}° / {form.city.lon.toFixed(4)}° · UTC {form.city.tz}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !form.name || !form.birthDate || !form.birthTime || !form.city}
            className="w-full btn-primary-glow rounded-xl py-3.5 text-sm font-semibold mt-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Calculating Chart…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate My Chart
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Dasha Panel ─────────────────────────────────────────────────────────────

function DashaPanel({ dasha }: { dasha: CurrentDasha }) {
  const rows = [
    { label: 'Mahadasha',       data: dasha.mahadasha },
    { label: 'Antardasha',      data: dasha.antardasha },
    { label: 'Pratyantardasha', data: dasha.pratyantardasha },
  ]
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: '#12121C' }}>
      <div className="px-4 py-3 border-b border-white/10">
        <span className="text-xs font-bold uppercase tracking-wider text-white/40">Vimshottari Dasha · Current Period</span>
      </div>
      <div className="p-4 space-y-3">
        {rows.map(({ label, data }) => (
          <div key={label} className="flex items-start justify-between gap-2">
            <span className="text-xs text-white/40 w-32 shrink-0 pt-0.5">{label}</span>
            <div className="text-right">
              <span className="text-sm font-bold" style={{ color: PLANET_COLORS[data?.planet] ?? '#fff' }}>
                {data?.planet ?? '—'}
              </span>
              {data?.startDate && (
                <p className="text-[11px] text-white/30 mt-0.5">
                  {formatDate(data.startDate)} – {formatDate(data.endDate)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Planet Table ─────────────────────────────────────────────────────────────

function PlanetTable({ chart }: { chart: ChartData }) {
  const lagna = chart.lagna
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: '#12121C' }}>
      <div className="px-4 py-3 border-b border-white/10">
        <span className="text-xs font-bold uppercase tracking-wider text-white/40">Planetary Positions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-3 py-2 text-white/30 font-medium">Planet</th>
              <th className="text-left px-3 py-2 text-white/30 font-medium">Sign</th>
              <th className="text-center px-2 py-2 text-white/30 font-medium">H</th>
              <th className="text-left px-3 py-2 text-white/30 font-medium">Nakshatra</th>
              <th className="text-left px-3 py-2 text-white/30 font-medium">DMS</th>
              <th className="text-center px-2 py-2 text-white/30 font-medium">R</th>
            </tr>
          </thead>
          <tbody>
            {lagna && (
              <tr className="border-b border-white/5 bg-purple-500/5">
                <td className="px-3 py-2 font-bold text-purple-300">Lagna</td>
                <td className="px-3 py-2 text-white/70">{lagna.sign}</td>
                <td className="px-2 py-2 text-center text-purple-400 font-bold">—</td>
                <td className="px-3 py-2 text-white/50">{lagna.nakshatra}</td>
                <td className="px-3 py-2 font-mono text-white/60">{lagna.dms}</td>
                <td className="px-2 py-2 text-center text-white/20">—</td>
              </tr>
            )}
            {ALL_PLANETS.map(p => {
              const pos   = chart.planets?.[p]
              const house = chart.houseNumbers?.[p]
              const dig   = chart.dignity?.[p]
              if (!pos) return null
              const retro = (pos.speed ?? 0) < 0
              return (
                <tr key={p} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-3 py-2 font-bold" style={{ color: PLANET_COLORS[p] ?? '#fff' }}>
                    {p}
                    {p === chart.atmakaraka && <span className="ml-1 text-[9px] text-yellow-400 font-bold">AK</span>}
                    {p === chart.darakaraka  && <span className="ml-1 text-[9px] text-blue-400 font-bold">DK</span>}
                  </td>
                  <td className="px-3 py-2 text-white/70">
                    {pos.sign}
                    {dig && <span className="ml-1.5"><DignityBadge d={dig} /></span>}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-purple-300 font-bold">{house ?? '?'}</td>
                  <td className="px-3 py-2 text-white/50">{pos.nakshatra}</td>
                  <td className="px-3 py-2 font-mono text-white/60">{pos.dms}</td>
                  <td className="px-2 py-2 text-center text-[10px]">
                    {retro ? <span className="text-orange-400 font-bold">R</span> : <span className="text-white/20">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Chat Interface ───────────────────────────────────────────────────────────

function ChatInterface({ chart }: { chart: ChartData }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (question: string) => {
    const q = question.trim()
    if (!q || loading) return
    setInput('')
    const nextMessages: Message[] = [...messages, { role: 'user', content: q }]
    setMessages(nextMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          chartSummary: chart.summary,
          name: chart.name,
          history: messages,
        }),
      })
      const data = await res.json()
      const answer = data.answer ?? data.error ?? 'No response.'
      setMessages(h => [...h, { role: 'assistant', content: answer }])
    } catch {
      setMessages(h => [...h, { role: 'assistant', content: 'Connection error. Is the AI server running on port 3000?' }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, chart.summary, chart.name])

  const lagnaName = SIGN_NAMES[(chart.lagnaSign ?? 1) - 1] ?? ''

  return (
    <div
      className="flex flex-col h-full rounded-xl border border-white/10 overflow-hidden"
      style={{ background: '#0C0C14' }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0" style={{ background: '#12121C' }}>
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-semibold text-white/80">Ask the Chart</span>
        <span className="ml-auto text-xs text-white/30 truncate">{chart.name} · {lagnaName} Lagna</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-white/30 text-center mb-4">Choose a question or type your own</p>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-purple-600/30 border border-purple-500/20 text-white/90'
                    : 'bg-white/5 border border-white/10 text-white/80'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span className="text-xs text-white/40">Reading the stars…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/10 shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex gap-2"
        >
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder="Ask anything about your chart…"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-4 text-white transition-colors flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Chart View ───────────────────────────────────────────────────────────────

function ChartView({ chart, onReset }: { chart: ChartData; onReset: () => void }) {
  const [visualLagna, setVisualLagna] = useState(1)
  const [tab, setTab] = useState<'planets' | 'dasha'>('planets')

  // Build planet → house map and degree/retrograde maps with null safety
  const planetHouses: Record<string, number>  = {}
  const planetDegrees: Record<string, number> = {}
  const planetRetro: Record<string, boolean>  = {}
  for (const [p, pos] of Object.entries(chart.planets ?? {})) {
    if (!pos) continue
    planetHouses[p]  = chart.houseNumbers?.[p] ?? 0
    planetDegrees[p] = pos.degrees ?? 0
    planetRetro[p]   = (pos.speed ?? 0) < 0
  }

  const lagnaName = SIGN_NAMES[(chart.lagnaSign ?? 1) - 1] ?? ''

  return (
    <div className="min-h-screen" style={{ background: '#0C0C14' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 border-b border-white/10"
        style={{ background: 'rgba(12,12,20,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-base font-bold text-white truncate">{chart.name}</h2>
            <p className="text-xs text-white/40 truncate">
              {chart.birthDate} · {chart.birthTime} · {chart.birthPlace || chart.timezone}
            </p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors shrink-0 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Chart
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* Left column */}
        <div className="lg:w-[45%] space-y-4">

          {/* Lagna / Ayanamsa badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-purple-500/15 border border-purple-500/25 rounded-full px-4 py-1.5">
              <span className="text-sm font-bold text-purple-300 font-serif">{lagnaName} Lagna</span>
            </div>
            <span className="text-xs text-white/30">Ayanamsa {(chart.ayanamsa ?? 0).toFixed(2)}°</span>
            {chart.atmakaraka && (
              <span className="text-xs text-yellow-400/70">
                AK: <strong className="text-yellow-400">{chart.atmakaraka}</strong>
              </span>
            )}
          </div>

          {/* North Indian diamond chart */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <NorthIndianKundali
              lagna={chart.lagnaSign ?? 1}
              planets={planetHouses}
              planetDegrees={planetDegrees}
              planetRetrograde={planetRetro}
              visualLagnaHouse={visualLagna}
              onVisualLagnaChange={setVisualLagna}
            />
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden border border-white/10" style={{ background: '#12121C' }}>
            {(['planets', 'dasha'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                  tab === t ? 'bg-purple-600/30 text-purple-300' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t === 'planets' ? 'Planetary Positions' : 'Vimshottari Dasha'}
              </button>
            ))}
          </div>

          {tab === 'planets' && <PlanetTable chart={chart} />}

          {tab === 'dasha' && chart.currentDasha && (
            <DashaPanel dasha={chart.currentDasha} />
          )}
          {tab === 'dasha' && !chart.currentDasha && (
            <div className="text-center text-white/30 text-sm py-6 rounded-xl border border-white/10" style={{ background: '#12121C' }}>
              Dasha data unavailable for this date range.
            </div>
          )}
        </div>

        {/* Right column: Chat (sticky on large screens) */}
        <div className="lg:w-[55%]" style={{ minHeight: '600px' }}>
          <div className="lg:sticky lg:top-[57px]" style={{ height: 'calc(100vh - 80px)' }}>
            <ChatInterface chart={chart} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AiPredictor() {
  const [step, setStep]     = useState<'form' | 'chart'>('form')
  const [chart, setChart]   = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleFormSubmit = async (form: FormState) => {
    if (!form.city) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       form.name,
          birthDate:  form.birthDate,
          birthTime:  form.birthTime,
          birthPlace: `${form.city.name}, ${form.city.country}`,
          birthLat:   String(form.city.lat),
          birthLon:   String(form.city.lon),
          timezone:   form.city.tz,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Chart calculation failed. Please try again.')
        return
      }
      setChart(data)
      setStep('chart')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Connection error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'chart' && chart) {
    return (
      <ErrorBoundary>
        <ChartView chart={chart} onReset={() => { setStep('form'); setChart(null) }} />
      </ErrorBoundary>
    )
  }

  return (
    <>
      <BirthForm onSubmit={handleFormSubmit} loading={loading} />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/40 rounded-xl px-5 py-3 text-sm text-red-300 max-w-lg text-center z-50 shadow-2xl backdrop-blur">
          {error}
        </div>
      )}
    </>
  )
}
