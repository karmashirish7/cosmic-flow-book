/** Geometry helpers for the celestial sphere, in astronomy-engine's axes */
import * as THREE from 'three'

export const RAD = Math.PI / 180

/** Unit vector for J2000 right ascension / declination (degrees), astronomy-engine axes */
export const eqjUnit = (ra: number, dec: number) => new THREE.Vector3(
  Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD),
)

/** A point in ecliptic coordinates (z = north ecliptic pole) */
export const eclPoint = (lonDeg: number, latDeg: number, r: number): [number, number, number] => [
  Math.cos(latDeg * RAD) * Math.cos(lonDeg * RAD) * r,
  Math.cos(latDeg * RAD) * Math.sin(lonDeg * RAD) * r,
  Math.sin(latDeg * RAD) * r,
]

/**
 * A band along the ecliptic in sidereal ecliptic coordinates, ±`band`° wide,
 * with UVs for zodiacBeltTexture (u = 1 − λ/360, read from inside the sphere).
 */
export function beltGeometry(radius: number, band: number) {
  const seg = 360
  const pos: number[] = [], uv: number[] = [], idx: number[] = []
  for (let i = 0; i <= seg; i++) {
    const lon = (i / seg) * 360
    for (const [k, lat] of [[0, -band], [1, band]] as const) {
      pos.push(...eclPoint(lon, lat, radius))
      uv.push(1 - lon / 360, k)
    }
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}
