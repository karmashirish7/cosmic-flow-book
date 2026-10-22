/**
 * Kundli data shapes (Akashvani Partner API, trimmed by /api/kundli),
 * reference tables and formatting shared by the Kundli page and its PDF report.
 */
import { panchangAt } from '@/lib/panchang'

// ─── API shapes (Akashvani Partner API, trimmed by /api/kundli) ───────────────

export type Graha = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu'

export interface GrahaPosition {
  graha: Graha
  longitude: number
  rashi: number
  degreeInRashi: number
  nakshatra: number
  pada: number
  retrograde: boolean
  combust: boolean
  dignity: string
  house: number
}

export interface VargaChart {
  varga: string
  lagnaRashi: number | null
  positions: { graha: Graha; rashi: number; vargottama?: boolean }[]
}

export interface DashaPeriod {
  lord: string
  from: string
  to: string
  level: number
  children?: DashaPeriod[]
}

export interface KundliResponse {
  engineVersion: string
  chart: {
    ayanamsa: number
    utcInstant: string
    tzId: string
    lagna: { longitude: number; rashi: number; degreeInRashi: number } | null
    positions: GrahaPosition[]
    vargas: VargaChart[]
  }
  currentDasha: DashaPeriod[]
  dashas: DashaPeriod[]
  /** The Vedic day of the birth (sunrise to sunrise); null if the API could not provide it */
  panchang: {
    date: { ad: string; bs: string | null }
    vaar: { number: number; name: string; nameNe: string }
    sunrise: string
    sunset: string
  } | null
}

export interface BirthDetails {
  name: string
  calendar: 'AD' | 'BS'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  place: string
  lat: number
  lon: number
}

// ─── Reference data ───────────────────────────────────────────────────────────

export const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

export const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

export const GRAHA_NAMES: Record<Graha, string> = {
  sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter',
  venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu',
}

export const VARGAS: { key: string; name: string; signifies: string }[] = [
  { key: 'D1',  name: 'Rashi',          signifies: 'Body, overall life' },
  { key: 'D2',  name: 'Hora',           signifies: 'Wealth' },
  { key: 'D3',  name: 'Drekkana',       signifies: 'Siblings, courage' },
  { key: 'D4',  name: 'Chaturthamsa',   signifies: 'Property, fortune' },
  { key: 'D7',  name: 'Saptamsa',       signifies: 'Children' },
  { key: 'D9',  name: 'Navamsa',        signifies: 'Spouse, dharma' },
  { key: 'D10', name: 'Dasamsa',        signifies: 'Career' },
  { key: 'D12', name: 'Dwadasamsa',     signifies: 'Parents' },
  { key: 'D16', name: 'Shodasamsa',     signifies: 'Vehicles, comforts' },
  { key: 'D20', name: 'Vimsamsa',       signifies: 'Spiritual practice' },
  { key: 'D24', name: 'Chaturvimsamsa', signifies: 'Education' },
  { key: 'D27', name: 'Bhamsa',         signifies: 'Strength, stamina' },
  { key: 'D30', name: 'Trimsamsa',      signifies: 'Misfortunes' },
  { key: 'D40', name: 'Khavedamsa',     signifies: 'Maternal legacy' },
  { key: 'D45', name: 'Akshavedamsa',   signifies: 'Paternal legacy' },
  { key: 'D60', name: 'Shashtiamsa',    signifies: 'Past karma' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const grahaName = (g: string) => GRAHA_NAMES[g as Graha] ?? g
export const pad2 = (n: number) => String(n).padStart(2, '0')

/** 9.6192 → 9°37'09" */
export function dms(deg: number): string {
  const totalSec = Math.round(deg * 3600)
  const d = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  return `${d}°${pad2(m)}'${pad2(totalSec % 60)}"`
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtBirthDate = (d: BirthDetails) =>
  d.calendar === 'BS'
    ? `${d.day} ${BS_MONTHS[d.month - 1]} ${d.year} BS`
    : new Date(Date.UTC(d.year, d.month - 1, d.day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export const isCurrent = (p: { from: string; to: string }) => {
  const now = Date.now()
  return Date.parse(p.from) <= now && now < Date.parse(p.to)
}

export const yearsBetween = (from: string, to: string) =>
  ((Date.parse(to) - Date.parse(from)) / (365.2425 * 86400000)).toFixed(1)


/** House of a rashi counted from the lagna rashi (whole-sign). */
export const houseOf = (rashi: number, lagnaRashi: number) => ((rashi - lagnaRashi + 12) % 12) + 1

// ─── Derived view of one chart (shared by the page and the PDF report) ────────

export interface ChartView {
  lagna: number
  houses: Record<string, number>
  positions: VargaChart['positions']
}

export function deriveKundli(data: KundliResponse) {
  const { chart, currentDasha } = data
  const lagnaRashi = chart.lagna?.rashi ?? 1

  const d1 = {
    houses: Object.fromEntries(chart.positions.map(p => [grahaName(p.graha), p.house])),
    degrees: Object.fromEntries(chart.positions.map(p => [grahaName(p.graha), Math.floor(p.degreeInRashi)])),
    retrograde: Object.fromEntries(chart.positions.map(p => [grahaName(p.graha), p.retrograde])),
  }

  /** Each varga as the chart component needs it: lagna rashi + planet → house. */
  const vargaCharts: Record<string, ChartView> = Object.fromEntries(chart.vargas.map(v => {
    const lagna = v.lagnaRashi ?? lagnaRashi
    return [v.varga, {
      lagna,
      houses: Object.fromEntries(v.positions.map(p => [grahaName(p.graha), houseOf(p.rashi, lagna)])),
      positions: v.positions,
    }]
  }))

  const moon = chart.positions.find(p => p.graha === 'moon')
  const sun = chart.positions.find(p => p.graha === 'sun')

  return {
    lagnaRashi,
    d1,
    vargaCharts,
    moon,
    sun,
    birthPanchang: sun && moon ? panchangAt(sun.longitude, moon.longitude) : null,
    dashaNow: currentDasha.slice(0, 3).map(p => grahaName(p.lord)).join(' – '),  // MD – AD – PD
    localTime: (iso: string) =>
      new Date(iso).toLocaleTimeString('en-GB', { timeZone: chart.tzId, hour: '2-digit', minute: '2-digit' }),
  }
}

export type KundliView = ReturnType<typeof deriveKundli>
