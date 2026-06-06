import type { IncomingMessage, ServerResponse } from 'http'

function readBody(req: IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) })
  res.end(json)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    // Dynamic imports so a native-module load failure (e.g. swisseph binary mismatch
    // on Vercel Linux) is caught here instead of crashing the function before the
    // handler runs and producing an empty response body.
    const [
      { calculateChart, parseTimezone, localToUTC },
      { buildChartSummary },
      { getPlanetDignity },
      { buildDashaTree, getCurrentDasha, serializeDashaTree },
    ] = await Promise.all([
      import('../server/astrology.js'),
      import('../server/knowledge.js'),
      import('../server/dignity.js'),
      import('../server/dasha.js'),
    ])

    const body = await readBody(req)
    const { birthDate, birthTime, birthLat, birthLon, timezone, name, birthPlace } = body

    if (!birthDate || !birthTime || !birthLat || !birthLon) {
      sendJson(res, 400, { error: 'Missing required fields: birthDate, birthTime, birthLat, birthLon' })
      return
    }

    const [year, month, day] = birthDate.split('-').map(Number)
    const tz       = timezone ?? '+05:30'
    const tzOffset = parseTimezone(tz)
    const { utcHour, dayOffset } = localToUTC(birthTime, tzOffset)

    const calc = calculateChart({
      year, month, day: day + dayOffset,
      utcHour,
      lat: parseFloat(birthLat),
      lon: parseFloat(birthLon),
    })

    const CLASSICAL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
    const dignity: Record<string, string> = {}
    for (const p of CLASSICAL) {
      if (calc.planets[p]) dignity[p] = getPlanetDignity(p, calc.planets[p].sign)
    }

    const graded = CLASSICAL.map(p => ({ planet: p, deg: calc.planets[p]?.degrees ?? 0 }))
    graded.sort((a, b) => b.deg - a.deg)
    const atmakaraka = graded[0]?.planet ?? ''
    const darakaraka = graded[graded.length - 1]?.planet ?? ''

    const moonLon   = calc.planets['Moon']?.longitude ?? 0
    const birthDt   = new Date(`${birthDate}T${birthTime}`)
    const dashaTree = buildDashaTree(birthDt, moonLon)
    const currentDasha = getCurrentDasha(dashaTree)
    const summary   = buildChartSummary(calc, dashaTree, currentDasha)

    sendJson(res, 200, {
      name:         name ?? 'Native',
      birthDate,
      birthTime,
      birthPlace:   birthPlace ?? '',
      timezone:     tz,
      lagnaSign:    calc.lagnaSign,
      lagna:        calc.lagna,
      planets:      calc.planets,
      houseNumbers: calc.houseNumbers,
      ayanamsa:     calc.ayanamsa,
      dignity,
      atmakaraka,
      darakaraka,
      currentDasha,
      dashaTree:    serializeDashaTree(dashaTree),
      summary,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chart calculation failed'
    sendJson(res, 500, { error: message })
  }
}
