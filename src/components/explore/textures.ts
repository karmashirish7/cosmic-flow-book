/**
 * Textures drawn once on a canvas: the zodiac belt and the Rahu/Ketu glyphs.
 * One textured mesh for the whole belt keeps it to a single draw call.
 */
import * as THREE from 'three'
import { NAKSHATRAS, RASHIS } from '@/lib/ephemeris'

/** Purva Phalguni → P. Phalguni, Uttara Bhadrapada → U. Bhadrapada, so the belt stays light */
const shortNakshatra = (name: string) => name.replace(/^Purva /, 'P. ').replace(/^Uttara /, 'U. ')

/**
 * The zodiac belt: a light guide along the ecliptic, drawn in sidereal
 * longitude (0° = start of Mesha), so the constellation patterns stay the main
 * thing to see. No filled band: a fine ecliptic line with degree ticks, sign
 * boundaries, each rashi's glyph and Sanskrit name, and small nakshatra names.
 *
 * Seen from inside the sky, longitude increases to the left (eastward when
 * facing south), so canvas x runs from 360° on the left to 0° on the right:
 * x = (1 − λ/360) · width. Top of the canvas is the north ecliptic edge.
 */
export function zodiacBeltTexture(width = 4096, height = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')!
  const x = (lon: number) => (1 - lon / 360) * width
  const mid = height * 0.5                       // the ecliptic itself

  const vline = (lon: number, y0: number, y1: number) => {
    ctx.beginPath(); ctx.moveTo(x(lon), y0); ctx.lineTo(x(lon), y1); ctx.stroke()
  }
  const label = (str: string, lon: number, y: number, font: string, color: string) => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = 6
    ctx.fillText(str, x(lon), y)
    ctx.shadowBlur = 0
  }

  // the ecliptic: a fine line with 1° and 5° ticks
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.65)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(width, mid); ctx.stroke()
  ctx.lineWidth = 1.2
  for (let d = 0; d < 360; d++) vline(d, mid - (d % 5 === 0 ? 9 : 4), mid + (d % 5 === 0 ? 9 : 4))

  // rashi boundaries and labels above the line
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.55)'
    ctx.lineWidth = 2
    vline(i * 30, mid - height * 0.38, mid + height * 0.12)
    const m = i * 30 + 15
    label(RASHIS[i].glyph + '\uFE0E', m, mid - height * 0.27, `${Math.round(height * 0.15)}px serif`, 'rgba(246, 231, 193, 0.9)')
    label(RASHIS[i].sa, m, mid - height * 0.11, `600 ${Math.round(height * 0.075)}px Georgia, serif`, 'rgba(255, 255, 255, 0.85)')
  }

  // nakshatras: short ticks and small names below the line
  const span = 360 / 27
  for (let i = 0; i < 27; i++) {
    ctx.strokeStyle = 'rgba(190, 170, 240, 0.45)'
    ctx.lineWidth = 1.2
    vline(i * span, mid, mid + height * 0.1)
    label(shortNakshatra(NAKSHATRAS[i]), i * span + span / 2, mid + height * 0.07, `${Math.round(height * 0.042)}px Arial, sans-serif`, 'rgba(220, 210, 255, 0.7)')
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
