import { NAKSHATRA_NAMES } from './constants.js'

export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
]

const NAKSHATRA_SPAN = 360 / 27

export function nakshatraFromLon(lon: number): string {
  const l = ((lon % 360) + 360) % 360
  return NAKSHATRA_NAMES[Math.floor(l / NAKSHATRA_SPAN)] ?? ''
}

export function nakshatraIndexFromLon(lon: number): number {
  const l = ((lon % 360) + 360) % 360
  return Math.floor(l / NAKSHATRA_SPAN)
}

export function nakshatraLordFromLon(lon: number): string {
  return NAKSHATRA_LORDS[nakshatraIndexFromLon(lon)] ?? 'Ketu'
}

export function nakshatraElapsedFraction(lon: number): number {
  const l = ((lon % 360) + 360) % 360
  return (l % NAKSHATRA_SPAN) / NAKSHATRA_SPAN
}
