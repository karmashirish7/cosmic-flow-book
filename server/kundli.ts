/**
 * Proxy for the Akashvani calculation API.
 *
 * The browser posts birth details here; this handler attaches the secret
 * API key server-side and calls Akashvani's /api/chart and /api/dasha.
 * The key never reaches the browser. Served by the Cloudflare Worker.
 */

export interface KundliEnv {
  AKASHVANI_API_URL?: string
  AKASHVANI_API_KEY?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/
const TZ_RE   = /^[+-]\d{1,2}:\d{2}$/

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
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

  const { birthDate, birthTime, timezone } = body ?? {}
  const lat = Number(body?.lat)
  const lon = Number(body?.lon)

  if (typeof birthDate !== 'string' || !DATE_RE.test(birthDate)) return json({ error: 'Date of birth is missing or invalid.' }, 400)
  if (typeof birthTime !== 'string' || !TIME_RE.test(birthTime)) return json({ error: 'Time of birth is missing or invalid.' }, 400)
  if (typeof timezone !== 'string' || !TZ_RE.test(timezone))     return json({ error: 'Timezone must look like +05:45.' }, 400)
  if (!Number.isFinite(lat) || Math.abs(lat) > 90)               return json({ error: 'Latitude is invalid.' }, 400)
  if (!Number.isFinite(lon) || Math.abs(lon) > 180)              return json({ error: 'Longitude is invalid.' }, 400)

  const payload = JSON.stringify({ birthDate, birthTime, timezone, lat, lon })
  const call = (path: string) => fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: payload,
  })

  try {
    const [chartRes, dashaRes] = await Promise.all([call('/api/chart'), call('/api/dasha')])

    for (const res of [chartRes, dashaRes]) {
      if (res.ok) continue
      const detail = await res.text()
      console.error(`[kundli] upstream ${res.url} → ${res.status}: ${detail.slice(0, 300)}`)
      // Validation errors are safe to show; anything else stays generic.
      if (res.status === 400) {
        try { return json({ error: JSON.parse(detail).error ?? 'Invalid birth details.' }, 400) } catch { /* fall through */ }
      }
      return json({ error: 'The chart service could not calculate this chart. Please try again shortly.' }, 502)
    }

    const { ok: _chartOk, ...chart } = await chartRes.json() as Record<string, unknown>
    const { dashas } = await dashaRes.json() as { dashas: unknown }
    return json({ chart, dashas })
  } catch (e) {
    console.error('[kundli] upstream request failed:', (e as Error).message)
    return json({ error: 'The chart service is unreachable. Please try again shortly.' }, 502)
  }
}
