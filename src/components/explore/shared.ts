/** Types and helpers shared by the Sky view and the Earth view */
import * as THREE from 'three'
import type { NodeKey, NodeType, Observer, PlanetKey } from '@/lib/ephemeris'

export type Selectable = PlanetKey | NodeKey

/** Mutable simulation state shared by the scenes and the controls */
export interface Sim {
  time: number          // simulated instant, ms since epoch
  speed: number         // simulated seconds per real second (0 = paused)
  nodeType: NodeType
  observer: Observer
  /** false shows the night sky at any hour, so stars and nakshatras stay visible */
  daylight: boolean
  reducedMotion: boolean
}

/** Sky view: where the camera looks — azimuth (from north, through east), altitude, field of view */
export interface View { az: number; alt: number; fov: number; follow: boolean }

export const RAHU_COLOR = '#9B7BD8'  // smoky violet
export const KETU_COLOR = '#E8603C'  // ember red
export const LAGNA_COLOR = '#F2C14E'

export const PLANET_COLOR: Record<PlanetKey, string> = {
  sun: '#FFD27A', moon: '#E6E1D8', mercury: '#C9C2B8', venus: '#FFF1D0', mars: '#FF7A4D',
  jupiter: '#FFE2B5', saturn: '#F2DFA8', uranus: '#A8EEF5', neptune: '#7FA4FF', pluto: '#D8C4A8',
}

export const RASHI_SA = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']

/**
 * A three.js matrix for an astronomy-engine rotation, which is stored
 * transposed (v′ᵢ = Σⱼ rot[j][i]·vⱼ).
 */
export function rotationMatrix(rot: number[][]) {
  return new THREE.Matrix4().set(
    rot[0][0], rot[1][0], rot[2][0], 0,
    rot[0][1], rot[1][1], rot[2][1], 0,
    rot[0][2], rot[1][2], rot[2][2], 0,
    0, 0, 0, 1,
  )
}

/** Applies a frame matrix to a group every frame (matrixAutoUpdate off) */
export function applyMatrix(group: THREE.Group | null, m: THREE.Matrix4) {
  if (!group) return
  group.matrixAutoUpdate = false
  group.matrix.copy(m)
  group.matrixWorldNeedsUpdate = true
}
