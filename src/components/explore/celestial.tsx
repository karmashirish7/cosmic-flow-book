/**
 * Pieces of the celestial sphere shared by the Sky view and the Earth view.
 * Everything here is built in J2000 equatorial coordinates (stars, zodiac
 * figures) or sidereal ecliptic coordinates (the belt), in astronomy-engine's
 * axes; the parent group's matrix places it in the scene.
 */
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import starData from './stars.json'
import figureData from './constellations.json'
import { eqjUnit } from './geometry'




// ─── Stars ────────────────────────────────────────────────────────────────────

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  uniform float uPixelRatio;
  uniform float uScale;
  void main() {
    vColor = aColor;
    gl_PointSize = aSize * uScale * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * uOpacity);
  }`

/** Approximate star colour from the B−V index */
function bvColor(bv: number): [number, number, number] {
  const t = THREE.MathUtils.clamp((bv + 0.3) / 2.0, 0, 1)
  const c = new THREE.Color().setHSL(0.62 - 0.55 * t, 0.35 + 0.3 * Math.abs(t - 0.35), 0.82)
  return [c.r, c.g, c.b]
}

/** 2,865 naked-eye stars from the HYG catalogue, sized by magnitude, coloured by B−V */
export function StarPoints({ radius, opacity, scale = 1 }: { radius: number; opacity: () => number; scale?: number }) {
  const dpr = useThree(s => s.viewport.dpr)
  const { geometry, uniforms } = useMemo(() => {
    const s = starData.stars as number[]
    const n = s.length / 4
    const pos = new Float32Array(n * 3), size = new Float32Array(n), col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos.set(eqjUnit(s[i * 4], s[i * 4 + 1]).multiplyScalar(radius).toArray(), i * 3)
      size[i] = THREE.MathUtils.clamp(5.2 - 0.85 * s[i * 4 + 2], 1.1, 7.5)
      col.set(bvColor(s[i * 4 + 3]), i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    return { geometry: g, uniforms: { uOpacity: { value: 1 }, uPixelRatio: { value: 1 }, uScale: { value: scale } } }
  }, [radius, scale])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(() => {
    uniforms.uOpacity.value = opacity()
    uniforms.uPixelRatio.value = dpr
  })
  return (
    <points geometry={geometry} renderOrder={1}>
      <shaderMaterial vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/** Names of the brightest stars and the key nakshatra yogataras */
export function StarNames({ radius, hidden }: { radius: number; hidden?: (p: THREE.Vector3) => boolean }) {
  return (
    <>
      {(starData.names as [string, number, number][]).map(([name, ra, dec]) => {
        const p = eqjUnit(ra, dec).multiplyScalar(radius)
        if (hidden?.(p)) return null
        return (
          <Html key={name} position={p.toArray()} style={{ pointerEvents: 'none' }} zIndexRange={[8, 0]}>
            <span className="ml-2 whitespace-nowrap text-[10px] italic text-sky-100/70">{name}</span>
          </Html>
        )
      })}
    </>
  )
}

// ─── The zodiac constellations' patterns ──────────────────────────────────────

interface Figure { abbr: string; name: string; rashi: string; lines: number[][]; stars: number[][] }
const FIGURES = figureData.figures as Figure[]

/** Stick figures of the 12 zodiac constellations, so each rashi's star pattern can be seen */
export function ZodiacFigures({ radius, color = '#F6D98B', opacity }: { radius: number; color?: string; opacity: () => number }) {
  const { lines, dots } = useMemo(() => {
    const seg: number[] = [], pts: number[] = []
    for (const f of FIGURES) {
      for (const [ra1, d1, ra2, d2] of f.lines) {
        seg.push(...eqjUnit(ra1, d1).multiplyScalar(radius).toArray(), ...eqjUnit(ra2, d2).multiplyScalar(radius).toArray())
      }
      for (const [ra, d] of f.stars) pts.push(...eqjUnit(ra, d).multiplyScalar(radius * 0.999).toArray())
    }
    return {
      lines: new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(seg, 3)),
      dots: new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
    }
  }, [radius])
  useEffect(() => () => { lines.dispose(); dots.dispose() }, [lines, dots])
  const mats = useMemo(() => ({
    line: new THREE.LineBasicMaterial({ color, transparent: true, depthWrite: false }),
    dot: new THREE.PointsMaterial({ color, size: 4, sizeAttenuation: false, transparent: true, depthWrite: false }),
  }), [color])
  useFrame(() => {
    const o = opacity()
    mats.line.opacity = 0.55 * o
    mats.dot.opacity = 0.9 * o
  })
  return (
    <>
      <lineSegments geometry={lines} material={mats.line} renderOrder={2} />
      <points geometry={dots} material={mats.dot} renderOrder={2} />
    </>
  )
}

/** Constellation names at the centre of each figure; they pop in when shown */
export function ConstellationNames({ radius, hidden }: { radius: number; hidden?: (p: THREE.Vector3) => boolean }) {
  const centres = useMemo(() => FIGURES.map(f => {
    const c = new THREE.Vector3()
    for (const [ra, d] of f.stars) c.add(eqjUnit(ra, d))
    return { f, p: c.normalize().multiplyScalar(radius) }
  }), [radius])
  return (
    <>
      {centres.map(({ f, p }) => hidden?.(p) ? null : (
        <Html key={f.abbr} center position={p.toArray()} style={{ pointerEvents: 'none' }} zIndexRange={[9, 0]}>
          <span className="block whitespace-nowrap text-center animate-in fade-in zoom-in-50 duration-700">
            <span className="block font-serif text-[13px] font-bold tracking-wide text-[#F6D98B] drop-shadow">{f.name}</span>
            <span className="block text-[10px] text-white/70">constellation of {f.rashi}</span>
          </span>
        </Html>
      ))}
    </>
  )
}
