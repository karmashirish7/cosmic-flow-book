import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Globe2, LocateFixed, Maximize2, Minimize2, Pause, Play, Ruler, SkipForward, Sun, X,
} from 'lucide-react'
import {
  KATHMANDU, NAKSHATRAS, PLANETS, RASHIS, fmtDeg, nextEclipses, riseSet, snapshot,
  type NodeType, type Observer,
} from '@/lib/ephemeris'
import { panchangAt } from '@/lib/panchang'
import SkyScene, { type Selectable, type Sim, type ViewMode } from './SkyScene'
import heroBg from '@/assets/hero-bg.jpg'

const DAY = 86_400_000
const SLIDER_DAYS = 20 * 365   // ±20 years around today

const SPEEDS = [
  { label: 'Paused', v: 0 },
  { label: 'Live', v: 1 },
  { label: '1 hour / s', v: 3_600 },
  { label: '1 day / s', v: 86_400 },
  { label: '1 month / s', v: 2_629_800 },
  { label: '1 year / s', v: 31_557_600 },
]

const ORDER: Selectable[] = [...PLANETS.map(p => p.key), 'rahu', 'ketu']

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const fmtWhen = (d: Date) =>
  d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtTime = (d: Date | null) =>
  d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
const place = (p: { rashi: number; degree: number }) => `${RASHIS[p.rashi].sa} (${RASHIS[p.rashi].en}) ${fmtDeg(p.degree)}`

const btn = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-black/45'

export default function ExploreView() {
  const container = useRef<HTMLDivElement>(null)
  const reducedMotion = useMemo(prefersReducedMotion, [])
  const webgl = useMemo(hasWebGL, [])
  const nowAtMount = useMemo(() => Date.now(), [])
  // Narrow (portrait) screens need the camera further back to fit the zodiac ring
  const startCamera = useMemo<[number, number, number]>(
    () => (window.innerWidth < 640 ? [0, 78, 118] : [0, 34, 58]), [])

  const sim = useRef<Sim>({
    time: Date.now(), speed: 1, view: 'geo', blend: 1, nodeType: 'mean', trueScale: false, reducedMotion,
  })

  const [time, setTime] = useState(sim.current.time)
  const [speed, setSpeedState] = useState(1)
  const [view, setViewState] = useState<ViewMode>('geo')
  const [nodeType, setNodeTypeState] = useState<NodeType>('mean')
  const [trueScale, setTrueScaleState] = useState(false)
  const [selected, setSelected] = useState<Selectable | null>(null)
  const [observer, setObserver] = useState<Observer>(KATHMANDU)
  const [locating, setLocating] = useState(false)
  const [active, setActive] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  // Keep the shared sim ref and React state in step
  const setSpeed = (v: number) => { sim.current.speed = v; setSpeedState(v) }
  const setView = (v: ViewMode) => {
    sim.current.view = v
    setViewState(v)
    if (v === 'geo') { sim.current.trueScale = false; setTrueScaleState(false) }
  }
  const setNodeType = (v: NodeType) => { sim.current.nodeType = v; setNodeTypeState(v) }
  const setTrueScale = (v: boolean) => { sim.current.trueScale = v; setTrueScaleState(v) }
  const jumpTo = (ms: number) => { sim.current.time = ms; setTime(ms) }

  // Pull simulated time into React for the UI: 4×/s while playing fast, 1×/s live
  useEffect(() => {
    const id = setInterval(() => setTime(sim.current.time), speed > 1 ? 250 : 1000)
    return () => clearInterval(id)
  }, [speed])

  // Live mode recomputes the snapshot every 5 s; otherwise on every UI tick
  const snapTime = speed === 1 ? Math.floor(time / 5000) * 5000 : time
  const snap = useMemo(() => snapshot(new Date(snapTime), observer, nodeType), [snapTime, observer, nodeType])

  const season = snap.eclipseSeason
  const eclipseBucket = Math.floor(time / (10 * DAY))
  const eclipses = useMemo(
    () => (season.active ? nextEclipses(new Date(eclipseBucket * 10 * DAY)) : null),
    [season.active, eclipseBucket],
  )

  // Pause rendering when the tab is hidden or the view is scrolled off screen
  useEffect(() => {
    const el = container.current
    if (!el) return
    let onScreen = true
    const update = () => setActive(onScreen && !document.hidden)
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update() }, { threshold: 0.05 })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === container.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else container.current?.requestFullscreen?.()
  }

  const locate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      p => { setObserver({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'your location' }); setLocating(false) },
      () => setLocating(false),
      { maximumAge: 600_000, timeout: 10_000 },
    )
  }

  const nextObject = useCallback(() => {
    setSelected(s => ORDER[(s ? ORDER.indexOf(s) + 1 : 0) % ORDER.length])
  }, [])

  const date = new Date(time)
  const live = speed === 1 && Math.abs(time - Date.now()) < 60_000
  const sliderDays = Math.round((time - nowAtMount) / DAY)
  const sunS = snap.planets[0]
  const moonS = snap.planets[1]
  const tithi = panchangAt(sunS.sidereal, moonS.sidereal).tithi

  // Selected object details
  const selPlanet = selected && selected !== 'rahu' && selected !== 'ketu' ? snap.planets.find(p => p.key === selected)! : null
  const selNode = selected === 'rahu' || selected === 'ketu' ? snap.nodes[selected] : null
  const dayBucket = Math.floor(time / DAY)
  const rs = useMemo(() => {
    if (!selPlanet) return null
    const body = PLANETS.find(p => p.key === selPlanet.key)!.body
    return riseSet(body, new Date(dayBucket * DAY), observer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selPlanet?.key, dayBucket, observer])

  if (!webgl) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <img src={heroBg} alt="" className="h-[420px] w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-6 text-center text-sm text-white">
          Your browser does not support 3D graphics (WebGL), so the live sky cannot be shown here.
        </div>
      </div>
    )
  }

  return (
    <div ref={container}
      className={`relative w-full overflow-hidden bg-[#04050B] text-white ${fullscreen ? 'h-full' : 'h-[78vh] min-h-[560px] rounded-2xl'}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ position: startCamera, fov: 50, near: 0.05, far: 2000 }}
        gl={{ antialias: true }}
        onPointerMissed={() => setSelected(null)}
      >
        <SkyScene sim={sim} snap={snap} selected={selected} onSelect={setSelected} trueScale={trueScale} time={time} view={view} />
      </Canvas>

      {/* ── Top: view switch and toggles ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto inline-flex rounded-xl border border-white/15 bg-black/50 p-1 backdrop-blur">
          {([['geo', 'Geocentric · Vedic', Globe2], ['helio', 'Heliocentric', Sun]] as const).map(([v, label, Icon]) => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === v ? 'bg-[#8B1E1E] text-white' : 'text-white/70 hover:text-white'}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
          <button type="button" className={btn} onClick={() => setNodeType(nodeType === 'mean' ? 'true' : 'mean')}
            title="Rahu/Ketu: mean node (Vedic standard) or true (osculating) node">
            ☊ {nodeType === 'mean' ? 'Mean node' : 'True node'}
          </button>
          <button type="button" className={btn} disabled={view === 'geo'} onClick={() => setTrueScale(!trueScale)}
            title={view === 'geo' ? 'True scale is available in the heliocentric view' : 'Switch between compressed and true distances'}>
            <Ruler className="h-3.5 w-3.5" /> {trueScale ? 'True scale' : 'Compressed'}
          </button>
          <button type="button" className={btn} onClick={nextObject} title="Fly to the next object">
            <SkipForward className="h-3.5 w-3.5" /> Next
          </button>
          <button type="button" className={btn} onClick={locate} disabled={locating}
            title="Use your location for the lagna and rise/set times">
            <LocateFixed className="h-3.5 w-3.5" /> {locating ? 'Locating…' : observer === KATHMANDU ? 'Kathmandu' : 'My location'}
          </button>
          <button type="button" className={btn} onClick={toggleFullscreen} title="Fullscreen">
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Selected object ── */}
      {(selPlanet || selNode) && (
        <div className="absolute right-3 top-16 z-40 w-[min(18rem,calc(100%-1.5rem))] rounded-xl border border-white/15 bg-black/70 p-4 text-sm backdrop-blur">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-bold text-[#F2C14E]">
              {selPlanet ? selPlanet.name : selected === 'rahu' ? 'Rahu ☊' : 'Ketu ☋'}
            </h3>
            <button type="button" onClick={() => setSelected(null)} className="text-white/60 hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {(() => {
              const p = (selPlanet ?? selNode)!
              const rows: [string, string][] = [
                ['Rashi', place(p)],
                ['Nakshatra', `${NAKSHATRAS[p.nakshatra]}, pada ${p.pada}`],
                ['Motion', selNode ? 'Retrograde (always)' : selPlanet!.key === 'sun' || selPlanet!.key === 'moon' ? 'Direct' : selPlanet!.retrograde ? 'Retrograde ℞' : 'Direct'],
              ]
              if (selPlanet && selPlanet.key !== 'sun') {
                rows.push(['From Earth', selPlanet.key === 'moon'
                  ? `${Math.round(selPlanet.distAU * 149_597_870.7).toLocaleString()} km`
                  : `${selPlanet.distAU.toFixed(3)} AU`])
              }
              if (selPlanet) rows.push(['Rises', fmtTime(rs?.rise ?? null)], ['Sets', fmtTime(rs?.set ?? null)])
              if (selNode) rows.push(['Type', nodeType === 'mean' ? 'Mean node' : 'True node'])
              return rows.map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-white/55">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))
            })()}
          </dl>
          {selPlanet && <p className="mt-2 text-[10px] text-white/45">Rise and set for {observer.name}, in your device's time.</p>}
          {selNode && (
            <p className="mt-2 text-[10px] leading-relaxed text-white/55">
              {selected === 'rahu' ? 'North (ascending) node: where the Moon crosses the ecliptic going north.' : 'South (descending) node: exactly opposite Rahu.'}
            </p>
          )}
        </div>
      )}

      {/* ── Bottom: time controls and live info ── */}
      <div className="absolute inset-x-0 bottom-0 z-40 space-y-2 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-3 pt-8">
        {season.active && (
          <div className="mx-auto w-fit rounded-full border border-[#F2C14E]/50 bg-[#F2C14E]/15 px-3 py-1 text-center text-[11px] text-[#F6E7C1]">
            Eclipse season: Sun {season.separation.toFixed(1)}° from {season.node === 'rahu' ? 'Rahu' : 'Ketu'}
            {eclipses && <> · next solar {eclipses.solar.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ({eclipses.solar.kind})
              · next lunar {eclipses.lunar.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ({eclipses.lunar.kind})</>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => setSpeed(speed === 0 ? 1 : 0)} aria-label={speed === 0 ? 'Play' : 'Pause'}>
            {speed === 0 ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          <button type="button" className={btn} onClick={() => jumpTo(sim.current.time - DAY)}>−1 day</button>
          <button type="button" className={btn} onClick={() => jumpTo(sim.current.time + DAY)}>+1 day</button>
          <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-black/60 px-2 py-1.5 text-xs text-white" aria-label="Speed">
            {SPEEDS.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <button type="button" className={`${btn} ${live ? 'border-emerald-400/60 text-emerald-300' : ''}`}
            onClick={() => { jumpTo(Date.now()); setSpeed(1) }}>
            {live ? '● Live' : 'Now'}
          </button>
          <span className="ml-auto text-xs font-semibold tabular-nums text-white/90">{fmtWhen(date)}</span>
        </div>

        <input type="range" min={-SLIDER_DAYS} max={SLIDER_DAYS} step={1} value={Math.max(-SLIDER_DAYS, Math.min(SLIDER_DAYS, sliderDays))}
          onChange={e => { if (speed === 1) setSpeed(0); jumpTo(nowAtMount + Number(e.target.value) * DAY) }}
          className="w-full accent-[#C0392B]" aria-label="Scrub time (±20 years)" />

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/80">
          <span>Moon <b className="text-white">{RASHIS[moonS.rashi].sa}</b> · {NAKSHATRAS[moonS.nakshatra]} {moonS.pada}</span>
          <span>{tithi.paksha} {tithi.name} · {Math.round(snap.moonIllumination * 100)}% lit</span>
          <span>Sun <b className="text-white">{RASHIS[sunS.rashi].sa}</b> {fmtDeg(sunS.degree)}</span>
          <span>Lagna <b className="text-white">{RASHIS[snap.lagna.rashi].sa}</b> {fmtDeg(snap.lagna.degree)} ({observer.name})</span>
          <span>Rahu {RASHIS[snap.nodes.rahu.rashi].sa} {fmtDeg(snap.nodes.rahu.degree)} ℞</span>
          {snap.moonAtNode && <span className="font-semibold text-[#F6E7C1]">Moon crossing {snap.moonAtNode === 'rahu' ? 'Rahu' : 'Ketu'}</span>}
        </div>
      </div>
    </div>
  )
}
