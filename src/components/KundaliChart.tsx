import { forwardRef } from 'react'

/** North Indian chart drawn for light backgrounds and print. Signs 1–12, houses 1–12. */

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#B45309', Moon: '#475569', Mars: '#B91C1C',
  Mercury: '#047857', Jupiter: '#C2410C', Venus: '#BE185D',
  Saturn: '#3730A3', Rahu: '#6D28D9', Ketu: '#57534E',
}

const POLYGONS: Record<number, string> = {
  1:  '200,0 300,100 200,200 100,100',
  2:  '0,0 200,0 100,100',
  3:  '0,0 100,100 0,200',
  4:  '100,100 0,200 100,300 200,200',
  5:  '0,400 0,200 100,300',
  6:  '0,400 100,300 200,400',
  7:  '200,200 100,300 200,400 300,300',
  8:  '400,400 200,400 300,300',
  9:  '400,400 300,300 400,200',
  10: '300,100 400,200 300,300 200,200',
  11: '400,0 400,200 300,100',
  12: '400,0 300,100 200,0',
}

const LABEL: Record<number, [number, number]> = {
  1: [200, 100], 2: [100, 38], 3: [38, 100], 4: [100, 200],
  5: [38, 300], 6: [100, 362], 7: [200, 300], 8: [300, 362],
  9: [362, 300], 10: [300, 200], 11: [362, 100], 12: [300, 38],
}

const LINE = '#8B1E1E'

interface Props {
  title: string
  lagnaSign: number
  houses: Record<string, number>
  degrees?: Record<string, number>
  retrograde?: Record<string, boolean>
}

const KundaliChart = forwardRef<SVGSVGElement, Props>(({ title, lagnaSign, houses, degrees, retrograde }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 400 430"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={`${title} chart`}
    style={{ display: 'block', width: '100%', height: 'auto' }}
  >
    <rect width={400} height={430} fill="#FFFFFF" />
    <g transform="translate(0,30)">
      {Object.values(POLYGONS).map((p, i) => (
        <polygon key={i} points={p} fill={i === 0 ? '#FBEFEF' : '#FFFFFF'} stroke={LINE} strokeWidth={1.2} />
      ))}
      <rect x={0.75} y={0.75} width={398.5} height={398.5} fill="none" stroke={LINE} strokeWidth={1.5} />

      {Array.from({ length: 12 }, (_, i) => i + 1).map(house => {
        const [x, y] = LABEL[house]
        const sign = ((lagnaSign - 1 + house - 1) % 12) + 1
        const inHouse = Object.entries(houses).filter(([, h]) => h === house).map(([p]) => p)
        const lines = [house === 1 ? 'Asc' : null, ...inHouse].filter(Boolean) as string[]
        const lineH = 13
        const startY = y - ((lines.length + 1) * lineH) / 2 + lineH / 2

        return (
          <g key={house} fontFamily="Inter, Arial, sans-serif" textAnchor="middle" dominantBaseline="middle">
            <text x={x} y={startY} fontSize={11} fontWeight={600} fill="#9CA3AF">{sign}</text>
            {lines.map((p, i) => {
              const deg = degrees?.[p]
              const label = p === 'Asc' ? 'Asc'
                : `${PLANET_ABBR[p] ?? p}${deg !== undefined ? ` ${deg}°` : ''}${retrograde?.[p] ? ' R' : ''}`
              return (
                <text key={p} x={x} y={startY + lineH * (i + 1)} fontSize={11} fontWeight={700}
                  fill={p === 'Asc' ? LINE : PLANET_COLORS[p] ?? '#111827'}>
                  {label}
                </text>
              )
            })}
          </g>
        )
      })}
    </g>
    <text x={200} y={18} textAnchor="middle" fontFamily="Cinzel, Georgia, serif" fontSize={15} fontWeight={700} fill={LINE}>
      {title}
    </text>
  </svg>
))

KundaliChart.displayName = 'KundaliChart'

export default KundaliChart
