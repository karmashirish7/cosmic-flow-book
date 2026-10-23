/**
 * Ephemeris for the Explore view. Pure TypeScript, no rendering code.
 *
 * Positions come from astronomy-engine (MIT, ~1 arcminute), the same library
 * the Akashvani engine uses, with the same conventions so Explore agrees with
 * the Kundli page:
 *
 *   J2000 equatorial (EQJ, what astronomy-engine returns)
 *     → true ecliptic and equinox of date (Rotation_EQJ_ECT: precession + nutation)
 *     → sidereal = tropical − ayanamsa (True Chitra Paksha: Spica fixed at 180°)
 *
 * For the sky view, ecliptic-of-date and J2000 directions are rotated onto the
 * observer's horizon (astronomy-engine's HOR frame: x north, y west, z zenith),
 * and the grahas get topocentric altitude and azimuth.
 *
 * Rahu/Ketu: the mean node is the standard polynomial (as in the engine); the
 * true node is the osculating node, the line where the plane of the Moon's
 * instantaneous orbit (r × v) cuts the ecliptic. Ketu is always Rahu + 180°.
 */
import * as A from 'astronomy-engine'

export type PlanetKey =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
export type NodeKey = 'rahu' | 'ketu'
export type NodeType = 'mean' | 'true'
export type Vec3 = [number, number, number]

export interface BodyInfo {
  key: PlanetKey
  body: A.Body
  name: string
  /** Mean equatorial radius, km */
  radiusKm: number
}

export const PLANETS: BodyInfo[] = [
  { key: 'sun',     body: A.Body.Sun,     name: 'Sun',     radiusKm: 695_700 },
  { key: 'moon',    body: A.Body.Moon,    name: 'Moon',    radiusKm: 1_737.4 },
  { key: 'mercury', body: A.Body.Mercury, name: 'Mercury', radiusKm: 2_439.7 },
  { key: 'venus',   body: A.Body.Venus,   name: 'Venus',   radiusKm: 6_051.8 },
  { key: 'mars',    body: A.Body.Mars,    name: 'Mars',    radiusKm: 3_389.5 },
  { key: 'jupiter', body: A.Body.Jupiter, name: 'Jupiter', radiusKm: 69_911 },
  { key: 'saturn',  body: A.Body.Saturn,  name: 'Saturn',  radiusKm: 58_232 },
  { key: 'uranus',  body: A.Body.Uranus,  name: 'Uranus',  radiusKm: 25_362 },
  { key: 'neptune', body: A.Body.Neptune, name: 'Neptune', radiusKm: 24_622 },
  { key: 'pluto',   body: A.Body.Pluto,   name: 'Pluto',   radiusKm: 1_188.3 },
]

export const AU_KM = 149_597_870.7
/** Mean inclination of the Moon's orbit to the ecliptic, degrees */
export const MOON_INCLINATION = 5.145
/** The Sun must be within about this many degrees of a node for an eclipse to be possible */
export const ECLIPSE_LIMIT = 18

export const RASHIS = [
  { en: 'Aries',       sa: 'Mesha',      glyph: '♈' },
  { en: 'Taurus',      sa: 'Vrishabha',  glyph: '♉' },
  { en: 'Gemini',      sa: 'Mithuna',    glyph: '♊' },
  { en: 'Cancer',      sa: 'Karka',      glyph: '♋' },
  { en: 'Leo',         sa: 'Simha',      glyph: '♌' },
  { en: 'Virgo',       sa: 'Kanya',      glyph: '♍' },
  { en: 'Libra',       sa: 'Tula',       glyph: '♎' },
  { en: 'Scorpio',     sa: 'Vrishchika', glyph: '♏' },
  { en: 'Sagittarius', sa: 'Dhanu',      glyph: '♐' },
  { en: 'Capricorn',   sa: 'Makara',     glyph: '♑' },
  { en: 'Aquarius',    sa: 'Kumbha',     glyph: '♒' },
  { en: 'Pisces',      sa: 'Meena',      glyph: '♓' },
]

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

const DEG = Math.PI / 180
export const norm360 = (x: number) => ((x % 360) + 360) % 360
/** Signed difference a − b folded into (−180, 180] */
export const angleDiff = (a: number, b: number) => {
  const d = norm360(a - b)
  return d > 180 ? d - 360 : d
}

const toEct = (v: A.Vector, t: A.AstroTime): A.Vector => A.RotateVector(A.Rotation_EQJ_ECT(t), v)
const xyz = (v: A.Vector): Vec3 => [v.x, v.y, v.z]

// ─── Ayanamsa ─────────────────────────────────────────────────────────────────

// Spica / Chitra (α Vir): ICRS J2000 position and Hipparcos proper motion (as in the engine)
const SPICA_RA = 201.298246
const SPICA_DEC = -11.161319
const SPICA_PM_RA_MAS = -42.35
const SPICA_PM_DEC_MAS = -30.67

/** True Chitra Paksha ayanamsa, degrees: Spica's tropical longitude of date − 180°. */
export function ayanamsa(date: Date): number {
  const t = A.MakeTime(date)
  const yrs = t.tt / 365.25
  const ra = (SPICA_RA + (SPICA_PM_RA_MAS / 3_600_000) * yrs / Math.cos(SPICA_DEC * DEG)) * DEG
  const dec = (SPICA_DEC + (SPICA_PM_DEC_MAS / 3_600_000) * yrs) * DEG
  const v = new A.Vector(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec), t)
  return norm360(A.SphereFromVector(toEct(v, t)).lon - 180)
}

// ─── Geocentric positions ─────────────────────────────────────────────────────

/** Geocentric apparent position, ecliptic of date: vector (AU), longitude, latitude. */
export function geocentric(body: A.Body, date: Date) {
  const t = A.MakeTime(date)
  const ect = toEct(A.GeoVector(body, t, true), t)
  const s = A.SphereFromVector(ect)
  return { vec: xyz(ect), lon: s.lon, lat: s.lat, distAU: s.dist }
}

/** Daily motion in longitude, degrees/day (negative = retrograde), by ±12 h difference. */
export function dailyMotion(body: A.Body, date: Date): number {
  const h = 43_200_000
  const before = geocentric(body, new Date(date.getTime() - h)).lon
  const after = geocentric(body, new Date(date.getTime() + h)).lon
  return angleDiff(after, before)
}

// ─── Lunar nodes ──────────────────────────────────────────────────────────────

/** Mean ascending node (Rahu), tropical of date, degrees. Same polynomial as the Akashvani engine. */
export function meanNode(date: Date): number {
  const T = A.MakeTime(date).tt / 36525
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000)
}

/**
 * Osculating ascending node of the Moon's geocentric orbit, degrees, in the
 * given frame: 'date' (true ecliptic of date) or 'j2000' (ecliptic J2000).
 */
export function osculatingNode(date: Date, frame: 'date' | 'j2000' = 'date'): number {
  const t = A.MakeTime(date)
  const dt = 1 / 24 // days
  const rot = frame === 'date' ? A.Rotation_EQJ_ECT(t) : A.Rotation_EQJ_ECL()
  const pos = (tt: A.AstroTime) => A.RotateVector(rot, A.GeoMoon(tt))
  const r = pos(t)
  const a = pos(t.AddDays(-dt))
  const b = pos(t.AddDays(dt))
  const v = [(b.x - a.x) / (2 * dt), (b.y - a.y) / (2 * dt), (b.z - a.z) / (2 * dt)]
  // angular momentum h = r × v; the ascending node points along ẑ × h = (−h_y, h_x, 0)
  const hx = r.y * v[2] - r.z * v[1]
  const hy = r.z * v[0] - r.x * v[2]
  return norm360(Math.atan2(hx, -hy) / DEG)
}

export function rahuLongitude(date: Date, type: NodeType): number {
  return type === 'mean' ? meanNode(date) : osculatingNode(date, 'date')
}

// ─── Lagna ────────────────────────────────────────────────────────────────────

/** Tropical ascendant (degrees) for a place, from apparent sidereal time and the obliquity of date. */
export function ascendant(date: Date, lat: number, lon: number): number {
  const t = A.MakeTime(date)
  const ramc = norm360(A.SiderealTime(t) * 15 + lon) * DEG
  const T = t.tt / 36525
  const eps = (84381.406 - 46.836769 * T - 0.0001831 * T * T) / 3600 * DEG // IAU 2006 mean obliquity
  const phi = lat * DEG
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))
  return norm360(asc / DEG)
}

// ─── Sidereal description ─────────────────────────────────────────────────────

export interface SiderealPlace {
  sidereal: number
  rashi: number        // 0 Aries … 11 Pisces
  degree: number       // within the rashi
  nakshatra: number    // 0 Ashwini … 26 Revati
  pada: number         // 1–4
}

export function siderealPlace(tropical: number, ayan: number): SiderealPlace {
  const sidereal = norm360(tropical - ayan)
  const span = 360 / 27
  return {
    sidereal,
    rashi: Math.floor(sidereal / 30),
    degree: sidereal % 30,
    nakshatra: Math.floor(sidereal / span),
    pada: Math.floor((sidereal % span) / (span / 4)) + 1,
  }
}

/** 17.6 → 17°36′ */
export const fmtDeg = (d: number) => {
  const m = Math.round(d * 60)
  return `${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′`
}

// ─── The sky from a place on Earth ────────────────────────────────────────────

export interface Observer { lat: number; lon: number; name: string }
export const KATHMANDU: Observer = { lat: 27.7172, lon: 85.324, name: 'Kathmandu' }

const observerOf = (o: Observer) => new A.Observer(o.lat, o.lon, 0)

/**
 * Rotations onto the observer's horizon (HOR: x north, y west, z zenith), in
 * astronomy-engine's matrix format: from the true ecliptic of date (zodiac,
 * nodes, Moon's path) and from the J2000 equator (catalogue stars).
 */
export function skyRotations(date: Date, obs: Observer) {
  const t = A.MakeTime(date)
  const o = observerOf(obs)
  return {
    ectToHor: A.CombineRotation(A.Rotation_ECT_EQD(t), A.Rotation_EQD_HOR(t, o)),
    eqjToHor: A.Rotation_EQJ_HOR(t, o),
  }
}

/** Topocentric altitude and azimuth (degrees; azimuth from north through east), without refraction. */
export function horizontal(body: A.Body, date: Date, obs: Observer) {
  const o = observerOf(obs)
  const eq = A.Equator(body, date, o, true, true)
  const h = A.Horizon(date, o, eq.ra, eq.dec)
  return { alt: h.altitude, az: h.azimuth }
}

/** Altitude and azimuth of a point on the ecliptic (tropical longitude, latitude 0) */
export function eclipticToHorizontal(tropicalLon: number, date: Date, obs: Observer, rot = skyRotations(date, obs).ectToHor) {
  const a = tropicalLon * DEG
  const v = A.RotateVector(rot, new A.Vector(Math.cos(a), Math.sin(a), 0, A.MakeTime(date)))
  const s = A.SphereFromVector(v)
  return { alt: s.lat, az: norm360(-s.lon) }
}

// ─── Events ───────────────────────────────────────────────────────────────────

/** Next rise and set after `date` within two days, or null (e.g. circumpolar). */
export function riseSet(body: A.Body, date: Date, obs: Observer) {
  const o = observerOf(obs)
  return {
    rise: A.SearchRiseSet(body, o, +1, date, 2)?.date ?? null,
    set: A.SearchRiseSet(body, o, -1, date, 2)?.date ?? null,
  }
}

export function nextEclipses(date: Date) {
  const lunar = A.SearchLunarEclipse(date)
  const solar = A.SearchGlobalSolarEclipse(date)
  return {
    lunar: { date: lunar.peak.date, kind: lunar.kind as string },
    solar: { date: solar.peak.date, kind: solar.kind as string },
  }
}

/** Eclipse season: the Sun within ECLIPSE_LIMIT° of Rahu or Ketu. */
export function eclipseSeason(sunLon: number, rahuLon: number) {
  const toRahu = Math.abs(angleDiff(sunLon, rahuLon))
  const toKetu = Math.abs(angleDiff(sunLon, rahuLon + 180))
  const node: NodeKey = toRahu <= toKetu ? 'rahu' : 'ketu'
  const separation = Math.min(toRahu, toKetu)
  return { active: separation <= ECLIPSE_LIMIT, node, separation }
}

/** The Moon is crossing a node when its ecliptic latitude is near zero. */
export function moonAtNode(moonLon: number, moonLat: number, rahuLon: number, tolerance = 0.6) {
  if (Math.abs(moonLat) > tolerance) return null
  return Math.abs(angleDiff(moonLon, rahuLon)) < 90 ? 'rahu' as const : 'ketu' as const
}

// ─── Snapshot for the UI ──────────────────────────────────────────────────────

export interface PlanetState extends SiderealPlace {
  key: PlanetKey
  name: string
  lon: number
  lat: number
  distAU: number
  speed: number
  retrograde: boolean
  /** Topocentric, degrees */
  alt: number
  az: number
  /** Visual magnitude */
  mag: number
}

export function snapshot(date: Date, obs: Observer, nodeType: NodeType) {
  const ayan = ayanamsa(date)
  const planets: PlanetState[] = PLANETS.map(p => {
    const g = geocentric(p.body, date)
    const speed = dailyMotion(p.body, date)
    const h = horizontal(p.body, date, obs)
    const mag = p.key === 'sun' ? -26.7 : A.Illumination(p.body, date).mag
    return {
      key: p.key, name: p.name, lon: g.lon, lat: g.lat, distAU: g.distAU, speed, retrograde: speed < 0,
      alt: h.alt, az: h.az, mag, ...siderealPlace(g.lon, ayan),
    }
  })
  const rahu = rahuLongitude(date, nodeType)
  const sun = planets[0]
  const moon = planets[1]
  const lagna = ascendant(date, obs.lat, obs.lon)
  return {
    date,
    ayanamsa: ayan,
    planets,
    nodes: {
      rahu: { lon: rahu, ...siderealPlace(rahu, ayan) },
      ketu: { lon: norm360(rahu + 180), ...siderealPlace(rahu + 180, ayan) },
    },
    lagna: { lon: lagna, ...siderealPlace(lagna, ayan) },
    moonPhase: A.MoonPhase(date),                 // 0 new · 90 first quarter · 180 full · 270 last quarter
    moonIllumination: A.Illumination(A.Body.Moon, date).phase_fraction,
    eclipseSeason: eclipseSeason(sun.lon, rahu),
    moonAtNode: moonAtNode(moon.lon, moon.lat, rahu),
  }
}

export type Snapshot = ReturnType<typeof snapshot>
