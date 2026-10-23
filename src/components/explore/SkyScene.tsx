/**
 * The 3D sky. Everything that moves reads one shared simulation ref and a
 * per-frame position cache, so animation never re-renders React.
 */
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  AU_KM, MOON_INCLINATION, PLANETS, ayanamsa, fmtDeg, orbitPath, rahuLongitude, scenePositions,
  type NodeKey, type NodeType, type PlanetKey, type Snapshot, type Vec3,
} from '@/lib/ephemeris'
import {
  BODY_COLOR, BODY_RADIUS, KETU_COLOR, LAGNA_COLOR, MOON_ORBIT_GEO, MOON_ORBIT_HELIO, RAHU_COLOR,
  RING_INNER, RING_OUTER, TRUE_SCALE_MIN_RADIUS, TRUE_SCALE_UNITS_PER_AU,
  ease, ecliptic, geoScene, helioScene, lerp3, toScene, type SceneKey,
} from './layout'
import { glowTexture, glyphTexture, zodiacRingTexture } from './textures'

export type ViewMode = 'geo' | 'helio'
export type Selectable = PlanetKey | NodeKey

/** Mutable simulation state shared by the scene and the controls */
export interface Sim {
  time: number          // simulated instant, ms since epoch
  speed: number         // simulated seconds per real second (0 = paused)
  view: ViewMode        // target view
  blend: number         // 0 heliocentric … 1 geocentric, animated toward `view`
  nodeType: NodeType
  trueScale: boolean
  reducedMotion: boolean
}

/** Positions etc. recomputed when the simulation moves; read by every frame consumer */
interface Frame {
  pos: Record<SceneKey, THREE.Vector3>
  ayan: number          // radians
  rahu: number          // radians, tropical
  blend: number         // eased 0…1
  trueScale: boolean
}

const RAD = Math.PI / 180
const SCENE_KEYS: SceneKey[] = ['sun', 'earth', ...PLANETS.filter(p => p.key !== 'sun').map(p => p.key)]

// ─── Clock and position cache ─────────────────────────────────────────────────

function useFrameCache(sim: MutableRefObject<Sim>) {
  const frame = useRef<Frame>({
    pos: Object.fromEntries(SCENE_KEYS.map(k => [k, new THREE.Vector3()])) as Record<SceneKey, THREE.Vector3>,
    ayan: 0, rahu: 0, blend: 1, trueScale: false,
  })
  const last = useRef({ time: NaN, blend: NaN, trueScale: false, nodeType: '' })

  // Advance simulated time and the view blend (runs first: negative priority)
  useFrame((_, dt) => {
    const s = sim.current
    s.time += dt * 1000 * s.speed
    const target = s.view === 'geo' ? 1 : 0
    if (s.blend !== target) {
      const step = s.reducedMotion ? 1 : dt / 1.6
      s.blend = target > s.blend ? Math.min(target, s.blend + step) : Math.max(target, s.blend - step)
    }
  }, -2)

  // Recompute positions only when something visible changed (live mode: every 5 s of sim time)
  useFrame(() => {
    const s = sim.current
    const l = last.current
    if (Math.abs(s.time - l.time) < 5000 && s.blend === l.blend && s.trueScale === l.trueScale && s.nodeType === l.nodeType) return
    Object.assign(l, { time: s.time, blend: s.blend, trueScale: s.trueScale, nodeType: s.nodeType })

    const date = new Date(s.time)
    const { helio, geo } = scenePositions(date)
    const b = ease(s.blend)
    const trueScale = s.trueScale && b < 0.5
    const earthHelio = helioScene(helio.earth, trueScale)
    const f = frame.current

    for (const p of PLANETS) {
      let h: Vec3
      if (p.key === 'moon') {
        const m = toScene(geo.moon)
        const k = MOON_ORBIT_HELIO / Math.hypot(...m)
        h = [earthHelio[0] + m[0] * k, earthHelio[1] + m[1] * k, earthHelio[2] + m[2] * k]
      } else {
        h = helioScene(helio[p.key], trueScale)
      }
      f.pos[p.key].set(...lerp3(h, geoScene(p.key, geo[p.key]), b))
    }
    f.pos.earth.set(...lerp3(earthHelio, [0, 0, 0], b))
    f.ayan = ayanamsa(date) * RAD
    f.rahu = rahuLongitude(date, s.nodeType) * RAD
    f.blend = b
    f.trueScale = trueScale
  }, -1)

  return frame
}

// ─── Bodies ───────────────────────────────────────────────────────────────────

function Body({ id, frame, selected, onSelect, label }: {
  id: SceneKey
  frame: MutableRefObject<Frame>
  selected: boolean
  onSelect?: () => void
  label: string
}) {
  const group = useRef<THREE.Group>(null)
  const realRadius = id === 'earth' ? 6371 : PLANETS.find(p => p.key === id)!.radiusKm

  useFrame(() => {
    const g = group.current
    if (!g) return
    const f = frame.current
    g.position.copy(f.pos[id])
    const r = f.trueScale
      ? Math.max(TRUE_SCALE_MIN_RADIUS, (realRadius / AU_KM) * TRUE_SCALE_UNITS_PER_AU)
      : BODY_RADIUS[id] * (id === 'moon' ? 0.75 + 0.25 * f.blend : 1)
    g.scale.setScalar(r)
  })

  const isSun = id === 'sun'
  return (
    <group ref={group}>
      <mesh
        onClick={onSelect ? e => { e.stopPropagation(); onSelect() } : undefined}
        onPointerOver={onSelect ? () => { document.body.style.cursor = 'pointer' } : undefined}
        onPointerOut={onSelect ? () => { document.body.style.cursor = '' } : undefined}
      >
        <sphereGeometry args={[1, isSun ? 48 : 32, isSun ? 48 : 32]} />
        {isSun
          ? <meshBasicMaterial color={BODY_COLOR.sun} toneMapped={false} />
          : <meshStandardMaterial color={BODY_COLOR[id]} roughness={0.85} metalness={0} />}
      </mesh>
      {id === 'saturn' && (
        <mesh rotation={[-Math.PI / 2 + 26.7 * RAD, 0, 0]}>
          <ringGeometry args={[1.25, 2.2, 96]} />
          <meshStandardMaterial color="#D9C79A" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
      )}
      {isSun && <SunGlow />}
      <Html center position={[0, 1.6, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
        <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${selected ? 'bg-[#F2C14E] text-black' : 'bg-black/50 text-white/85'}`}>
          {label}
        </span>
      </Html>
    </group>
  )
}

function SunGlow() {
  const tex = useMemo(() => glowTexture('#FFB347'), [])
  return (
    <>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      {/* The Sun is the only real light, so day and night sides (and the Moon's phase) are correct */}
      <pointLight intensity={3.2} decay={0} distance={0} color="#FFF4E0" />
    </>
  )
}

// ─── Orbits (heliocentric view) ───────────────────────────────────────────────

function Orbits({ frame, trueScale, time }: { frame: MutableRefObject<Frame>; trueScale: boolean; time: number }) {
  // Orbits barely change over decades; recompute when scale changes or time jumps a year
  const yearBucket = Math.floor(time / (365.25 * 86_400_000))
  const paths = useMemo(() => {
    const date = new Date(yearBucket * 365.25 * 86_400_000)
    const keys = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const
    return keys.map(k => ({ k, pts: orbitPath(k, date, k === 'pluto' || k === 'neptune' ? 240 : 160).map(v => helioScene(v, trueScale)) }))
  }, [yearBucket, trueScale])

  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = group.current
    if (!g) return
    const fade = 1 - frame.current.blend
    g.visible = fade > 0.02
    g.traverse(o => {
      const m = (o as THREE.Mesh).material as THREE.Material & { opacity?: number }
      if (m && 'opacity' in m) m.opacity = 0.35 * fade
    })
  })

  return (
    <group ref={group}>
      {paths.map(({ k, pts }) => (
        <Line key={k} points={pts} color={k === 'earth' ? '#6FA8FF' : BODY_COLOR[k]} lineWidth={1} transparent opacity={0.35} />
      ))}
    </group>
  )
}

// ─── Zodiac ring, ecliptic disc, lagna, projection ticks (geocentric view) ────

function ZodiacRing({ frame, lagnaLon, eclipseSeason, geoLabels }: { frame: MutableRefObject<Frame>; lagnaLon: number; eclipseSeason: boolean; geoLabels: boolean }) {
  const tex = useMemo(() => zodiacRingTexture(), [])
  useEffect(() => () => tex.dispose(), [tex])
  const ring = useRef<THREE.Group>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const disc = useRef<THREE.MeshBasicMaterial>(null)
  const lagna = useRef<THREE.Group>(null)

  useFrame(() => {
    const f = frame.current
    if (ring.current) ring.current.rotation.y = f.ayan       // sidereal 0° → tropical ayanamsa
    if (ringMat.current) ringMat.current.opacity = 0.45 + 0.55 * f.blend
    if (disc.current) disc.current.opacity = (eclipseSeason ? 0.07 : 0.045) * f.blend
    if (lagna.current) lagna.current.visible = f.blend > 0.5
  })

  const [lx, , lz] = ecliptic(lagnaLon, RING_OUTER + 1.6)
  return (
    <>
      <group ref={ring}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[RING_INNER, RING_OUTER, 256, 1]} />
          <meshBasicMaterial ref={ringMat} map={tex} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {/* The ecliptic plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RING_INNER, 128]} />
        <meshBasicMaterial ref={disc} color={eclipseSeason ? '#F2C14E' : '#9DB4FF'} transparent opacity={0.045} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group ref={lagna} position={[lx, 0, lz]} rotation={[0, (lagnaLon * RAD), 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.9, 2.2, 3]} />
          <meshBasicMaterial color={LAGNA_COLOR} toneMapped={false} />
        </mesh>
        {/* DOM labels ignore 3D visibility, so they follow the view state instead */}
        {geoLabels && (
          <Html center position={[0, 2.2, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
            <span className="whitespace-nowrap rounded bg-[#F2C14E] px-1.5 py-0.5 text-[10px] font-bold text-black">Lagna</span>
          </Html>
        )}
      </group>
    </>
  )
}

/** Faint radial lines projecting each graha onto the zodiac ring (geocentric view) */
function ProjectionTicks({ frame }: { frame: MutableRefObject<Frame> }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PLANETS.length * 6), 3))
    return g
  }, [])
  const mat = useRef<THREE.LineBasicMaterial>(null)

  useFrame(() => {
    const f = frame.current
    const arr = geom.attributes.position.array as Float32Array
    PLANETS.forEach(({ key }, i) => {
      const p = f.pos[key]
      const lon = Math.atan2(-p.z, p.x) / RAD
      const [x, y, z] = ecliptic(lon, RING_INNER)
      arr.set([p.x, p.y, p.z, x, y, z], i * 6)
    })
    geom.attributes.position.needsUpdate = true
    if (mat.current) mat.current.opacity = 0.28 * f.blend
  })

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial ref={mat} color="#F6E7C1" transparent opacity={0.28} depthWrite={false} />
    </lineSegments>
  )
}

// ─── Rahu, Ketu and the Moon's orbit ──────────────────────────────────────────

function NodeGlyph({ glyph, color, scale, onSelect }: { glyph: string; color: string; scale: number; onSelect: () => void }) {
  const tex = useMemo(() => glyphTexture(glyph, color), [glyph, color])
  return (
    <sprite scale={[scale, scale, 1]} onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

const nodeLabel = (n: Snapshot['nodes']['rahu'], name: string) =>
  `${name} · ${fmtDeg(n.degree)} ${['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'][n.rashi]} · ℞`

/**
 * Around Earth: the Moon's orbit tilted 5.145° about the nodal line, its two
 * crossing points with the ecliptic, and (geocentric view) the Rahu–Ketu axis
 * extended to the zodiac ring.
 */
function LunarNodes({ frame, snap, onSelect, geoLabels }: {
  frame: MutableRefObject<Frame>
  snap: Snapshot
  onSelect: (k: NodeKey) => void
  geoLabels: boolean
}) {
  const earthGroup = useRef<THREE.Group>(null)   // at Earth, scaled to the Moon's drawn orbit
  const nodeLine = useRef<THREE.Group>(null)     // rotated so +x points at Rahu
  const axis = useRef<THREE.Group>(null)         // long axis to the ring (geocentric)
  const shortAxis = useRef<THREE.Group>(null)    // short axis around Earth (heliocentric)
  const pulse = useRef<THREE.Sprite>(null)
  const glow = useMemo(() => glowTexture('#FFFFFF'), [])
  const crossing = snap.moonAtNode
  const season = snap.eclipseSeason.active

  const orbit = useMemo(() => {
    const pts: Vec3[] = []
    for (let i = 0; i <= 128; i++) {
      const u = (i / 128) * Math.PI * 2
      pts.push([Math.cos(u), 0, -Math.sin(u)])
    }
    return pts
  }, [])

  useFrame(({ clock }) => {
    const f = frame.current
    const r = MOON_ORBIT_HELIO + (MOON_ORBIT_GEO - MOON_ORBIT_HELIO) * f.blend
    if (earthGroup.current) {
      earthGroup.current.position.copy(f.pos.earth)
      earthGroup.current.scale.setScalar(r)
    }
    if (nodeLine.current) nodeLine.current.rotation.y = f.rahu
    if (axis.current) {
      axis.current.rotation.y = f.rahu
      axis.current.visible = f.blend > 0.5
    }
    if (shortAxis.current) shortAxis.current.visible = f.blend <= 0.5
    if (pulse.current) {
      const s = 0.55 + 0.25 * Math.sin(clock.elapsedTime * 5)
      pulse.current.scale.set(s, s, 1)
    }
  })

  const axisColor = season ? '#F2C14E' : '#B9A8E8'
  return (
    <>
      <group ref={earthGroup}>
        <group ref={nodeLine}>
          {/* Moon's orbit, tilted about the nodal line (+x = Rahu) */}
          <group rotation={[MOON_INCLINATION * RAD, 0, 0]}>
            <Line points={orbit} color="#CFC6FF" lineWidth={1.6} transparent opacity={0.75} />
          </group>
          {/* Crossing points on the ecliptic */}
          {([['rahu', 1, RAHU_COLOR], ['ketu', -1, KETU_COLOR]] as const).map(([k, x, c]) => (
            <mesh key={k} position={[x, 0, 0]} scale={0.07}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color={crossing === k ? '#FFFFFF' : c} toneMapped={false} />
            </mesh>
          ))}
          {crossing && (
            <group position={[crossing === 'rahu' ? 1 : -1, 0, 0]}>
              <sprite ref={pulse}>
                <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending}
                  color={crossing === 'rahu' ? RAHU_COLOR : KETU_COLOR} toneMapped={false} />
              </sprite>
              <Html center position={[0, 0.45, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[30, 0]}>
                <span className="whitespace-nowrap rounded bg-white px-2 py-0.5 text-[10px] font-bold text-black shadow">
                  Moon crossing {crossing === 'rahu' ? 'Rahu' : 'Ketu'}
                </span>
              </Html>
            </group>
          )}
          {/* Heliocentric: a short nodal axis carried with the Earth–Moon system */}
          <group ref={shortAxis}>
            <Line points={[[1.6, 0, 0], [-1.6, 0, 0]]} color={axisColor} lineWidth={1.2} dashed dashSize={0.12} gapSize={0.08} />
            <group position={[1.75, 0, 0]}><NodeGlyph glyph={'☊'} color={RAHU_COLOR} scale={0.55} onSelect={() => onSelect('rahu')} /></group>
            <group position={[-1.75, 0, 0]}><NodeGlyph glyph={'☋'} color={KETU_COLOR} scale={0.55} onSelect={() => onSelect('ketu')} /></group>
          </group>
        </group>
      </group>

      {/* Geocentric: the Rahu–Ketu axis through Earth, extended to the zodiac ring */}
      <group ref={axis}>
        <Line points={[[RING_INNER, 0, 0], [-RING_INNER, 0, 0]]} color={axisColor} lineWidth={season ? 2.2 : 1.3}
          dashed dashSize={0.9} gapSize={0.6} transparent opacity={0.9} />
        <group position={[RING_INNER - 1.6, 0, 0]}>
          <NodeGlyph glyph={'☊'} color={RAHU_COLOR} scale={3.2} onSelect={() => onSelect('rahu')} />
          {geoLabels && <Html center position={[0, 2.4, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
            <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: RAHU_COLOR + 'CC' }}>
              {nodeLabel(snap.nodes.rahu, 'Rahu')}
            </span>
          </Html>}
        </group>
        <group position={[-(RING_INNER - 1.6), 0, 0]}>
          <NodeGlyph glyph={'☋'} color={KETU_COLOR} scale={3.2} onSelect={() => onSelect('ketu')} />
          {geoLabels && <Html center position={[0, 2.4, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
            <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: KETU_COLOR + 'CC' }}>
              {nodeLabel(snap.nodes.ketu, 'Ketu')}
            </span>
          </Html>}
        </group>
      </group>
    </>
  )
}

// ─── Camera: fly to and follow the selection ──────────────────────────────────

function CameraRig({ frame, selected, sim }: { frame: MutableRefObject<Frame>; selected: Selectable | null; sim: MutableRefObject<Sim> }) {
  const controls = useThree(s => s.controls) as OrbitControlsImpl | null
  const camera = useThree(s => s.camera)
  const flyStart = useRef(0)
  const lastTarget = useRef<THREE.Vector3 | null>(null)

  useEffect(() => {
    flyStart.current = performance.now()
    lastTarget.current = null
  }, [selected])

  useFrame(() => {
    if (!controls) return
    const f = frame.current
    let target: THREE.Vector3
    let dist: number
    if (!selected) {
      target = new THREE.Vector3(0, 0, 0)
      dist = 0
    } else if (selected === 'rahu' || selected === 'ketu') {
      const lon = f.rahu + (selected === 'ketu' ? Math.PI : 0)
      const r = f.blend > 0.5 ? RING_INNER - 1.6 : 0
      target = f.pos.earth.clone().add(new THREE.Vector3(Math.cos(lon) * r, 0, -Math.sin(lon) * r))
      dist = f.blend > 0.5 ? 16 : 6
    } else {
      target = f.pos[selected].clone()
      dist = Math.max(3, (f.trueScale ? TRUE_SCALE_MIN_RADIUS : BODY_RADIUS[selected]) * 9)
    }

    const flying = performance.now() - flyStart.current < 1400
    const k = sim.current.reducedMotion ? 1 : 0.08
    if (selected && flying) {
      controls.target.lerp(target, k)
      const dir = camera.position.clone().sub(controls.target).normalize()
      camera.position.lerp(controls.target.clone().add(dir.multiplyScalar(dist)), k)
    } else if (selected) {
      // follow: move camera and target together as the body moves
      if (lastTarget.current) {
        const delta = target.clone().sub(lastTarget.current)
        camera.position.add(delta)
        controls.target.add(delta)
      } else {
        controls.target.copy(target)
      }
    } else if (flying) {
      controls.target.lerp(target, k)
    }
    lastTarget.current = selected ? target : null
    controls.update()
  })
  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export default function SkyScene({ sim, snap, selected, onSelect, trueScale, time, view }: {
  sim: MutableRefObject<Sim>
  snap: Snapshot
  selected: Selectable | null
  onSelect: (k: Selectable | null) => void
  trueScale: boolean
  /** Coarse sim time for things rebuilt rarely (orbit lines) */
  time: number
  view: ViewMode
}) {
  const frame = useFrameCache(sim)
  return (
    <>
      <color attach="background" args={['#04050B']} />
      <ambientLight intensity={0.07} />
      <Stars radius={260} depth={80} count={5000} factor={4} saturation={0} fade speed={0} />

      <ZodiacRing frame={frame} lagnaLon={snap.lagna.lon} eclipseSeason={snap.eclipseSeason.active} geoLabels={view === 'geo'} />
      <ProjectionTicks frame={frame} />
      <Orbits frame={frame} trueScale={trueScale} time={time} />
      <LunarNodes frame={frame} snap={snap} onSelect={onSelect} geoLabels={view === 'geo'} />

      {SCENE_KEYS.map(k => (
        <Body key={k} id={k} frame={frame} selected={selected === k}
          label={k === 'earth' ? 'Earth' : PLANETS.find(p => p.key === k)!.name}
          onSelect={k === 'earth' ? undefined : () => onSelect(k as PlanetKey)} />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1.5} maxDistance={220} />
      <CameraRig frame={frame} selected={selected} sim={sim} />
    </>
  )
}
