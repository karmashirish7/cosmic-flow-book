import { useEffect, useMemo, useRef, useState } from 'react'
import { LocateFixed, MapPin, X } from 'lucide-react'
import { searchCities } from '@/lib/cities'
import type { Observer } from '@/lib/ephemeris'

const input = 'w-full rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-[#F2C14E]/70 focus:outline-none'

/** Choose where the sky is seen from: a city, typed coordinates, or the device's location */
export default function LocationPicker({ observer, onChange, buttonClass }: {
  observer: Observer
  onChange: (o: Observer) => void
  buttonClass: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const results = useMemo(() => (query.trim().length >= 2 ? searchCities(query, 6) : []), [query])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = (o: Observer) => {
    onChange(o)
    setOpen(false)
    setQuery('')
    setError(null)
  }

  const applyCoords = () => {
    const la = Number(lat), lo = Number(lon)
    if (lat === '' || lon === '' || !Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
      setError('Latitude −90…90 and longitude −180…180, e.g. 27.7172 and 85.324')
      return
    }
    choose({ lat: la, lon: lo, name: `${Math.abs(la).toFixed(2)}°${la >= 0 ? 'N' : 'S'} ${Math.abs(lo).toFixed(2)}°${lo >= 0 ? 'E' : 'W'}` })
  }

  const locate = () => {
    if (!navigator.geolocation) { setError('This browser cannot share its location.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      p => { setLocating(false); choose({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'your location' }) },
      () => { setLocating(false); setError('Location permission was not given.') },
      { maximumAge: 600_000, timeout: 10_000 },
    )
  }

  return (
    <div ref={box} className="relative">
      <button type="button" className={buttonClass} onClick={() => setOpen(!open)} title="Change the place the sky is seen from">
        <MapPin className="h-3.5 w-3.5" /> <span className="max-w-[9rem] truncate">{observer.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 space-y-3 rounded-xl border border-white/15 bg-[#0B0C16]/95 p-3 text-xs text-white shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-semibold">See the sky from…</span>
            <button type="button" onClick={() => setOpen(false)} className="text-white/60 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <input className={input} placeholder="Search a city, e.g. Pokhara, London" value={query} autoFocus
              onChange={e => setQuery(e.target.value)} />
            {results.length > 0 && (
              <ul className="mt-1 overflow-hidden rounded-lg border border-white/10">
                {results.map(c => (
                  <li key={`${c.name}-${c.country}-${c.lat}`}>
                    <button type="button" className="w-full px-2.5 py-1.5 text-left hover:bg-white/10"
                      onClick={() => choose({ lat: c.lat, lon: c.lon, name: [c.name, c.country].join(', ') })}>
                      {[c.name, c.state, c.country].filter(Boolean).join(', ')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="mt-1 text-white/50">Not in the list. Enter its coordinates below.</p>
            )}
          </div>

          <div>
            <p className="mb-1 text-white/60">Or coordinates (north and east positive)</p>
            <div className="flex gap-1.5">
              <input className={input} inputMode="decimal" placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} />
              <input className={input} inputMode="decimal" placeholder="Longitude" value={lon} onChange={e => setLon(e.target.value)} />
              <button type="button" onClick={applyCoords} className="rounded-lg bg-[#8B1E1E] px-2.5 font-semibold hover:bg-[#A52A2A]">Go</button>
            </div>
          </div>

          <button type="button" onClick={locate} disabled={locating}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 hover:bg-white/10 disabled:opacity-50">
            <LocateFixed className="h-3.5 w-3.5" /> {locating ? 'Locating…' : 'Use my location'}
          </button>
          {error && <p className="text-[#FF8A80]">{error}</p>}
          <p className="text-white/40">Now: {observer.name} ({observer.lat.toFixed(2)}°, {observer.lon.toFixed(2)}°)</p>
        </div>
      )}
    </div>
  )
}
