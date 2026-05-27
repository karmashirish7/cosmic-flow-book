export type Dignity = 'exalted' | 'debilitated' | 'own' | 'moolatrikona' | 'neutral'

const EXALTATION: Record<string, string> = {
  Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo',
  Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
}

const DEBILITATION: Record<string, string> = {
  Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
  Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
}

const MOOLATRIKONA: Record<string, string> = {
  Sun: 'Leo', Moon: 'Taurus', Mars: 'Aries', Mercury: 'Virgo',
  Jupiter: 'Sagittarius', Venus: 'Libra', Saturn: 'Aquarius',
}

const OWN_SIGNS: Record<string, string[]> = {
  Sun:     ['Leo'],
  Moon:    ['Cancer'],
  Mars:    ['Aries', 'Scorpio'],
  Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'],
  Venus:   ['Taurus', 'Libra'],
  Saturn:  ['Capricorn', 'Aquarius'],
}

export function getPlanetDignity(planet: string, sign: string): Dignity {
  if (EXALTATION[planet] === sign)       return 'exalted'
  if (DEBILITATION[planet] === sign)     return 'debilitated'
  if (MOOLATRIKONA[planet] === sign)     return 'moolatrikona'
  if (OWN_SIGNS[planet]?.includes(sign)) return 'own'
  return 'neutral'
}
