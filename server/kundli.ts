/**
 * Proxy for the Akashvani Partner API (POST /chart).
 *
 * The browser posts birth details here; this handler attaches the secret
 * API key server-side, so the key never reaches the browser. Served by the
 * Cloudflare Worker.
 *
 * AKASHVANI_API_URL is the partner base, e.g.
 * https://api-astro.blanxer.tech/api/v1/partner
 */

export interface KundliEnv {
  AKASHVANI_API_URL?: string
  AKASHVANI_API_KEY?: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max

const isNum = (v: unknown, limit: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit

/** API error codes caused by the visitor's input, in words a visitor can act on. */
const INPUT_ERRORS: Record<string, string> = {
  INVALID_BODY:    'Some birth details are missing or invalid. Please check the form.',
  INVALID_BIRTH:   'That date or time does not exist. Please check the date of birth.',
  INVALID_PLACE:   'We could not work out the timezone for this place. Please check the coordinates.',
  BS_OUT_OF_RANGE: 'This Nepali (BS) date is outside the supported range. Please enter the date in AD instead.',
}

/** YYYY-MM-DD of an instant on the wall calendar of `tz`. */
const localDate = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

const previousDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/**
 * The panchang of the Vedic day the birth falls in. That day runs sunrise to
 * sunrise, so a birth before sunrise belongs to the previous civil date.
 * Optional: a failure here (e.g. a key without the `panchang` scope) is logged
 * and the chart is still returned.
 */
async function birthDayPanchang(base: string, key: string, utcInstant: string, tz: string | undefined, lat: number, lon: number) {
  if (!utcInstant || !tz) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchDay = async (date: string): Promise<any> => {
    const q = new URLSearchParams({ date, lat: String(lat), lon: String(lon), tz })
    const res = await fetch(`${base}/panchang?${q}`, { headers: { 'X-API-Key': key } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await res.json().catch(() => null)
    if (!res.ok || !body?.data?.panchang) throw new Error(`${res.status} ${body?.error?.code ?? ''} ${body?.error?.message ?? ''}`)
    return body.data.panchang
  }

  try {
    let day = await fetchDay(localDate(utcInstant, tz))
    if (Date.parse(utcInstant) < Date.parse(day.sunrise)) day = await fetchDay(previousDate(day.date.ad))
    return { date: day.date, vaar: day.vaar, sunrise: day.sunrise, sunset: day.sunset }
  } catch (e) {
    console.error('[kundli] panchang unavailable:', (e as Error).message)
    return null
  }
}

export async function handleKundli(req: Request, env: KundliEnv): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const base = env.AKASHVANI_API_URL?.replace(/\/+$/, '')
  const key  = env.AKASHVANI_API_KEY
  if (!base || !key) {
    console.error('[kundli] AKASHVANI_API_URL or AKASHVANI_API_KEY is not set')
    return json({ error: 'The chart service is not configured yet.' }, 500)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }

  const { calendar, year, month, day, hour, minute, lat, lon, placeName } = body ?? {}
  if (calendar !== 'AD' && calendar !== 'BS')           return json({ error: 'Calendar must be AD or BS.' }, 400)
  if (!isInt(year, 1900, 2100) || !isInt(month, 1, 12) || !isInt(day, 1, 32))
                                                         return json({ error: 'Date of birth is missing or invalid.' }, 400)
  if (!isInt(hour, 0, 23) || !isInt(minute, 0, 59))      return json({ error: 'Time of birth is missing or invalid.' }, 400)
  if (!isNum(lat, 90) || !isNum(lon, 180))               return json({ error: 'Place of birth is missing or invalid.' }, 400)

  const name = typeof placeName === 'string' && placeName.trim() ? placeName.trim().slice(0, 200) : undefined

  let res: Response
  try {
    res = await fetch(`${base}/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({
        // tzId is left out on purpose: the API resolves the zone from the
        // coordinates, including historical offsets such as Nepal before 1986.
        birth: { calendar, year, month, day, hour, minute, timeConfidence: 'exact', place: { name, lat, lon } },
        include: ['dashas'],
        dashaDepth: 3, // mahadasha → antardasha → pratyantardasha
      }),
    })
  } catch (e) {
    console.error('[kundli] upstream request failed:', (e as Error).message)
    return json({ error: 'The chart service is unreachable. Please try again shortly.' }, 502)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = await res.json().catch(() => null)

  if (!res.ok || !payload?.data) {
    const code: string | undefined = payload?.error?.code
    console.error(`[kundli] upstream ${res.status} ${code ?? ''}: ${payload?.error?.message ?? ''}`)
    if (code && INPUT_ERRORS[code]) return json({ error: INPUT_ERRORS[code] }, 400)
    if (res.status === 429) return json({ error: 'Too many charts are being generated right now. Please try again in a minute.' }, 429)
    return json({ error: 'The chart service could not calculate this chart. Please try again shortly.' }, 502)
  }

  // Pass on only what the page shows (the yogini tree and engine internals stay behind).
  const { chart, currentDasha, dashas, engineVersion } = payload.data
  const panchang = await birthDayPanchang(base, key, chart.utcInstant, chart.place?.tzId, lat, lon)
  return json({
    panchang,
    engineVersion,
    chart: {
      ayanamsa: chart.ayanamsa,
      utcInstant: chart.utcInstant,
      tzId: chart.place?.tzId,
      lagna: chart.lagna,
      positions: chart.positions,
      vargas: chart.vargas,
    },
    currentDasha: currentDasha?.vimshottari ?? [],
    dashas: dashas?.vimshottari?.periods ?? [],
  })
}
