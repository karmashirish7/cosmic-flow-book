/**
 * Divisional charts (vargas) derived from the sidereal longitudes the
 * Akashvani API returns. Rules follow Brihat Parashara Hora Shastra.
 * Signs are 0-indexed here (0 = Aries … 11 = Pisces); callers get 1–12.
 */

export interface Varga {
  key: string
  name: string
  signifies: string
}

export const VARGAS: Varga[] = [
  { key: 'D1',  name: 'Rashi',         signifies: 'Body, overall life' },
  { key: 'D2',  name: 'Hora',          signifies: 'Wealth' },
  { key: 'D3',  name: 'Drekkana',      signifies: 'Siblings, courage' },
  { key: 'D4',  name: 'Chaturthamsa',  signifies: 'Property, fortune' },
  { key: 'D7',  name: 'Saptamsa',      signifies: 'Children' },
  { key: 'D9',  name: 'Navamsa',       signifies: 'Spouse, dharma' },
  { key: 'D10', name: 'Dasamsa',       signifies: 'Career' },
  { key: 'D12', name: 'Dwadasamsa',    signifies: 'Parents' },
  { key: 'D16', name: 'Shodasamsa',    signifies: 'Vehicles, comforts' },
  { key: 'D20', name: 'Vimsamsa',      signifies: 'Spiritual practice' },
  { key: 'D24', name: 'Chaturvimsamsa', signifies: 'Education' },
  { key: 'D27', name: 'Bhamsa',        signifies: 'Strength, stamina' },
  { key: 'D30', name: 'Trimsamsa',     signifies: 'Misfortunes' },
  { key: 'D40', name: 'Khavedamsa',    signifies: 'Maternal legacy' },
  { key: 'D45', name: 'Akshavedamsa',  signifies: 'Paternal legacy' },
  { key: 'D60', name: 'Shashtiamsa',   signifies: 'Past karma' },
]

const ARIES = 0, TAURUS = 1, GEMINI = 2, CANCER = 3, LEO = 4, VIRGO = 5
const LIBRA = 6, SCORPIO = 7, SAGITTARIUS = 8, CAPRICORN = 9, AQUARIUS = 10, PISCES = 11

const mod12 = (n: number) => ((n % 12) + 12) % 12

/** Starting sign by modality: movable / fixed / dual. */
const byModality = (sign: number, movable: number, fixed: number, dual: number) =>
  [movable, fixed, dual][sign % 3]

/** Sign (0–11) a sidereal longitude falls in for the given division. */
export function vargaSign(longitude: number, division: number): number {
  const lon   = ((longitude % 360) + 360) % 360
  const sign  = Math.floor(lon / 30)
  const deg   = lon - sign * 30
  const part  = Math.floor(deg / (30 / division))
  const odd   = sign % 2 === 0   // Aries, Gemini, Leo … are odd signs

  switch (division) {
    case 1:  return sign
    case 2:  return (deg < 15) === odd ? LEO : CANCER   // odd: Sun's hora first; even: Moon's
    case 3:  return mod12(sign + part * 4)
    case 4:  return mod12(sign + part * 3)
    case 7:  return mod12((odd ? sign : sign + 6) + part)
    case 9:  return mod12(Math.floor(lon / (30 / 9)))
    case 10: return mod12((odd ? sign : sign + 8) + part)
    case 12: return mod12(sign + part)
    case 16: return mod12(byModality(sign, ARIES, LEO, SAGITTARIUS) + part)
    case 20: return mod12(byModality(sign, ARIES, SAGITTARIUS, LEO) + part)
    case 24: return mod12((odd ? LEO : CANCER) + part)
    case 27: return mod12(Math.floor(lon / (30 / 27)))
    case 30: return trimsamsa(deg, odd)
    case 40: return mod12((odd ? ARIES : LIBRA) + part)
    case 45: return mod12(byModality(sign, ARIES, LEO, SAGITTARIUS) + part)
    case 60: return mod12(sign + part)
    default: throw new Error(`Unsupported division D${division}`)
  }
}

/** D30 uses unequal spans ruled by Mars, Saturn, Jupiter, Mercury, Venus. */
function trimsamsa(deg: number, odd: boolean): number {
  if (odd) {
    if (deg < 5)  return ARIES
    if (deg < 10) return AQUARIUS
    if (deg < 18) return SAGITTARIUS
    if (deg < 25) return GEMINI
    return LIBRA
  }
  if (deg < 5)  return TAURUS
  if (deg < 12) return VIRGO
  if (deg < 20) return PISCES
  if (deg < 25) return CAPRICORN
  return SCORPIO
}

export interface VargaChart {
  lagnaSign: number                 // 1–12
  houses: Record<string, number>    // planet → whole-sign house 1–12
  signs: Record<string, number>     // planet → sign 1–12
}

export function buildVargaChart(
  division: number,
  lagnaLongitude: number,
  planetLongitudes: Record<string, number>,
): VargaChart {
  const lagna = vargaSign(lagnaLongitude, division)
  const houses: Record<string, number> = {}
  const signs: Record<string, number> = {}
  for (const [planet, lon] of Object.entries(planetLongitudes)) {
    const s = vargaSign(lon, division)
    signs[planet]  = s + 1
    houses[planet] = mod12(s - lagna) + 1
  }
  return { lagnaSign: lagna + 1, houses, signs }
}

export const divisionOf = (key: string) => Number(key.slice(1))
