/**
 * Earth view: the Earth from outside, with the viewer's location pinned, each
 * graha in its true direction, and a line from Earth through each graha out to
 * the constellation behind it on the celestial sphere.
 *
 * Scene axes: the ecliptic is the XZ plane and +Y the north ecliptic pole, so
 * an ecliptic vector (x, y, z) is drawn at (x, z, −y). Distances to grahas are
 * log-compressed so all stay in view; directions are exact.
 */
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import {
  MOON_INCLINATION, PLANETS, RASHIS, ayanamsa, earthToEcliptic, fmtDeg, geocentric, observerEcliptic,
  rahuLongitude, type PlanetKey, type Snapshot,
} from '@/lib/ephemeris'
import * as A from 'astronomy-engine'
import { ConstellationNames, StarNames, StarPoints, ZodiacFigures } from './celestial'
import { RAD, beltGeometry, eclPoint } from './geometry'
import {
  KETU_COLOR, LAGNA_COLOR, PLANET_COLOR, RAHU_COLOR, RASHI_SA, applyMatrix, rotationMatrix,
  type Selectable, type Sim,
} from './shared'
import { glowTexture, glyphTexture, zodiacBeltTexture } from './textures'

const R_EARTH = 2.8
const R_SPHERE = 72        // celestial sphere: stars, constellations, zodiac belt
const BAND = 7
const MOON_ORBIT = 5.2

/** Ecliptic (x, y, z) → scene (x, z, −y) */
const S = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)
const S_INV = S.clone().invert()
const toScene = (v: [number, number, number]) => new THREE.Vector3(v[0], v[2], -v[1])

const SIZE: Record<PlanetKey, number> = {
  sun: 1.3, moon: 0.55, mercury: 0.24, venus: 0.32, mars: 0.28,
  jupiter: 0.7, saturn: 0.6, uranus: 0.42, neptune: 0.4, pluto: 0.16,
}
/** Log-compressed distance from Earth; the Moon sits on its drawn orbit */
const distance = (key: PlanetKey, au: number) => key === 'moon' ? MOON_ORBIT : 7.5 + 6.5 * Math.log2(1 + au)

// ─── Per-frame state ──────────────────────────────────────────────────────────

interface Frame {
  sidMatrix: THREE.Matrix4     // sidereal ecliptic → scene
  eqjMatrix: THREE.Matrix4     // J2000 equator → scene
  earthMatrix: THREE.Matrix4   // Earth's surface (mesh frame) → scene
  dir: Record<PlanetKey, THREE.Vector3>
  pos: Record<PlanetKey, THREE.Vector3>
  sunDir: THREE.Vector3
  pin: THREE.Vector3
  rahuSid: number
}

function useEarthFrame(sim: MutableRefObject<Sim>) {
  const frame = useRef<Frame>({
    sidMatrix: new THREE.Matrix4(), eqjMatrix: new THREE.Matrix4(), earthMatrix: new THREE.Matrix4(),
    dir: Object.fromEntries(PLANETS.map(p => [p.key, new THREE.Vector3()])) as Record<PlanetKey, THREE.Vector3>,
    pos: Object.fromEntries(PLANETS.map(p => [p.key, new THREE.Vector3()])) as Record<PlanetKey, THREE.Vector3>,
    sunDir: new THREE.Vector3(1, 0, 0), pin: new THREE.Vector3(), rahuSid: 0,
  })
  const last = useRef({ time: NaN, observer: null as unknown, nodeType: '' })

  useFrame((_, dt) => { sim.current.time += dt * 1000 * sim.current.speed }, -2)

  // Recompute when time has moved 2 s (the Earth turns ~0.008° in that) or settings change
  useFrame(() => {
    const s = sim.current
    const l = last.current
    if (Math.abs(s.time - l.time) < 2000 && s.observer === l.observer && s.nodeType === l.nodeType) return
    Object.assign(l, { time: s.time, observer: s.observer, nodeType: s.nodeType })

    const date = new Date(s.time)
    const f = frame.current
    const ayan = ayanamsa(date)
    f.sidMatrix = S.clone().multiply(new THREE.Matrix4().makeRotationZ(ayan * RAD))
    f.eqjMatrix = S.clone().multiply(rotationMatrix(A.Rotation_EQJ_ECT(A.MakeTime(date)).rot))
    f.earthMatrix = S.clone().multiply(rotationMatrix(earthToEcliptic(date).rot)).multiply(S_INV)
    for (const p of PLANETS) {
      const g = geocentric(p.body, date)
      f.dir[p.key].copy(toScene(g.vec)).normalize()
      f.pos[p.key].copy(f.dir[p.key]).multiplyScalar(distance(p.key, g.distAU))
    }
    f.sunDir.copy(f.dir.sun)
    f.pin.copy(toScene(observerEcliptic(date, s.observer))).multiplyScalar(R_EARTH)
    f.rahuSid = (rahuLongitude(date, s.nodeType) - ayan + 360) % 360
  }, -1)

  return frame
}

// ─── The Earth ────────────────────────────────────────────────────────────────

const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
const EARTH_FRAG = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float light = dot(normalize(vNormal), uSun);
    float day = smoothstep(-0.12, 0.18, light);               // soft terminator
    vec3 dayCol = texture2D(uDay, vUv).rgb * (0.25 + 0.95 * max(light, 0.0));
    vec3 nightCol = texture2D(uNight, vUv).rgb * vec3(1.0, 0.85, 0.6) * 1.3;
    gl_FragColor = vec4(mix(nightCol, dayCol, day), 1.0);
    #include <colorspace_fragment>
  }`

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
    float lit = 0.25 + 0.75 * smoothstep(-0.3, 0.4, dot(vNormal, uSun));
    gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * rim * lit, rim * lit);
  }`

const EARTH_MAPS = ['/textures/earth/day.jpg', '/textures/earth/night.jpg']
// Fetch the maps as soon as Explore loads, so switching to the Sky view never waits on them
useLoader.preload(THREE.TextureLoader, EARTH_MAPS)

function Earth({ frame, observerName }: { frame: MutableRefObject<Frame>; observerName: string }) {
  const [dayMap, nightMap] = useLoader(THREE.TextureLoader, EARTH_MAPS)
  useMemo(() => { for (const t of [dayMap, nightMap]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8 } }, [dayMap, nightMap])
  const group = useRef<THREE.Group>(null)
  const pin = useRef<THREE.Group>(null)
  const uniforms = useMemo(() => ({ uDay: { value: dayMap }, uNight: { value: nightMap }, uSun: { value: new THREE.Vector3(1, 0, 0) } }), [dayMap, nightMap])
  const atmo = useMemo(() => ({ uSun: { value: new THREE.Vector3(1, 0, 0) } }), [])

  useFrame(() => {
    const f = frame.current
    applyMatrix(group.current, f.earthMatrix)
    uniforms.uSun.value.copy(f.sunDir)
    atmo.uSun.value.copy(f.sunDir)
    if (pin.current) {
      // the pin stands on the surface, pointing straight up from it
      pin.current.position.copy(f.pin)
      pin.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), f.pin.clone().normalize())
    }
  })

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[R_EARTH, 96, 64]} />
          <shaderMaterial vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} uniforms={uniforms} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[R_EARTH * 1.06, 64, 48]} />
        <shaderMaterial vertexShader={ATMO_VERT} fragmentShader={ATMO_FRAG} uniforms={atmo}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide} />
      </mesh>
      {/* The viewer's location */}
      <group ref={pin}>
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.07, 0.42, 16]} />
          <meshBasicMaterial color="#E53935" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.54, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color="#FF5252" toneMapped={false} />
        </mesh>
        <Html center position={[0, 0.9, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[25, 0]}>
          <span className="whitespace-nowrap rounded bg-[#E53935] px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
            You · {observerName}
          </span>
        </Html>
      </group>
    </>
  )
}

// ─── Celestial sphere: stars, constellations, zodiac belt, nodes ──────────────

function Sky({ frame, snap, names, onSelect }: {
  frame: MutableRefObject<Frame>
  snap: Snapshot
  names: boolean
  onSelect: (k: Selectable) => void
}) {
  const stars = useRef<THREE.Group>(null)
  const sid = useRef<THREE.Group>(null)
  const nodes = useRef<THREE.Group>(null)
  const tex = useMemo(() => zodiacBeltTexture(), [])
  const belt = useMemo(() => beltGeometry(R_SPHERE * 0.99, BAND), [])
  useEffect(() => () => { tex.dispose(); belt.dispose() }, [tex, belt])
  const rahuTex = useMemo(() => glyphTexture('☊', RAHU_COLOR), [])
  const ketuTex = useMemo(() => glyphTexture('☋', KETU_COLOR), [])

  const moonOrbit = useMemo(() => {
    const pts: [number, number, number][] = []
    const i = MOON_INCLINATION * RAD
    for (let k = 0; k <= 128; k++) {
      const u = (k / 128) * Math.PI * 2
      pts.push([Math.cos(u) * MOON_ORBIT, Math.sin(u) * Math.cos(i) * MOON_ORBIT, Math.sin(u) * Math.sin(i) * MOON_ORBIT])
    }
    return pts
  }, [])

  useFrame(() => {
    const f = frame.current
    applyMatrix(stars.current, f.eqjMatrix)
    applyMatrix(sid.current, f.sidMatrix)
    if (nodes.current) nodes.current.rotation.z = f.rahuSid * RAD
  })

  const season = snap.eclipseSeason.active
  const axisColor = season ? '#F2C14E' : '#B9A8E8'
  const R = R_SPHERE * 0.98
  return (
    <>
      <group ref={stars}>
        <StarPoints radius={R_SPHERE} opacity={() => 1} scale={0.9} />
        <ZodiacFigures radius={R_SPHERE * 0.995} opacity={() => 1} />
        {names && <ConstellationNames radius={R_SPHERE * 0.99} />}
        {names && <StarNames radius={R_SPHERE} />}
      </group>

      <group ref={sid}>
        <mesh geometry={belt} renderOrder={2}>
          <meshBasicMaterial map={tex} transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* Rashi names pop up in this view */}
        {names && RASHIS.map((r, i) => (
          <Html key={r.sa} center position={eclPoint(i * 30 + 15, BAND + 3, R_SPHERE * 0.99)} style={{ pointerEvents: 'none' }} zIndexRange={[12, 0]}>
            <span className="block whitespace-nowrap rounded-full bg-[#8B1E1E]/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow animate-in fade-in zoom-in-50 duration-500"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              {r.glyph}&#xFE0E; {r.sa} · {r.en}
            </span>
          </Html>
        ))}

        {/* Lagna: the rising point of the zodiac for the viewer's place */}
        <group position={eclPoint(snap.lagna.sidereal, BAND + 1, R_SPHERE * 0.985)}>
          <mesh><sphereGeometry args={[0.8, 16, 16]} /><meshBasicMaterial color={LAGNA_COLOR} toneMapped={false} /></mesh>
          <Html center position={[0, 0, -2.6]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
            <span className="whitespace-nowrap rounded bg-[#F2C14E] px-1.5 py-0.5 text-[10px] font-bold text-black">
              Lagna {fmtDeg(snap.lagna.degree)} {RASHI_SA[snap.lagna.rashi]}
            </span>
          </Html>
        </group>

        {/* Rahu–Ketu axis through Earth, and the Moon's orbit tilted about it (+x = Rahu) */}
        <group ref={nodes}>
          <Line points={[[R, 0, 0], [-R, 0, 0]]} color={axisColor} lineWidth={season ? 2 : 1.2} dashed dashSize={0.9} gapSize={0.6} transparent opacity={0.85} />
          <Line points={moonOrbit} color="#CFC6FF" lineWidth={1.4} transparent opacity={0.7} />
          {(['rahu', 'ketu'] as const).map(k => (
            <group key={k} position={[k === 'rahu' ? R : -R, 0, 0]}>
              <sprite scale={[3.6, 3.6, 1]} onClick={e => { e.stopPropagation(); onSelect(k) }}>
                <spriteMaterial map={k === 'rahu' ? rahuTex : ketuTex} transparent depthWrite={false} toneMapped={false} />
              </sprite>
              <Html center position={[0, 0, -2.8]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
                <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: (k === 'rahu' ? RAHU_COLOR : KETU_COLOR) + 'D0' }}>
                  {k === 'rahu' ? 'Rahu' : 'Ketu'} {fmtDeg(snap.nodes[k].degree)} {RASHI_SA[snap.nodes[k].rashi]} ℞
                </span>
              </Html>
            </group>
          ))}
        </group>
      </group>
    </>
  )
}

// ─── Grahas and their sight lines ─────────────────────────────────────────────

/** Lines from Earth through each graha out to the celestial sphere, where its constellation lies */
function SightLines({ frame, selected }: { frame: MutableRefObject<Frame>; selected: Selectable | null }) {
  const { geom, ends } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PLANETS.length * 6), 3))
    const col = new Float32Array(PLANETS.length * 6)
    PLANETS.forEach((p, i) => {
      const c = new THREE.Color(PLANET_COLOR[p.key])
      col.set([c.r * 0.35, c.g * 0.35, c.b * 0.35, c.r, c.g, c.b], i * 6)   // fainter near Earth
    })
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const e = new THREE.BufferGeometry()
    e.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PLANETS.length * 3), 3))
    e.setAttribute('color', new THREE.BufferAttribute(col.filter((_, i) => i % 6 >= 3), 3))
    return { geom: g, ends: e }
  }, [])
  const mat = useRef<THREE.LineBasicMaterial>(null)

  useFrame(() => {
    const f = frame.current
    const arr = geom.attributes.position.array as Float32Array
    const endArr = ends.attributes.position.array as Float32Array
    PLANETS.forEach((p, i) => {
      const end = f.dir[p.key].clone().multiplyScalar(R_SPHERE * 0.985)
      const start = f.dir[p.key].clone().multiplyScalar(R_EARTH * 1.02)
      arr.set([start.x, start.y, start.z, end.x, end.y, end.z], i * 6)
      endArr.set([end.x, end.y, end.z], i * 3)
    })
    geom.attributes.position.needsUpdate = true
    ends.attributes.position.needsUpdate = true
    if (mat.current) mat.current.opacity = selected ? 0.35 : 0.75
  })

  return (
    <>
      <lineSegments geometry={geom} renderOrder={3}>
        <lineBasicMaterial ref={mat} vertexColors transparent opacity={0.75} depthWrite={false} />
      </lineSegments>
      <points geometry={ends} renderOrder={3}>
        <pointsMaterial size={7} sizeAttenuation={false} vertexColors transparent depthWrite={false} />
      </points>
    </>
  )
}

function Graha({ id, frame, snap, selected, onSelect, names }: {
  id: PlanetKey
  frame: MutableRefObject<Frame>
  snap: Snapshot
  selected: boolean
  onSelect: () => void
  names: boolean
}) {
  const body = useRef<THREE.Group>(null)
  const endLabel = useRef<THREE.Group>(null)
  const glow = useMemo(() => glowTexture(PLANET_COLOR[id]), [id])
  const state = snap.planets.find(p => p.key === id)!
  useFrame(() => {
    const f = frame.current
    body.current?.position.copy(f.pos[id])
    endLabel.current?.position.copy(f.dir[id]).multiplyScalar(R_SPHERE * 0.985)
  })
  const events = {
    onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect() },
    onPointerOver: () => { document.body.style.cursor = 'pointer' },
    onPointerOut: () => { document.body.style.cursor = '' },
  }
  const r = SIZE[id]
  return (
    <>
      <group ref={body}>
        <mesh {...events}>
          <sphereGeometry args={[r, 32, 32]} />
          {id === 'sun'
            ? <meshBasicMaterial color="#FFF3D6" toneMapped={false} />
            : <meshStandardMaterial color={PLANET_COLOR[id]} roughness={0.9} />}
        </mesh>
        {id === 'saturn' && (
          <mesh rotation={[-Math.PI / 2 + 26.7 * RAD, 0, 0]}>
            <ringGeometry args={[r * 1.3, r * 2.2, 64]} />
            <meshStandardMaterial color="#D9C79A" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        )}
        {id === 'sun' && (
          <sprite scale={[6, 6, 1]}>
            <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        )}
        <Html center position={[0, r + 0.55, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[22, 0]}>
          <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ${selected ? 'bg-[#F2C14E] text-black' : 'bg-black/55 text-white/90'}`}>
            {state.name}{state.retrograde && id !== 'sun' && id !== 'moon' ? ' ℞' : ''}
          </span>
        </Html>
      </group>
      {/* Where the sight line lands: the graha's rashi and degree against the stars */}
      {(names || selected) && (
        <group ref={endLabel}>
          <Html center position={[0, -2.2, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[18, 0]}>
            <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] text-white animate-in fade-in zoom-in-75 duration-500"
              style={{ background: PLANET_COLOR[id] + '55', border: `1px solid ${PLANET_COLOR[id]}` }}>
              {state.name} → {RASHI_SA[state.rashi]} {fmtDeg(state.degree)}
            </span>
          </Html>
        </group>
      )}
    </>
  )
}

function SunLight({ frame }: { frame: MutableRefObject<Frame> }) {
  const light = useRef<THREE.DirectionalLight>(null)
  useFrame(() => { light.current?.position.copy(frame.current.sunDir).multiplyScalar(100) })
  return <directionalLight ref={light} intensity={2.6} color="#FFF6E8" />
}

// ─── Zoom transition ──────────────────────────────────────────────────────────

const ease = (k: number) => k * k * (3 - 2 * k)

/**
 * Switching views: 'in' starts just above the viewer's pin and pulls back to
 * `home` (zooming out into space); 'out' dives toward the pin (zooming in to
 * the ground) before the other view takes over.
 */
function CameraDirector({ frame, transition, home, onDone, sim }: {
  frame: MutableRefObject<Frame>
  transition: 'in' | 'out' | null
  home: [number, number, number]
  onDone: () => void
  sim: MutableRefObject<Sim>
}) {
  const camera = useThree(s => s.camera)
  const controls = useThree(s => s.controls) as OrbitControlsImpl | null
  const anim = useRef<{ start: number; from: THREE.Vector3; kind: 'in' | 'out' } | null>(null)

  useEffect(() => {
    if (!transition) return
    if (sim.current.reducedMotion) { onDone(); return }
    anim.current = { start: -1, from: camera.position.clone(), kind: transition }
    // run once per transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition])

  useFrame(({ clock }) => {
    const a = anim.current
    const pin = frame.current.pin
    if (!a || pin.lengthSq() === 0) return
    if (a.start < 0) a.start = clock.elapsedTime
    const secs = a.kind === 'in' ? 2.0 : 1.4
    const k = Math.min(1, (clock.elapsedTime - a.start) / secs)
    const overPin = pin.clone().normalize().multiplyScalar(R_EARTH * 1.25)
    const homeV = new THREE.Vector3(...home)
    if (a.kind === 'in') camera.position.lerpVectors(overPin, homeV, ease(k))
    else camera.position.lerpVectors(a.from, overPin, ease(k))
    if (controls) {
      controls.enabled = k >= 1
      controls.target.set(0, 0, 0)
    }
    camera.lookAt(0, 0, 0)
    if (k >= 1) {
      anim.current = null
      controls?.update()
      onDone()
    }
  })
  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export default function EarthScene({ sim, snap, selected, onSelect, names, observerName, transition, home, onTransitionEnd }: {
  sim: MutableRefObject<Sim>
  snap: Snapshot
  selected: Selectable | null
  onSelect: (k: Selectable) => void
  names: boolean
  observerName: string
  transition: 'in' | 'out' | null
  home: [number, number, number]
  onTransitionEnd: () => void
}) {
  const frame = useEarthFrame(sim)
  return (
    <>
      <color attach="background" args={['#03040A']} />
      <ambientLight intensity={0.06} />
      <SunLight frame={frame} />
      <Sky frame={frame} snap={snap} names={names} onSelect={onSelect} />
      <Earth frame={frame} observerName={observerName} />
      <SightLines frame={frame} selected={selected} />
      {PLANETS.map(p => (
        <Graha key={p.key} id={p.key} frame={frame} snap={snap} selected={selected === p.key}
          onSelect={() => onSelect(p.key)} names={names} />
      ))}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={3} maxDistance={64} target={[0, 0, 0]} />
      <CameraDirector frame={frame} transition={transition} home={home} onDone={onTransitionEnd} sim={sim} />
    </>
  )
}
