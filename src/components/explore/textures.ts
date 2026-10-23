/**
 * Textures drawn once on a canvas: the zodiac belt and the Rahu/Ketu glyphs.
 * One textured mesh for the whole belt keeps it to a single draw call.
 */
import * as THREE from 'three'
import { NAKSHATRAS, RASHIS } from '@/lib/ephemeris'

/**
 * The zodiac belt: a strip along the ecliptic, drawn in sidereal longitude
 * (0° = start of Mesha), mapped onto a band around the sky.
 *
 * Seen from inside the sky, longitude increases to the left (eastward when
 * facing south), so canvas x runs from 360° on the left to 0° on the right:
 * x = (1 − λ/360) · width. Top of the canvas is the north ecliptic edge.
 * Upper 60%: rashis (glyph, Sanskrit, English). Lower 40%: the 27 nakshatras.
 */
export function zodiacBeltTexture(width = 4096, height = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')!
  const x = (lon: number) => (1 - lon / 360) * width
  const split = height * 0.6

  ctx.fillStyle = 'rgba(139, 30, 30, 0.34)'
  ctx.fillRect(0, 0, width, split)
  ctx.fillStyle = 'rgba(40, 30, 70, 0.38)'
  ctx.fillRect(0, split, width, height - split)

  const vline = (lon: number, y0: number, y1: number) => {
    ctx.beginPath(); ctx.moveTo(x(lon), y0); ctx.lineTo(x(lon), y1); ctx.stroke()
  }
  const label = (str: string, lon: number, y: number, font: string, color: string) => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(str, x(lon), y)
  }

  // edges and the ecliptic itself (between the bands)
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.75)'
  ctx.lineWidth = 3
  for (const y of [1.5, split, height - 1.5]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }

  // degree ticks along the ecliptic, longer every 5°
  ctx.lineWidth = 1.5
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.6)'
  for (let d = 0; d < 360; d++) vline(d, split - (d % 5 === 0 ? 22 : 10), split)

  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.8)'
    ctx.lineWidth = 3
    vline(i * 30, 0, split)
    const mid = i * 30 + 15
    label(RASHIS[i].glyph + '\uFE0E', mid, split * 0.3, `${Math.round(split * 0.3)}px serif`, '#F6E7C1')
    label(RASHIS[i].sa, mid, split * 0.62, `600 ${Math.round(split * 0.17)}px Georgia, serif`, '#FFFFFF')
    label(RASHIS[i].en, mid, split * 0.82, `${Math.round(split * 0.1)}px Arial, sans-serif`, 'rgba(255,255,255,0.75)')
  }

  const span = 360 / 27
  const nakH = height - split
  for (let i = 0; i < 27; i++) {
    ctx.strokeStyle = 'rgba(190, 170, 240, 0.7)'
    ctx.lineWidth = 2
    vline(i * span, split, height)
    const words = NAKSHATRAS[i].split(' ')
    const mid = i * span + span / 2
    const font = `${Math.round(nakH * 0.2)}px Arial, sans-serif`
    if (words.length === 1) label(words[0], mid, split + nakH * 0.5, font, 'rgba(230, 220, 255, 0.95)')
    else words.forEach((w, k) => label(w, mid, split + nakH * (0.33 + 0.34 * k), font, 'rgba(230, 220, 255, 0.95)'))
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
