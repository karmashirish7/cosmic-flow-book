/**
 * The sky as seen from a place on Earth. The camera sits at the observer and
 * looks around; everything else lies on spheres around it.
 *
 * Scene axes: +X east, +Y zenith, −Z north. astronomy-engine's horizon frame
 * (x north, y west, z zenith) maps to the scene as (−y, z, −x).
 *
 * Three frames are drawn, each through one matrix updated as time moves:
 *   - grahas: topocentric altitude/azimuth, placed directly
 *   - zodiac belt, Rahu/Ketu, the Moon's path, lagna: sidereal ecliptic
 *       → (rotate by ayanamsa) → ecliptic of date → horizon
 *   - catalogue stars: J2000 equator → horizon
 */
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  MOON_INCLINATION, PLANETS, angleDiff, ayanamsa, fmtDeg, horizontal, rahuLongitude, skyRotations,
  type NodeKey, type Observer, type PlanetKey, type Snapshot,
} from '@/lib/ephemeris'
import { glowTexture, glyphTexture, zodiacBeltTexture } from './textures'
import { ConstellationNames, StarNames, StarPoints, ZodiacFigures } from './celestial'
import { RAD, beltGeometry, eclPoint } from './geometry'
import {
  KETU_COLOR, LAGNA_COLOR, PLANET_COLOR, RAHU_COLOR, RASHI_SA, applyMatrix, rotationMatrix,
  type Selectable, type Sim, type View,
} from './shared'

const R_SKY = 100        // ecliptic, grahas, nodes
const R_STARS = 120
const R_GROUND = 90
const BAND = 7           // half-width of the zodiac belt, degrees of ecliptic latitude

/** Unit direction in scene axes for altitude/azimuth (degrees) */
const altAzToScene = (alt: number, az: number, r = 1) => new THREE.Vector3(
  Math.cos(alt * RAD) * Math.sin(az * RAD) * r,
  Math.sin(alt * RAD) * r,
  -Math.cos(alt * RAD) * Math.cos(az * RAD) * r,
)
const sceneToAltAz = (v: THREE.Vector3) => {
  const n = v.clone().normalize()
  return { alt: Math.asin(n.y) / RAD, az: ((Math.atan2(n.x, -n.z) / RAD) + 360) % 360 }
}

/** Scene matrix for a rotation onto the horizon: HOR (x north, y west, z up) → scene (−y, z, −x) */
const HOR_TO_SCENE = new THREE.Matrix4().set(0, -1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 0, 1)
function horMatrix(rot: number[][], pre?: THREE.Matrix4) {
  const out = HOR_TO_SCENE.clone().multiply(rotationMatrix(rot))
  return pre ? out.multiply(pre) : out
}

/** A point on the sidereal ecliptic at the sky radius */
const ecl = (lonDeg: number, latDeg = 0, r = R_SKY) => eclPoint(lonDeg, latDeg, r)

// ─── Per-frame state ──────────────────────────────────────────────────────────

interface Frame {
  eclMatrix: THREE.Matrix4       // sidereal ecliptic → scene
  eqjMatrix: THREE.Matrix4       // J2000 equator → scene
  pos: Record<PlanetKey, THREE.Vector3>
  alt: Record<PlanetKey, number>
  sunDir: THREE.Vector3
  day: number                    // 0 night … 1 full day, from the Sun's altitude
  rahuSid: number                // degrees
  version: number
}

function useSkyFrame(sim: MutableRefObject<Sim>) {
  const frame = useRef<Frame>({
    eclMatrix: new THREE.Matrix4(), eqjMatrix: new THREE.Matrix4(),
    pos: Object.fromEntries(PLANETS.map(p => [p.key, new THREE.Vector3()])) as Record<PlanetKey, THREE.Vector3>,
    alt: Object.fromEntries(PLANETS.map(p => [p.key, 0])) as Record<PlanetKey, number>,
    sunDir: new THREE.Vector3(0, 1, 0), day: 0, rahuSid: 0, version: 0,
  })
  const last = useRef({ time: NaN, observer: null as Observer | null, nodeType: '', daylight: true })

  // Advance simulated time first
  useFrame((_, dt) => { sim.current.time += dt * 1000 * sim.current.speed }, -2)

  // Recompute when the sky has moved: every 2 s of simulated time (the sky turns ~0.008° in that)
  useFrame(() => {
    const s = sim.current
    const l = last.current
    if (Math.abs(s.time - l.time) < 2000 && s.observer === l.observer && s.nodeType === l.nodeType && s.daylight === l.daylight) return
    Object.assign(l, { time: s.time, observer: s.observer, nodeType: s.nodeType, daylight: s.daylight })

    const date = new Date(s.time)
    const f = frame.current
    const ayan = ayanamsa(date)
    const rot = skyRotations(date, s.observer)
    f.eclMatrix = horMatrix(rot.ectToHor.rot, new THREE.Matrix4().makeRotationZ(ayan * RAD))
    f.eqjMatrix = horMatrix(rot.eqjToHor.rot)
    for (const p of PLANETS) {
      const h = horizontal(p.body, date, s.observer)
      f.pos[p.key].copy(altAzToScene(h.alt, h.az, R_SKY))
      f.alt[p.key] = h.alt
    }
    f.sunDir.copy(f.pos.sun).normalize()
    f.day = s.daylight ? THREE.MathUtils.smoothstep(f.alt.sun, -12, 4) : 0
    f.rahuSid = (rahuLongitude(date, s.nodeType) - ayan + 360) % 360
    f.version++
  }, -1)

  return frame
}

/** Apply a frame matrix to a group every frame (matrixAutoUpdate off) */
function useFrameMatrix(frame: MutableRefObject<Frame>, which: 'eclMatrix' | 'eqjMatrix') {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => applyMatrix(ref.current, frame.current[which]))
  return ref
}

// ─── Sky, ground, horizon ─────────────────────────────────────────────────────

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
const SKY_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform float uDay;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 nightZen = vec3(0.012, 0.016, 0.04), nightHor = vec3(0.03, 0.04, 0.09);
    vec3 dayZen = vec3(0.16, 0.36, 0.72), dayHor = vec3(0.62, 0.76, 0.92);
    vec3 col = mix(mix(nightHor, nightZen, pow(h, 0.45)), mix(dayHor, dayZen, pow(h, 0.5)), uDay);
    // twilight warmth near the horizon on the Sun's side
    float twilight = (1.0 - abs(uSun.y * 3.0 - 0.1)) * (1.0 - uDay * 0.6);
    float towardSun = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 3.0);
    col += vec3(0.55, 0.22, 0.08) * max(twilight, 0.0) * towardSun * pow(1.0 - h, 6.0);
    // glow around the Sun
    col += vec3(1.0, 0.85, 0.6) * pow(max(dot(d, uSun), 0.0), 220.0) * 1.2;
    gl_FragColor = vec4(col, 1.0);
  }`

function SkyBackground({ frame }: { frame: MutableRefObject<Frame> }) {
  const uniforms = useMemo(() => ({ uSun: { value: new THREE.Vector3(0, 1, 0) }, uDay: { value: 0 } }), [])
  useFrame(() => {
    uniforms.uSun.value.copy(frame.current.sunDir)
    uniforms.uDay.value = frame.current.day
  })
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[300, 48, 32]} />
      <shaderMaterial vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

/** The horizon is always a line; the land below it shows only when asked for */
function Ground({ land, frame }: { land: boolean; frame: MutableRefObject<Frame> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    // the ground is lit a little by day
    if (mat.current) mat.current.color.setRGB(0.035 + 0.09 * frame.current.day, 0.045 + 0.1 * frame.current.day, 0.03 + 0.05 * frame.current.day)
  })
  const horizon = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= 256; i++) { const v = altAzToScene(0, (i / 256) * 360, R_GROUND - 0.5); pts.push(v.x, v.y, v.z) }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  }, [])
  return (
    <>
      {land && (
        <mesh renderOrder={5}>
          {/* lower hemisphere only */}
          <sphereGeometry args={[R_GROUND, 64, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshBasicMaterial ref={mat} side={THREE.BackSide} />
        </mesh>
      )}
      <lineLoop geometry={horizon} renderOrder={6}>
        <lineBasicMaterial color="#C9A86A" transparent opacity={0.7} />
      </lineLoop>
      {(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const).map((c, i) => (
        <Html key={c} center position={altAzToScene(1.5, i * 45, R_GROUND - 2).toArray()} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
          <span className={`font-semibold ${c.length === 1 ? 'text-sm text-[#F2C14E]' : 'text-[10px] text-white/55'}`}>{c}</span>
        </Html>
      ))}
    </>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────

/** Stars, the zodiac constellations' patterns and their names, turning with the sky */
function Stars({ frame, showNames, land }: { frame: MutableRefObject<Frame>; showNames: boolean; land: boolean }) {
  const group = useFrameMatrix(frame, 'eqjMatrix')
  // names below the horizon hide while the land is shown (re-evaluated each UI tick)
  const hidden = (p: THREE.Vector3) => land && p.clone().applyMatrix4(frame.current.eqjMatrix).y < 0
  return (
    <group ref={group}>
      <StarPoints radius={R_STARS} opacity={() => 1 - 0.97 * frame.current.day} />
      <ZodiacFigures radius={R_STARS * 0.995} opacity={() => 1 - 0.6 * frame.current.day} />
      {showNames && <StarNames radius={R_STARS} hidden={hidden} />}
      {showNames && <ConstellationNames radius={R_STARS} hidden={hidden} />}
    </group>
  )
}

// ─── Zodiac belt, Moon's path, Rahu/Ketu, lagna (sidereal ecliptic frame) ─────

function NodeGlyph({ glyph, color, scale, onSelect }: { glyph: string; color: string; scale: number; onSelect: () => void }) {
  const tex = useMemo(() => glyphTexture(glyph, color), [glyph, color])
  return (
    <sprite scale={[scale, scale, 1]} renderOrder={3} onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

function Zodiac({ frame, snap, onSelect, land }: {
  frame: MutableRefObject<Frame>
  snap: Snapshot
  onSelect: (k: Selectable) => void
  land: boolean
}) {
  const group = useFrameMatrix(frame, 'eclMatrix')
  const nodes = useRef<THREE.Group>(null)      // rotated so +x is Rahu (sidereal)
  const pulse = useRef<THREE.Sprite>(null)
  const beltMat = useRef<THREE.MeshBasicMaterial>(null)
  const tex = useMemo(() => zodiacBeltTexture(), [])
  const geom = useMemo(() => beltGeometry(R_SKY, BAND), [])
  const glow = useMemo(() => glowTexture('#FFFFFF'), [])
  useEffect(() => () => { tex.dispose(); geom.dispose() }, [tex, geom])

  // The Moon's path: a great circle tilted 5.145° about the nodal line, built with Rahu at +x
  const moonPath = useMemo(() => {
    const pts: number[] = []
    const i = MOON_INCLINATION * RAD
    for (let k = 0; k <= 256; k++) {
      const u = (k / 256) * Math.PI * 2
      pts.push(Math.cos(u) * R_SKY, Math.sin(u) * Math.cos(i) * R_SKY, Math.sin(u) * Math.sin(i) * R_SKY)
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  }, [])

  useFrame(({ clock }) => {
    const f = frame.current
    if (nodes.current) nodes.current.rotation.z = f.rahuSid * RAD
    // translucent, so the constellation patterns behind it show through
    if (beltMat.current) beltMat.current.opacity = 0.95 - 0.2 * f.day
    if (pulse.current) {
      const s = 7 + 3 * Math.sin(clock.elapsedTime * 5)
      pulse.current.scale.set(s, s, 1)
    }
  })

  const season = snap.eclipseSeason.active
  const crossing = snap.moonAtNode
  const hideBelow = (sid: number) => {
    // labels on the ecliptic: hide below the horizon while the land is shown
    if (!land) return false
    const v = new THREE.Vector3(...ecl(sid)).applyMatrix4(frame.current.eclMatrix)
    return v.y < 0
  }
  const nodeTag = (k: NodeKey) => {
    const n = snap.nodes[k]
    return `${k === 'rahu' ? 'Rahu ☊' : 'Ketu ☋'} ${fmtDeg(n.degree)} ${RASHI_SA[n.rashi]} ℞`
  }

  return (
    <group ref={group}>
      <mesh geometry={geom} renderOrder={2}>
        <meshBasicMaterial ref={beltMat} map={tex} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Lagna: the ecliptic point rising on the eastern horizon */}
      <group position={ecl(snap.lagna.sidereal, BAND + 1.6)}>
        <mesh>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color={LAGNA_COLOR} toneMapped={false} />
        </mesh>
        <Html center position={[0, 0, 3]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
          <span className="whitespace-nowrap rounded bg-[#F2C14E] px-1.5 py-0.5 text-[10px] font-bold text-black">
            Lagna {fmtDeg(snap.lagna.degree)} {RASHI_SA[snap.lagna.rashi]}
          </span>
        </Html>
      </group>

      <group ref={nodes}>
        <lineLoop geometry={moonPath} renderOrder={2}>
          <lineBasicMaterial color={season ? '#F2C14E' : '#CFC6FF'} transparent opacity={season ? 0.9 : 0.6} depthWrite={false} />
        </lineLoop>
        {(['rahu', 'ketu'] as const).map(k => {
          const x = k === 'rahu' ? R_SKY : -R_SKY
          return (
            <group key={k} position={[x, 0, 0]}>
              {season && (
                <sprite scale={[14, 14, 1]} renderOrder={2}>
                  <spriteMaterial map={glow} color="#F2C14E" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
                </sprite>
              )}
              {crossing === k && (
                <sprite ref={pulse} renderOrder={2}>
                  <spriteMaterial map={glow} color={k === 'rahu' ? RAHU_COLOR : KETU_COLOR} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
                </sprite>
              )}
              <NodeGlyph glyph={k === 'rahu' ? '☊' : '☋'} color={k === 'rahu' ? RAHU_COLOR : KETU_COLOR} scale={5} onSelect={() => onSelect(k)} />
              {!hideBelow(snap.nodes[k].sidereal) && (
                <Html center position={[0, 0, -4.2]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
                  <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ background: (k === 'rahu' ? RAHU_COLOR : KETU_COLOR) + 'D0' }}>
                    {nodeTag(k)}{crossing === k ? ' · Moon crossing' : ''}
                  </span>
                </Html>
              )}
            </group>
          )
        })}
      </group>
    </group>
  )
}

// ─── Grahas ───────────────────────────────────────────────────────────────────

function Graha({ id, frame, snap, selected, onSelect, land }: {
  id: PlanetKey
  frame: MutableRefObject<Frame>
  snap: Snapshot
  selected: boolean
  onSelect: () => void
  land: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const tex = useMemo(() => glowTexture(PLANET_COLOR[id]), [id])
  const state = snap.planets.find(p => p.key === id)!
  useFrame(() => { group.current?.position.copy(frame.current.pos[id]) })

  const below = state.alt < 0
  // brighter grahas draw bigger, like the naked eye sees them
  const glowSize = id === 'sun' ? 22 : id === 'moon' ? 9 : THREE.MathUtils.clamp(4.2 - 0.55 * state.mag, 1.6, 6)
  const events = {
    onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect() },
    onPointerOver: () => { document.body.style.cursor = 'pointer' },
    onPointerOut: () => { document.body.style.cursor = '' },
  }

  return (
    <group ref={group}>
      {id === 'sun' && (
        <mesh {...events} renderOrder={3}>
          <sphereGeometry args={[2.4, 32, 32]} />
          <meshBasicMaterial color="#FFF3D6" toneMapped={false} />
        </mesh>
      )}
      {id === 'moon' && (
        // lit only by the Sun's direction, so the phase is real
        <mesh {...events} renderOrder={3}>
          <sphereGeometry args={[2.2, 48, 48]} />
          <meshStandardMaterial color="#E9E4DA" roughness={1} metalness={0} />
        </mesh>
      )}
      <sprite scale={[glowSize, glowSize, 1]} renderOrder={3} {...(id === 'sun' || id === 'moon' ? {} : events)}>
        <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
          opacity={id === 'moon' ? 0.35 : 1} />
      </sprite>
      {(!below || !land) && (
        <Html center position={[0, -(glowSize / 2 + 1.6), 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
          <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${selected ? 'bg-[#F2C14E] text-black' : below ? 'bg-black/40 text-white/45' : 'bg-black/55 text-white/90'}`}>
            {state.name}{state.retrograde && id !== 'sun' && id !== 'moon' ? ' ℞' : ''}
          </span>
        </Html>
      )}
    </group>
  )
}

function MoonLight({ frame }: { frame: MutableRefObject<Frame> }) {
  const light = useRef<THREE.DirectionalLight>(null)
  useFrame(() => {
    const l = light.current
    if (!l) return
    // a light shining from the Sun's direction onto the Moon
    l.position.copy(frame.current.pos.moon).addScaledVector(frame.current.sunDir, 50)
    l.target.position.copy(frame.current.pos.moon)
    l.target.updateMatrixWorld()
  })
  return <directionalLight ref={light} intensity={3} color="#FFF8EC" />
}

// ─── Looking around ───────────────────────────────────────────────────────────

/**
 * Drag to look around (the sky follows the finger), scroll or pinch to zoom.
 * When `view.follow` is set, the view turns smoothly toward the selection.
 */
function LookControls({ view, frame, selected, sim }: {
  view: MutableRefObject<View>
  frame: MutableRefObject<Frame>
  selected: Selectable | null
  sim: MutableRefObject<Sim>
}) {
  const { camera, gl } = useThree()
  const cam = camera as THREE.PerspectiveCamera

  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map<number, { x: number; y: number }>()
    let pinch = 0
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const v = view.current
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch) v.fov = THREE.MathUtils.clamp(v.fov * (pinch / d), 12, 100)
        pinch = d
        return
      }
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y
      if (Math.abs(dx) + Math.abs(dy) > 1) v.follow = false
      const k = v.fov / el.clientHeight
      v.az = (v.az - dx * k + 360) % 360
      v.alt = THREE.MathUtils.clamp(v.alt + dy * k, -60, 89)
    }
    const up = (e: PointerEvent) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = 0 }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      view.current.fov = THREE.MathUtils.clamp(view.current.fov * (1 + e.deltaY * 0.001), 12, 100)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.style.touchAction = 'none'
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl, view])

  useEffect(() => { if (selected) view.current.follow = true }, [selected, view])

  useFrame(() => {
    const v = view.current
    if (selected && v.follow) {
      const f = frame.current
      const p = selected === 'rahu' || selected === 'ketu'
        ? new THREE.Vector3(...ecl(f.rahuSid + (selected === 'ketu' ? 180 : 0))).applyMatrix4(f.eclMatrix)
        : f.pos[selected]
      const t = sceneToAltAz(p)
      const k = sim.current.reducedMotion ? 1 : 0.08
      v.az = (v.az + angleDiff(t.az, v.az) * k + 360) % 360
      v.alt += (THREE.MathUtils.clamp(t.alt, -60, 89) - v.alt) * k
      v.fov += (Math.min(v.fov, 45) - v.fov) * k
    }
    if (Math.abs(cam.fov - v.fov) > 0.01) { cam.fov = v.fov; cam.updateProjectionMatrix() }
    cam.position.set(0, 0, 0)
    cam.lookAt(altAzToScene(v.alt, v.az))
  })
  return null
}

// ─── Zoom transition ──────────────────────────────────────────────────────────

const WIDE_FOV = 125

/**
 * Switching views: 'out' widens the field of view (zooming out, toward space)
 * before the other view takes over; 'in' arrives wide and narrows to `baseFov`.
 */
function ZoomTransition({ view, transition, baseFov, onDone, sim }: {
  view: MutableRefObject<View>
  transition: 'in' | 'out' | null
  baseFov: number
  onDone: () => void
  sim: MutableRefObject<Sim>
}) {
  const anim = useRef<{ start: number; from: number; to: number; secs: number } | null>(null)
  useEffect(() => {
    if (!transition) return
    if (sim.current.reducedMotion) {
      if (transition === 'in') view.current.fov = baseFov
      onDone()
      return
    }
    anim.current = transition === 'in'
      ? { start: -1, from: WIDE_FOV, to: baseFov, secs: 1.1 }
      : { start: -1, from: view.current.fov, to: WIDE_FOV, secs: 0.7 }
    if (transition === 'in') view.current.fov = WIDE_FOV
    // run once per transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition])

  useFrame(({ clock }) => {
    const a = anim.current
    if (!a) return
    if (a.start < 0) a.start = clock.elapsedTime
    const k = Math.min(1, (clock.elapsedTime - a.start) / a.secs)
    view.current.fov = a.from + (a.to - a.from) * k * k * (3 - 2 * k)
    if (k >= 1) { anim.current = null; onDone() }
  })
  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export default function SkyDome({ sim, view, snap, selected, onSelect, land, starNames, transition, baseFov, onTransitionEnd }: {
  sim: MutableRefObject<Sim>
  view: MutableRefObject<View>
  snap: Snapshot
  selected: Selectable | null
  onSelect: (k: Selectable) => void
  land: boolean
  starNames: boolean
  transition: 'in' | 'out' | null
  baseFov: number
  onTransitionEnd: () => void
}) {
  const frame = useSkyFrame(sim)
  return (
    <>
      <ambientLight intensity={0.04} />
      <MoonLight frame={frame} />
      <SkyBackground frame={frame} />
      <Stars frame={frame} showNames={starNames} land={land} />
      <Zodiac frame={frame} snap={snap} onSelect={onSelect} land={land} />
      {PLANETS.map(p => (
        <Graha key={p.key} id={p.key} frame={frame} snap={snap} selected={selected === p.key}
          onSelect={() => onSelect(p.key)} land={land} />
      ))}
      <Ground land={land} frame={frame} />
      {/* before LookControls, so it applies the animated field of view the same frame */}
      <ZoomTransition view={view} transition={transition} baseFov={baseFov} onDone={onTransitionEnd} sim={sim} />
      <LookControls view={view} frame={frame} selected={selected} sim={sim} />
    </>
  )
}
