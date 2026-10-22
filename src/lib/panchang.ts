/**
 * Panchang limbs at an exact moment, from the sidereal Sun and Moon
 * longitudes the Akashvani API returns for the birth chart. Same definitions
 * and name tables as the Akashvani engine (src/engine/panchang), which itself
 * reports the limbs only as of sunrise:
 *   tithi     = (λmoon − λsun) / 12°
 *   karana    = (λmoon − λsun) / 6°
 *   yoga      = (λsun + λmoon) / 13°20′   (sidereal)
 *   nakshatra = λmoon / 13°20′            (sidereal)
 */

export const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
]

export const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarman', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
]

const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti']

/** Karana of a 0-based half-tithi (0 Kimstughna · 1–56 movable cycle · 57–59 fixed). */
export function karanaName(halfTithi: number): string {
  if (halfTithi === 0) return 'Kimstughna'
  if (halfTithi <= 56) return MOVABLE_KARANAS[(halfTithi - 1) % 7]
  return ['Shakuni', 'Chatushpada', 'Naga'][halfTithi - 57]
}

const norm360 = (x: number) => ((x % 360) + 360) % 360
const NAK_SPAN = 360 / 27

export interface MomentPanchang {
  tithi: { number: number; name: string; paksha: 'Shukla' | 'Krishna' }
  nakshatra: number   // 1 = Ashwini … 27 = Revati
  yoga: { number: number; name: string }
  karana: string
}

export function panchangAt(sunLongitude: number, moonLongitude: number): MomentPanchang {
  const elongation = norm360(moonLongitude - sunLongitude)
  const tithi = Math.floor(elongation / 12) + 1
  const yoga = Math.floor(norm360(sunLongitude + moonLongitude) / NAK_SPAN) + 1
  return {
    tithi: { number: tithi, name: TITHI_NAMES[tithi - 1], paksha: tithi <= 15 ? 'Shukla' : 'Krishna' },
    nakshatra: Math.floor(norm360(moonLongitude) / NAK_SPAN) + 1,
    yoga: { number: yoga, name: YOGA_NAMES[yoga - 1] },
    karana: karanaName(Math.floor(elongation / 6)),
  }
}
