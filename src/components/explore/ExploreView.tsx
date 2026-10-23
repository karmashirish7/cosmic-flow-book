import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Compass, Eye, EyeOff, LocateFixed, Maximize2, Minimize2, Moon, Pause, Play, SkipForward, Star, Sun, X,
} from 'lucide-react'
import {
  KATHMANDU, NAKSHATRAS, PLANETS, RASHIS, eclipticToHorizontal, fmtDeg, nextEclipses, riseSet, snapshot,
  type NodeType, type Observer,
} from '@/lib/ephemeris'
import { panchangAt } from '@/lib/panchang'
import SkyDome, { type Selectable, type Sim, type View } from './SkyDome'
import heroBg from '@/assets/hero-bg.jpg'

const DAY = 86_400_000
const SLIDER_DAYS = 20 * 365   // ±20 years around today

const SPEEDS = [
  { label: 'Paused', v: 0 },
  { label: 'Live', v: 1 },
  { label: '1 min / s', v: 60 },
  { label: '10 min / s', v: 600 },
  { label: '1 hour / s', v: 3_600 },
  { label: '1 day / s', v: 86_400 },
  { label: '1 month / s', v: 2_629_800 },
  { label: '1 year / s', v: 31_557_600 },
]

const ORDER: Selectable[] = [...PLANETS.map(p => p.key), 'rahu', 'ketu']
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

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
const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const place = (p: { rashi: number; degree: number }) => `${RASHIS[p.rashi].sa} (${RASHIS[p.rashi].en}) ${fmtDeg(p.degree)}`
const compassPoint = (az: number) => COMPASS[Math.round(az / 45) % 8]

/** Start facing the highest part of the zodiac, so the belt is in view */
function initialView(date: Date, obs: Observer, narrow: boolean): View {
  let best = { alt: -90, az: 180 }
  for (let lon = 0; lon < 360; lon += 5) {
    const h = eclipticToHorizontal(lon, date, obs)
    if (h.alt > best.alt) best = h
  }
  // portrait screens see less sideways, so centre the belt rather than looking just under it
  const alt = narrow ? best.alt : best.alt - 15
  return { az: best.az, alt: Math.min(narrow ? 60 : 45, Math.max(12, alt)), fov: narrow ? 90 : 72, follow: false }
}

const btn = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/45 px-2.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/10 disabled:opacity-40'

export default function ExploreView() {
  const container = useRef<HTMLDivElement>(null)
  const reducedMotion = useMemo(prefersReducedMotion, [])
  const webgl = useMemo(hasWebGL, [])
  const nowAtMount = useMemo(() => Date.now(), [])

  const sim = useRef<Sim>({ time: nowAtMount, speed: 1, nodeType: 'mean', observer: KATHMANDU, daylight: true, reducedMotion })
  const view = useRef<View>(initialView(new Date(nowAtMount), KATHMANDU, window.innerWidth < 640))

  const [time, setTime] = useState(nowAtMount)
  const [speed, setSpeedState] = useState(1)
  const [nodeType, setNodeTypeState] = useState<NodeType>('mean')
  const [observer, setObserverState] = useState<Observer>(KATHMANDU)
  const [selected, setSelected] = useState<Selectable | null>(null)
  const [seeThrough, setSeeThrough] = useState(false)
  const [starNames, setStarNames] = useState(true)
  const [daylight, setDaylightState] = useState(true)
  const [locating, setLocating] = useState(false)
  const [active, setActive] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [heading, setHeading] = useState({ az: view.current.az, alt: view.current.alt })

  // Keep the shared sim ref and React state in step
  const setSpeed = (v: number) => { sim.current.speed = v; setSpeedState(v) }
  const setNodeType = (v: NodeType) => { sim.current.nodeType = v; setNodeTypeState(v) }
  const setObserver = (o: Observer) => { sim.current.observer = o; setObserverState(o) }
  const setDaylight = (v: boolean) => { sim.current.daylight = v; setDaylightState(v) }
  const jumpTo = (ms: number) => { sim.current.time = ms; setTime(ms) }

  // Pull simulated time and the view direction into React: 4×/s while playing fast, else 2×/s
  useEffect(() => {
    const id = setInterval(() => {
      setTime(sim.current.time)
      setHeading({ az: view.current.az, alt: view.current.alt })
    }, speed > 1 ? 250 : 500)
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

  const faceZodiac = () => {
    setSelected(null)
    Object.assign(view.current, initialView(new Date(sim.current.time), observer, window.innerWidth < 640))
  }

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
  const selNodeHor = useMemo(
    () => (selNode ? eclipticToHorizontal(selNode.lon, new Date(snapTime), observer) : null),
    [selNode, snapTime, observer],
  )

  // Turning to something below the horizon would show only ground, so let the ground go see-through
  const selAlt = selPlanet?.alt ?? selNodeHor?.alt ?? null
  useEffect(() => {
    if (selAlt !== null && selAlt < 0) setSeeThrough(true)
    // only when the selection changes, not as it moves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

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

  const altAzRow = (alt: number, az: number): [string, string] =>
    ['Position', `${alt >= 0 ? 'Up' : 'Below horizon'} ${Math.abs(alt).toFixed(1)}° · ${compassPoint(az)} ${az.toFixed(0)}°`]

  return (
    <div ref={container}
      className={`relative w-full overflow-hidden bg-[#04050B] text-white select-none ${fullscreen ? 'h-full' : 'h-[78vh] min-h-[560px] rounded-2xl'}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 0], fov: view.current.fov, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        onPointerMissed={() => setSelected(null)}
      >
        <SkyDome sim={sim} view={view} snap={snap} selected={selected} onSelect={setSelected}
          seeThrough={seeThrough} starNames={starNames} />
      </Canvas>

      {/* ── Top: heading and toggles ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-start justify-between gap-2 p-3">
        <button type="button" onClick={faceZodiac} title="Face the zodiac"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs backdrop-blur hover:bg-white/10">
          <Compass className="h-4 w-4 text-[#F2C14E]" />
          <span>Facing <b>{compassPoint(heading.az)}</b> {heading.az.toFixed(0)}° · {heading.alt >= 0 ? 'up' : 'down'} {Math.abs(heading.alt).toFixed(0)}°</span>
        </button>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
          <button type="button" className={btn} onClick={() => setNodeType(nodeType === 'mean' ? 'true' : 'mean')}
            title="Rahu/Ketu: mean node (Vedic standard) or true (osculating) node">
            ☊ {nodeType === 'mean' ? 'Mean node' : 'True node'}
          </button>
          <button type="button" className={btn} onClick={() => setSeeThrough(!seeThrough)}
            title="Show grahas below the horizon through the ground">
            {seeThrough ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {seeThrough ? 'See-through ground' : 'Solid ground'}
          </button>
          <button type="button" className={btn} onClick={() => setDaylight(!daylight)}
            title={daylight ? 'Hide daylight to see the stars and nakshatras at any hour' : 'Show the real daytime sky'}>
            {daylight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {daylight ? 'Daylight on' : 'Daylight off'}
          </button>
          <button type="button" className={btn} onClick={() => setStarNames(!starNames)} title="Star names">
            <Star className="h-3.5 w-3.5" /> {starNames ? 'Names on' : 'Names off'}
          </button>
          <button type="button" className={btn} onClick={nextObject} title="Turn to the next graha">
            <SkipForward className="h-3.5 w-3.5" /> Next
          </button>
          <button type="button" className={btn} onClick={locate} disabled={locating}
            title="See the sky from your location">
            <LocateFixed className="h-3.5 w-3.5" /> {locating ? 'Locating…' : observer === KATHMANDU ? 'Kathmandu' : 'My location'}
          </button>
          <button type="button" className={btn} onClick={toggleFullscreen} title="Fullscreen" aria-label="Fullscreen">
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Selected object ── */}
      {(selPlanet || selNode) && (
        <div className="absolute right-3 top-28 sm:top-16 z-40 w-[min(18rem,calc(100%-1.5rem))] rounded-xl border border-white/15 bg-black/70 p-4 text-sm backdrop-blur">
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
              if (selPlanet) rows.push(altAzRow(selPlanet.alt, selPlanet.az))
              if (selNodeHor) rows.push(altAzRow(selNodeHor.alt, selNodeHor.az))
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
          {selPlanet && <p className="mt-2 text-[10px] text-white/45">As seen from {observer.name}; times in your device's time zone.</p>}
          {selNode && (
            <p className="mt-2 text-[10px] leading-relaxed text-white/55">
              {selected === 'rahu'
                ? 'North node: where the Moon’s path (the faint circle) crosses the ecliptic going north.'
                : 'South node: where the Moon’s path crosses the ecliptic going south, opposite Rahu.'}
            </p>
          )}
        </div>
      )}

      {/* ── Bottom: time controls and live info ── */}
      <div className="absolute inset-x-0 bottom-0 z-40 space-y-2 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-3 pt-8">
        {season.active && (
          <div className="mx-auto w-fit rounded-full border border-[#F2C14E]/50 bg-[#F2C14E]/15 px-3 py-1 text-center text-[11px] text-[#F6E7C1]">
            Eclipse season: Sun {season.separation.toFixed(1)}° from {season.node === 'rahu' ? 'Rahu' : 'Ketu'}
            {eclipses && <> · next solar {fmtDay(eclipses.solar.date)} ({eclipses.solar.kind}) · next lunar {fmtDay(eclipses.lunar.date)} ({eclipses.lunar.kind})</>}
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
          onChange={e => { if (speed === 1) setSpeed(0); jumpTo(nowAtMount + Number(e.target.value) * DAY + (time - nowAtMount) % DAY) }}
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
