import { useEffect, useRef, useState } from 'react'
import { Orbit } from 'lucide-react'
import { RASHIS, fmtDeg, type Snapshot } from '@/lib/ephemeris'
import { KETU_COLOR, PLANET_COLOR, RAHU_COLOR, type Selectable } from './shared'

/** "Planets": a list of every graha and node, with where it is now; picking one turns to it */
export default function PlanetPicker({ snap, selected, onSelect, buttonClass }: {
  snap: Snapshot
  selected: Selectable | null
  onSelect: (k: Selectable) => void
  buttonClass: string
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const rows: { key: Selectable; name: string; color: string; where: string; retro: boolean }[] = [
    ...snap.planets.map(p => ({
      key: p.key as Selectable, name: p.name, color: PLANET_COLOR[p.key],
      where: `${RASHIS[p.rashi].sa} ${fmtDeg(p.degree)}`, retro: p.retrograde && p.key !== 'sun' && p.key !== 'moon',
    })),
    { key: 'rahu', name: 'Rahu ☊', color: RAHU_COLOR, where: `${RASHIS[snap.nodes.rahu.rashi].sa} ${fmtDeg(snap.nodes.rahu.degree)}`, retro: true },
    { key: 'ketu', name: 'Ketu ☋', color: KETU_COLOR, where: `${RASHIS[snap.nodes.ketu.rashi].sa} ${fmtDeg(snap.nodes.ketu.degree)}`, retro: true },
  ]

  return (
    <div ref={box} className="relative">
      <button type="button" className={buttonClass} onClick={() => setOpen(!open)} title="Turn to a planet">
        <Orbit className="h-3.5 w-3.5" /> Planets
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-50 mt-1.5 max-h-[55vh] w-60 overflow-y-auto rounded-xl border border-white/15 bg-[#0B0C16]/95 py-1 text-xs text-white shadow-2xl backdrop-blur">
          {rows.map(r => (
            <li key={r.key}>
              <button type="button" onClick={() => { onSelect(r.key); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/10 ${selected === r.key ? 'bg-white/10' : ''}`}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="flex-1 font-semibold">{r.name}</span>
                <span className="text-white/60">{r.where}{r.retro ? ' ℞' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
