import { describe, it, expect } from 'vitest'
import { panchangAt, karanaName } from './panchang'

describe('panchangAt', () => {
  it('new moon start: Shukla Pratipada, Kimstughna', () => {
    const p = panchangAt(100, 100.5)
    expect(p.tithi).toEqual({ number: 1, name: 'Pratipada', paksha: 'Shukla' })
    expect(p.karana).toBe('Kimstughna')
  })

  it('Purnima and Amavasya close each paksha', () => {
    expect(panchangAt(0, 179).tithi).toMatchObject({ number: 15, name: 'Purnima', paksha: 'Shukla' })
    expect(panchangAt(0, 181).tithi).toMatchObject({ number: 16, name: 'Pratipada', paksha: 'Krishna' })
    expect(panchangAt(10, 9).tithi).toMatchObject({ number: 30, name: 'Amavasya', paksha: 'Krishna' })
  })

  it('wraps the elongation across 0°', () => {
    expect(panchangAt(350, 5).tithi.number).toBe(2)   // 15° ahead
  })

  it('yoga from the sum of longitudes', () => {
    expect(panchangAt(0, 0).yoga).toEqual({ number: 1, name: 'Vishkambha' })
    expect(panchangAt(200, 159).yoga).toEqual({ number: 27, name: 'Vaidhriti' })   // 359°
  })

  it('nakshatra from the Moon', () => {
    expect(panchangAt(0, 0).nakshatra).toBe(1)
    expect(panchangAt(0, 359.9).nakshatra).toBe(27)
  })
})

describe('karanaName', () => {
  it('cycles movable karanas and ends with the fixed ones', () => {
    expect(karanaName(1)).toBe('Bava')
    expect(karanaName(7)).toBe('Vishti')
    expect(karanaName(8)).toBe('Bava')
    expect(karanaName(56)).toBe('Vishti')
    expect(karanaName(57)).toBe('Shakuni')
    expect(karanaName(59)).toBe('Naga')
  })
})
