import { describe, it, expect } from 'vitest'
import fixtures from './ephemeris.fixtures.json'
import {
  PLANETS, angleDiff, ascendant, ayanamsa, eclipseSeason, earthToEcliptic, eclipticToHorizontal, geocentric, horizontal, observerEcliptic,
  meanNode, moonAtNode, norm360, osculatingNode, rahuLongitude, siderealPlace, snapshot, KATHMANDU,
} from './ephemeris'

const horizons = fixtures.horizons.dates as Record<string, Record<string, { lon: number; lat: number } | number>>
const akashvani = fixtures.akashvani.dates as Record<string, {
  ayanamsa: number
  lagnaSidereal: number
  sidereal: Record<string, number>
}>
const dates = Object.keys(horizons)

const near = (actual: number, expected: number, tol: number) =>
  expect(Math.abs(angleDiff(actual, expected))).toBeLessThan(tol)

describe('planet positions vs NASA JPL Horizons (apparent ecliptic of date)', () => {
  for (const iso of dates) {
    it(`all ten bodies within 0.1° on ${iso}`, () => {
      for (const p of PLANETS) {
        const ref = horizons[iso][p.key] as { lon: number; lat: number }
        const g = geocentric(p.body, new Date(iso))
        near(g.lon, ref.lon, 0.1)
        expect(Math.abs(g.lat - ref.lat)).toBeLessThan(0.1)
      }
    })
  }
})

describe('ayanamsa and sidereal longitudes vs the Akashvani engine', () => {
  for (const iso of dates) {
    const ref = akashvani[iso]
    it(`True Chitra Paksha ayanamsa on ${iso}`, () => {
      near(ayanamsa(new Date(iso)), ref.ayanamsa, 0.001)
    })
    it(`sidereal grahas on ${iso}`, () => {
      const ayan = ayanamsa(new Date(iso))
      for (const p of PLANETS.filter(x => ref.sidereal[x.key] !== undefined)) {
        near(siderealPlace(geocentric(p.body, new Date(iso)).lon, ayan).sidereal, ref.sidereal[p.key], 0.01)
      }
    })
    it(`Kathmandu lagna on ${iso}`, () => {
      const ayan = ayanamsa(new Date(iso))
      near(norm360(ascendant(new Date(iso), KATHMANDU.lat, KATHMANDU.lon) - ayan), ref.lagnaSidereal, 0.05)
    })
  }

  it('Lahiri-family value is sane: about 23.85° at J2000, growing ~50″ a year', () => {
    near(ayanamsa(new Date('2000-01-01T12:00:00Z')), 23.85, 0.05)
    const perYear = ayanamsa(new Date('2025-01-01T00:00:00Z')) - ayanamsa(new Date('2024-01-01T00:00:00Z'))
    expect(perYear * 3600).toBeGreaterThan(45)
    expect(perYear * 3600).toBeLessThan(56)
  })
})

describe('Rahu and Ketu', () => {
  for (const iso of dates) {
    it(`mean Rahu matches the engine on ${iso}`, () => {
      const ayan = ayanamsa(new Date(iso))
      near(norm360(meanNode(new Date(iso)) - ayan), akashvani[iso].sidereal.rahu, 0.05)
    })
    it(`true Rahu matches JPL osculating node on ${iso}`, () => {
      near(osculatingNode(new Date(iso), 'j2000'), horizons[iso].moonOsculatingNodeJ2000 as number, 0.05)
    })
    it(`Ketu is Rahu + 180° on ${iso}`, () => {
      const s = snapshot(new Date(iso), KATHMANDU, 'mean')
      near(s.nodes.ketu.lon, s.nodes.rahu.lon + 180, 1e-9)
    })
  }

  it('the mean node moves backward about 19.3° a year', () => {
    const a = meanNode(new Date('2026-01-01T00:00:00Z'))
    const b = meanNode(new Date('2027-01-01T00:00:00Z'))
    near(angleDiff(b, a), -19.35, 0.1)
  })

  it('true node oscillates around the mean node within ~2°', () => {
    for (let m = 0; m < 24; m++) {
      const d = new Date(Date.UTC(2026, m, 1))
      expect(Math.abs(angleDiff(rahuLongitude(d, 'true'), rahuLongitude(d, 'mean')))).toBeLessThan(2.0)
    }
  })
})

describe('eclipse season and node crossings', () => {
  it('flags the Sun within 18° of either node', () => {
    expect(eclipseSeason(100, 110)).toMatchObject({ active: true, node: 'rahu' })
    expect(eclipseSeason(285, 110)).toMatchObject({ active: true, node: 'ketu' })
    expect(eclipseSeason(150, 110).active).toBe(false)
  })

  it('the 8 April 2024 total solar eclipse happened in eclipse season', () => {
    const s = snapshot(new Date('2024-04-08T18:17:00Z'), KATHMANDU, 'mean')
    expect(s.eclipseSeason.active).toBe(true)
  })

  it('names the node the Moon is crossing', () => {
    expect(moonAtNode(12, 0.2, 10)).toBe('rahu')
    expect(moonAtNode(191, -0.1, 10)).toBe('ketu')
    expect(moonAtNode(50, 3, 10)).toBeNull()
  })
})

describe('the sky from Kathmandu', () => {
  const topo = fixtures.horizonsTopocentric.dates as Record<string, Record<string, { az: number; alt: number }>>
  for (const iso of Object.keys(topo)) {
    it(`altitude and azimuth match JPL Horizons on ${iso}`, () => {
      for (const [key, ref] of Object.entries(topo[iso])) {
        const body = PLANETS.find(p => p.key === key)!.body
        const h = horizontal(body, new Date(iso), KATHMANDU)
        expect(Math.abs(h.alt - ref.alt)).toBeLessThan(0.05)
        // azimuth is meaningless near the zenith/nadir; scale the check by cos(alt)
        expect(Math.abs(angleDiff(h.az, ref.az)) * Math.cos(ref.alt * Math.PI / 180)).toBeLessThan(0.05)
      }
    })
  }

  for (const iso of dates) {
    it(`the lagna sits on the eastern horizon on ${iso}`, () => {
      const d = new Date(iso)
      const h = eclipticToHorizontal(ascendant(d, KATHMANDU.lat, KATHMANDU.lon), d, KATHMANDU)
      expect(Math.abs(h.alt)).toBeLessThan(0.02)
      expect(h.az).toBeGreaterThan(0)
      expect(h.az).toBeLessThan(180)
    })
    it(`the Sun lies on the drawn ecliptic on ${iso}`, () => {
      const d = new Date(iso)
      const sun = horizontal(PLANETS[0].body, d, KATHMANDU)
      const onEcliptic = eclipticToHorizontal(geocentric(PLANETS[0].body, d).lon, d, KATHMANDU)
      expect(Math.abs(sun.alt - onEcliptic.alt)).toBeLessThan(0.02)
      expect(Math.abs(angleDiff(sun.az, onEcliptic.az)) * Math.cos(sun.alt * Math.PI / 180)).toBeLessThan(0.02)
    })
  }
})

describe('the Earth seen from outside', () => {
  const RAD = Math.PI / 180
  const fixed = (lat: number, lon: number): [number, number, number] =>
    [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)]
  const rotate = (rot: { rot: number[][] }, v: [number, number, number]) =>
    [0, 1, 2].map(i => rot.rot[0][i] * v[0] + rot.rot[1][i] * v[1] + rot.rot[2][i] * v[2])
  const angle = (a: number[], b: number[]) =>
    Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) / RAD

  for (const iso of dates) {
    it(`the texture orientation puts Kathmandu under the location pin on ${iso}`, () => {
      const d = new Date(iso)
      const fromTexture = rotate(earthToEcliptic(d), fixed(KATHMANDU.lat, KATHMANDU.lon))
      // geodetic vs geocentric latitude differs by up to ~0.19°
      expect(angle(fromTexture, observerEcliptic(d, KATHMANDU))).toBeLessThan(0.25)
    })
    it(`the observer's zenith is overhead on ${iso}`, () => {
      const d = new Date(iso)
      const z = observerEcliptic(d, KATHMANDU)
      const lon = Math.atan2(z[1], z[0]) / RAD
      const lat = Math.asin(z[2]) / RAD
      // the ecliptic point under the zenith has altitude ≈ 90° − its ecliptic latitude offset
      const h = eclipticToHorizontal(lon, d, KATHMANDU)
      expect(Math.abs(h.alt - (90 - Math.abs(lat)))).toBeLessThan(0.3)
    })
  }
})
