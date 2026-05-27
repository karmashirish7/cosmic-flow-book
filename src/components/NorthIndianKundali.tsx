import { useState, useEffect } from 'react'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#F59E0B', Moon: '#E2E8F0', Mars: '#EF4444',
  Mercury: '#10B981', Jupiter: '#F97316', Venus: '#EC4899',
  Saturn: '#6366F1', Rahu: '#8B5CF6', Ketu: '#78716C',
}
const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
}
const RASI_SHORT = ['Ar','Ta','Ge','Ca','Le','Vi','Li','Sc','Sa','Cp','Aq','Pi']

interface Props {
  lagna:              number
  planets:            Record<string, number>
  planetDegrees?:     Record<string, number>
  planetRetrograde?:  Record<string, boolean>
  onHouseClick?:      (house: number) => void
  visualLagnaHouse?:  number
  onVisualLagnaChange?: (originalHouse: number) => void
}

export default function NorthIndianKundali({
  lagna, planets, planetDegrees = {}, planetRetrograde = {}, onHouseClick,
  visualLagnaHouse = 1, onVisualLagnaChange,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ vPos: number; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])

  const V = Math.max(1, Math.min(12, visualLagnaHouse))
  const isRotated = V !== 1
  const effectiveLagnaSign    = ((lagna - 1 + V - 1) % 12) + 1
  const actualLagnaVisualPos  = ((1 - V + 12) % 12) + 1
  const signAtVisualPos       = (vPos: number) => ((effectiveLagnaSign - 1 + vPos - 1) % 12) + 1

  const visualPlanets = Object.fromEntries(
    Object.entries(planets).map(([p, h]) => [p, ((h - V + 12) % 12) + 1])
  )
  const planetsAtVisualPos = (vPos: number) =>
    Object.entries(visualPlanets).filter(([, h]) => h === vPos).map(([p]) => p)

  const originalHouseOf = (vPos: number) => ((vPos - 1 + V - 1) % 12) + 1

  const POLYGONS: Record<number, string> = {
    1:  '200,0   300,100  200,200  100,100',
    2:  '0,0     200,0    100,100',
    3:  '0,0     100,100  0,200',
    4:  '100,100 0,200    100,300  200,200',
    5:  '0,400   0,200    100,300',
    6:  '0,400   100,300  200,400',
    7:  '200,200 100,300  200,400  300,300',
    8:  '400,400 200,400  300,300',
    9:  '400,400 300,300  400,200',
    10: '300,100 400,200  300,300  200,200',
    11: '400,0   400,200  300,100',
    12: '400,0   300,100  200,0',
  }
  const LABEL: Record<number, [number, number]> = {
    1:[200,100], 2:[100,33], 3:[33,100], 4:[100,200],
    5:[33,300],  6:[100,367], 7:[200,300], 8:[300,367],
    9:[367,300], 10:[300,200], 11:[367,100], 12:[300,33],
  }

  const handleContextMenu = (e: React.MouseEvent, vPos: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ vPos, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 400 400" style={{ display: 'block', width: '100%', borderRadius: 8 }}>
        <rect width={400} height={400} fill="#0C0C14" />

        {Object.entries(POLYGONS).map(([h, p]) => {
          const vPos = parseInt(h)
          const isVisualLagna = vPos === 1
          const isActualLagna = isRotated && vPos === actualLagnaVisualPos
          const fill = isVisualLagna ? 'rgba(124,58,237,0.18)'
                     : hovered === vPos ? 'rgba(255,255,255,0.05)'
                     : isActualLagna ? 'rgba(236,72,153,0.1)'
                     : 'transparent'
          return (
            <polygon
              key={vPos}
              points={p}
              fill={fill}
              stroke={isActualLagna ? '#EC4899' : '#2A2A3C'}
              strokeWidth={isActualLagna ? 1.5 : 1}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(vPos)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onHouseClick?.(originalHouseOf(vPos))}
              onContextMenu={e => handleContextMenu(e, vPos)}
            />
          )
        })}

        <rect width={400} height={400} fill="none" stroke="#2A2A3C" strokeWidth={1.5} />

        {Array.from({ length: 12 }, (_, i) => i + 1).map(vPos => {
          const [lx, ly]  = LABEL[vPos]
          const signNum   = signAtVisualPos(vPos)
          const ps        = planetsAtVisualPos(vPos)
          const isVLagna  = vPos === 1
          const isALagna  = isRotated && vPos === actualLagnaVisualPos

          const lineH      = 12
          const extraLines = isALagna ? 1 : 0
          const totalLines = 1 + ps.length + extraLines
          const startY     = ly - (totalLines * lineH) / 2

          return (
            <g key={vPos} style={{ pointerEvents: 'none' }}>
              {isALagna && (
                <text x={lx} y={startY + lineH * 0.5} textAnchor="middle" dominantBaseline="middle"
                  fill="#EC4899" fontSize={9} fontWeight="700" fontFamily="monospace">As</text>
              )}
              <text
                x={lx} y={startY + lineH * (isALagna ? 1.5 : 0.5)}
                textAnchor="middle" dominantBaseline="middle"
                fill={isVLagna ? '#A78BFA' : '#4B5563'}
                fontSize={isVLagna ? 12 : 11}
                fontWeight={isVLagna ? '700' : '600'}
                fontFamily="monospace"
              >
                {signNum}
              </text>
              {ps.map((planet, pi) => {
                const deg   = planetDegrees[planet]
                const abbr  = PLANET_ABBR[planet] ?? planet.slice(0, 2)
                const retro = planetRetrograde[planet] ?? false
                const core  = deg !== undefined ? `${abbr} ${deg}°` : abbr
                const label = retro ? `(${core})` : core
                return (
                  <text
                    key={planet}
                    x={lx} y={startY + lineH * (isALagna ? 2.5 + pi : 1.5 + pi)}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={PLANET_COLORS[planet] ?? '#94A3B8'}
                    fontSize={10} fontWeight="700" fontFamily="monospace"
                  >
                    {label}
                  </text>
                )
              })}
            </g>
          )
        })}
      </svg>

      {ctxMenu && onVisualLagnaChange && (
        <div
          className="fixed z-[100] rounded-xl overflow-hidden shadow-2xl"
          style={{ left: ctxMenu.x, top: ctxMenu.y, background: '#16162A', border: '1px solid #2A2A3C', minWidth: 180 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-[#2A2A3C] bg-[#1E1E2A]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              {`H${originalHouseOf(ctxMenu.vPos)} · ${RASI_SHORT[(signAtVisualPos(ctxMenu.vPos) - 1) % 12]}`}
            </p>
          </div>
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left hover:bg-white/5 transition-colors"
            style={{ color: '#A78BFA' }}
            onClick={() => { onVisualLagnaChange(originalHouseOf(ctxMenu.vPos)); setCtxMenu(null) }}
          >
            ↑ Show from this house
          </button>
          {isRotated && (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left hover:bg-white/5 transition-colors text-[#475569]"
              onClick={() => { onVisualLagnaChange(1); setCtxMenu(null) }}
            >
              ↺ Reset to actual lagna
            </button>
          )}
        </div>
      )}
    </div>
  )
}
