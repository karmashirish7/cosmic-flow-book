import { createRequire } from 'module'
import { SIGN_NAMES, NAKSHATRA_NAMES } from './constants.js'

const _require = createRequire(import.meta.url)

export interface PlanetPosition {
  longitude:  number
  sign:       string
  signNumber: number
  degrees:    number
  minutes:    number
  seconds:    number
  dms:        string
  formatted:  string
  speed:      number
  nakshatra:  string
}

export interface ChartPositions {
  jd:          number
  ayanamsa:    number
  lagna:       PlanetPosition
  lagnaSign:   number
  planets:     Record<string, PlanetPosition>
  houseNumbers: Record<string, number>
}

function nakshatraFromLon(lon: number): string {
  const l = ((lon % 360) + 360) % 360
  return NAKSHATRA_NAMES[Math.floor(l / (360 / 27))] ?? ''
}

function parseLon(lon: number, speed = 0): PlanetPosition {
  const l       = ((lon % 360) + 360) % 360
  const signIdx = Math.floor(l / 30)
  const inSign  = l % 30
  const deg     = Math.floor(inSign)
  const minF    = (inSign - deg) * 60
  const min     = Math.floor(minF)
  let   sec     = Math.round((minF - min) * 60)
  if (sec === 60) sec = 59
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    longitude:  l,
    sign:       SIGN_NAMES[signIdx] ?? '',
    signNumber: signIdx + 1,
    degrees:    deg,
    minutes:    min,
    seconds:    sec,
    dms:        `${deg}°${pad(min)}'${pad(sec)}"`,
    formatted:  `${deg} ${SIGN_NAMES[signIdx]} ${pad(min)}'${pad(sec)}"`,
    speed,
    nakshatra:  nakshatraFromLon(l),
  }
}

export function calculateChart(params: {
  year: number; month: number; day: number
  utcHour: number; lat: number; lon: number
}): ChartPositions {
  const sw    = _require('swisseph')
  const FLAGS = sw.SEFLG_SWIEPH | sw.SEFLG_SIDEREAL | sw.SEFLG_SPEED

  const { year, month, day, utcHour, lat, lon } = params
  sw.swe_set_sid_mode(sw.SE_SIDM_LAHIRI, 0, 0)

  const jd       = sw.swe_julday(year, month, day, utcHour, sw.SE_GREG_CAL)
  const ayanamsa = sw.swe_get_ayanamsa_ut(jd)
  const planets: Record<string, PlanetPosition> = {}

  const GRAHA_IDS = [
    { key: 'Sun',     id: sw.SE_SUN },
    { key: 'Moon',    id: sw.SE_MOON },
    { key: 'Mars',    id: sw.SE_MARS },
    { key: 'Mercury', id: sw.SE_MERCURY },
    { key: 'Jupiter', id: sw.SE_JUPITER },
    { key: 'Venus',   id: sw.SE_VENUS },
    { key: 'Saturn',  id: sw.SE_SATURN },
  ]

  for (const { key, id } of GRAHA_IDS) {
    const r = sw.swe_calc_ut(jd, id, FLAGS)
    if (r.error) throw new Error(`Swiss Ephemeris error for ${key}: ${r.error}`)
    planets[key] = parseLon(r.longitude, r.longitudeSpeed ?? 0)
  }

  const rahuR = sw.swe_calc_ut(jd, sw.SE_TRUE_NODE, FLAGS)
  if (rahuR.error) throw new Error(`Rahu error: ${rahuR.error}`)
  planets['Rahu'] = parseLon(rahuR.longitude, rahuR.longitudeSpeed ?? 0)
  planets['Ketu'] = parseLon(rahuR.longitude + 180, -(rahuR.longitudeSpeed ?? 0))

  const h        = sw.swe_houses_ex(jd, sw.SEFLG_SWIEPH | sw.SEFLG_SIDEREAL, lat, lon, 80)
  const lagna    = parseLon(h.ascendant)
  const lagnaSign = lagna.signNumber

  const houseNumbers: Record<string, number> = {}
  for (const key of [...GRAHA_IDS.map(p => p.key), 'Rahu', 'Ketu']) {
    houseNumbers[key] = ((planets[key].signNumber - lagnaSign + 12) % 12) + 1
  }

  return { jd, ayanamsa, lagna, lagnaSign, planets, houseNumbers }
}

export function parseTimezone(tz: string): number {
  const m = tz.match(/^([+-])(\d{1,2}):(\d{2})$/)
  if (!m) return 0
  const sign = m[1] === '+' ? 1 : -1
  return sign * (parseInt(m[2]) + parseInt(m[3]) / 60)
}

export function localToUTC(timeStr: string, tzOffset: number): { utcHour: number; dayOffset: number } {
  const parts     = timeStr.split(':').map(Number)
  const localHour = parts[0] + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600
  let   utcHour   = localHour - tzOffset
  let   dayOffset = 0
  if (utcHour < 0)   { utcHour += 24; dayOffset = -1 }
  if (utcHour >= 24) { utcHour -= 24; dayOffset = 1 }
  return { utcHour, dayOffset }
}
