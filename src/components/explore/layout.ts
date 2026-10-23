/**
 * How astronomical positions map into the 3D scene.
 *
 * Scene axes: the ecliptic is the XZ plane and +Y is the north ecliptic pole,
 * so an ecliptic vector (x, y, z) becomes (x, z, −y). Longitude then runs
 * anticlockwise when seen from above, as on a sky chart.
 *
 * Real distances would leave the planets invisible, so by default radial
 * distance is log-compressed and sizes are exaggerated. "True scale" (helio-
 * centric view only) uses linear distances instead.
 */
import type { PlanetKey, Vec3 } from '@/lib/ephemeris'

export type SceneKey = PlanetKey | 'earth'

/** Zodiac ring (the sidereal belt), scene units */
export const RING_INNER = 40
export const RING_OUTER = 48
/** Moon's orbit drawn around Earth: geocentric view / heliocentric view */
export const MOON_ORBIT_GEO = 2.2
export const MOON_ORBIT_HELIO = 1.1
/** Scene units per AU in true-scale mode */
export const TRUE_SCALE_UNITS_PER_AU = 6

export const toScene = ([x, y, z]: Vec3): Vec3 => [x, z, -y]

const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2])
const withLength = (v: Vec3, r: number): Vec3 => {
  const l = len(v) || 1
  return [(v[0] / l) * r, (v[1] / l) * r, (v[2] / l) * r]
}

/** Log-compressed radial distance: Mercury ≈ 2.9, Earth 6, Jupiter 16, Neptune 30 */
export const compress = (au: number) => 6 * Math.log2(1 + au)

/** Heliocentric scene position (Sun at origin) */
export function helioScene(vAU: Vec3, trueScale: boolean): Vec3 {
  const s = toScene(vAU)
  return trueScale ? [s[0] * TRUE_SCALE_UNITS_PER_AU, s[1] * TRUE_SCALE_UNITS_PER_AU, s[2] * TRUE_SCALE_UNITS_PER_AU] : withLength(s, compress(len(vAU)))
}

/** Geocentric scene position (Earth at origin). The Moon sits on its drawn orbit. */
export function geoScene(key: PlanetKey, vAU: Vec3): Vec3 {
  const s = toScene(vAU)
  return withLength(s, key === 'moon' ? MOON_ORBIT_GEO : 3.5 + compress(len(vAU)))
}

/** Direction on the ecliptic for a tropical longitude, at radius r */
export const ecliptic = (lonDeg: number, r: number): Vec3 => {
  const a = (lonDeg * Math.PI) / 180
  return [Math.cos(a) * r, 0, -Math.sin(a) * r]
}

/** Exaggerated radii, scene units */
export const BODY_RADIUS: Record<SceneKey, number> = {
  sun: 1.3, moon: 0.2, earth: 0.42, mercury: 0.2, venus: 0.32, mars: 0.26,
  jupiter: 0.85, saturn: 0.72, uranus: 0.48, neptune: 0.46, pluto: 0.14,
}

/** True-scale radii would be invisible; this floor keeps every body clickable */
export const TRUE_SCALE_MIN_RADIUS = 0.06

export const BODY_COLOR: Record<SceneKey, string> = {
  sun: '#FFD27A', moon: '#D9D4CC', earth: '#4A86E8', mercury: '#A8A29E', venus: '#E8C99A',
  mars: '#D9643A', jupiter: '#D8B48C', saturn: '#E3CF95', uranus: '#9FE0E8', neptune: '#4F7BE8', pluto: '#C9B49A',
}

export const RAHU_COLOR = '#9B7BD8'  // smoky violet
export const KETU_COLOR = '#E8603C'  // ember red
export const LAGNA_COLOR = '#F2C14E'

export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** Smoothstep easing for the view transition */
export const ease = (t: number) => t * t * (3 - 2 * t)
