/**
 * Textures drawn once on a canvas: the zodiac ring and the Rahu/Ketu glyphs.
 * One textured mesh for the whole ring keeps it to a single draw call.
 */
import * as THREE from 'three'
import { NAKSHATRAS, RASHIS } from '@/lib/ephemeris'
import { RING_INNER, RING_OUTER } from './layout'

/**
 * The sidereal zodiac ring, drawn in sidereal longitude (0° = start of Mesha).
 * Mapped onto a RingGeometry laid in the ecliptic; the mesh is then rotated by
 * the ayanamsa so sidereal 0° points at tropical longitude = ayanamsa.
 *
 * RingGeometry UVs are planar, so canvas point (cx + r·cosθ, cy − r·sinθ) lands
 * at local angle θ, which the scene maps to ecliptic longitude θ.
 */
export function zodiacRingTexture(size = 2048): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const cx = size / 2
  const px = (r: number) => (r / RING_OUTER) * (size / 2)   // scene radius → canvas pixels
  const rOut = px(RING_OUTER) - 2
  const rIn = px(RING_INNER)
  const rMid = px(RING_INNER + (RING_OUTER - RING_INNER) * 0.38)  // nakshatra band | rashi band

  const at = (r: number, deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cx - r * Math.sin(a)]
  }
  const spoke = (deg: number, r0: number, r1: number) => {
    ctx.beginPath(); ctx.moveTo(...at(r0, deg)); ctx.lineTo(...at(r1, deg)); ctx.stroke()
  }
  const text = (str: string, r: number, deg: number, font: string, color: string) => {
    const [x, y] = at(r, deg)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.PI / 2 - (deg * Math.PI) / 180)   // text "up" points outward
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(str, 0, 0)
    ctx.restore()
  }

  // Bands
  ctx.fillStyle = 'rgba(139, 30, 30, 0.30)'
  ctx.beginPath(); ctx.arc(cx, cx, rOut, 0, Math.PI * 2); ctx.arc(cx, cx, rMid, 0, Math.PI * 2, true); ctx.fill()
  ctx.fillStyle = 'rgba(40, 30, 60, 0.35)'
  ctx.beginPath(); ctx.arc(cx, cx, rMid, 0, Math.PI * 2); ctx.arc(cx, cx, rIn, 0, Math.PI * 2, true); ctx.fill()

  ctx.strokeStyle = 'rgba(242, 193, 78, 0.55)'
  ctx.lineWidth = 3
  for (const r of [rOut, rMid, rIn]) { ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2); ctx.stroke() }

  // 12 rashis: boundaries, glyph, Sanskrit and English names
  const bandH = rOut - rMid
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.7)'
    ctx.lineWidth = 3
    spoke(i * 30, rMid, rOut)
    const mid = i * 30 + 15
    text(RASHIS[i].glyph + '︎', rMid + bandH * 0.74, mid, `${Math.round(bandH * 0.3)}px serif`, '#F6E7C1')
    text(RASHIS[i].sa, rMid + bandH * 0.44, mid, `600 ${Math.round(bandH * 0.15)}px Georgia, serif`, '#FFFFFF')
    text(RASHIS[i].en, rMid + bandH * 0.22, mid, `${Math.round(bandH * 0.1)}px Arial, sans-serif`, 'rgba(255,255,255,0.7)')
  }
  // 1° ticks along the outer edge, 5° ticks longer
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.45)'
  ctx.lineWidth = 1.5
  for (let d = 0; d < 360; d++) spoke(d, rOut - (d % 5 === 0 ? 14 : 7), rOut)

  // 27 nakshatras: boundaries and names
  const nakH = rMid - rIn
  const span = 360 / 27
  for (let i = 0; i < 27; i++) {
    ctx.strokeStyle = 'rgba(180, 160, 230, 0.6)'
    ctx.lineWidth = 2
    spoke(i * span, rIn, rMid)
    text(NAKSHATRAS[i], rIn + nakH * 0.5, i * span + span / 2, `${Math.round(nakH * 0.2)}px Arial, sans-serif`, 'rgba(225, 215, 255, 0.92)')
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** A glowing glyph (e.g. ☊ Rahu, ☋ Ketu) for use on a sprite */
export function glyphTexture(glyph: string, color: string, size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, color + 'AA')
  g.addColorStop(0.35, color + '44')
  g.addColorStop(1, color + '00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  ctx.font = `bold ${size * 0.5}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = size * 0.08
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(glyph + '︎', size / 2, size / 2 + size * 0.02)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Soft round glow for the Sun halo and node-crossing pulses */
export function glowTexture(color: string, size = 128): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, color + 'FF')
  g.addColorStop(0.25, color + '88')
  g.addColorStop(1, color + '00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
