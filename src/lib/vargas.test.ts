import { describe, it, expect } from 'vitest'
import { vargaSign, buildVargaChart } from './vargas'

// Signs: 0 Aries … 11 Pisces
describe('vargaSign', () => {
  it('D9 Navamsa: first navamsa of each element starts Aries / Capricorn / Libra / Cancer', () => {
    expect(vargaSign(0 + 1, 9)).toBe(0)        // Aries 1° → Aries
    expect(vargaSign(30 + 1, 9)).toBe(9)       // Taurus 1° → Capricorn
    expect(vargaSign(60 + 1, 9)).toBe(6)       // Gemini 1° → Libra
    expect(vargaSign(90 + 1, 9)).toBe(3)       // Cancer 1° → Cancer
    expect(vargaSign(29.9, 9)).toBe(8)         // Aries last navamsa → Sagittarius
  })

  it('D2 Hora: odd signs Leo then Cancer, even signs Cancer then Leo', () => {
    expect(vargaSign(10, 2)).toBe(4)
    expect(vargaSign(20, 2)).toBe(3)
    expect(vargaSign(40, 2)).toBe(3)
    expect(vargaSign(50, 2)).toBe(4)
  })

  it('D3 Drekkana: sign, 5th, 9th', () => {
    expect(vargaSign(30 + 5, 3)).toBe(1)
    expect(vargaSign(30 + 15, 3)).toBe(5)
    expect(vargaSign(30 + 25, 3)).toBe(9)
  })

  it('D7 and D10 start from 7th / 9th for even signs', () => {
    expect(vargaSign(30 + 1, 7)).toBe(7)       // Taurus → Scorpio
    expect(vargaSign(30 + 1, 10)).toBe(9)      // Taurus → Capricorn
    expect(vargaSign(1, 10)).toBe(0)
  })

  it('D30 Trimsamsa unequal spans', () => {
    expect(vargaSign(3, 30)).toBe(0)           // odd 0–5 Aries
    expect(vargaSign(12, 30)).toBe(8)          // odd 10–18 Sagittarius
    expect(vargaSign(30 + 6, 30)).toBe(5)      // even 5–12 Virgo
    expect(vargaSign(30 + 29, 30)).toBe(7)     // even 25–30 Scorpio
  })

  it('D16 / D45 by modality', () => {
    expect(vargaSign(30 + 0.5, 16)).toBe(4)    // fixed → Leo
    expect(vargaSign(60 + 0.5, 16)).toBe(8)    // dual → Sagittarius
    expect(vargaSign(60 + 0.5, 20)).toBe(4)    // D20 dual → Leo
  })

  it('D60 counts from the sign itself', () => {
    expect(vargaSign(30 + 0.4, 60)).toBe(1)
    expect(vargaSign(30 + 29.9, 60)).toBe(0)   // Taurus + 59 → Aries
  })

  it('handles longitudes outside 0–360', () => {
    expect(vargaSign(-1, 1)).toBe(11)
    expect(vargaSign(361, 9)).toBe(0)
  })
})

describe('buildVargaChart', () => {
  it('places planets in whole-sign houses from the varga lagna', () => {
    const c = buildVargaChart(1, 95, { Sun: 125, Moon: 80 })
    expect(c.lagnaSign).toBe(4)
    expect(c.houses).toEqual({ Sun: 2, Moon: 12 })
    expect(c.signs).toEqual({ Sun: 5, Moon: 3 })
  })
})
