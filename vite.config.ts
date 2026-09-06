import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage, ServerResponse } from "http";

function readBody(req: IncomingMessage): Promise<unknown> {
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

function vedaApiPlugin(openRouterKey: string) {
  return {
    name: 'veda-api',
    configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST') { next(); return }

        if (req.url === '/api/calculate') {
          try {
            const { calculateChart, parseTimezone, localToUTC } = await import('./server/astrology.js')
            const { buildChartSummary } = await import('./server/knowledge.js')
            const { getPlanetDignity } = await import('./server/dignity.js')
            const { buildDashaTree, getCurrentDasha, serializeDashaTree } = await import('./server/dasha.js')

            const body = await readBody(req) as Record<string, string>
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

            const moonLon    = calc.planets['Moon']?.longitude ?? 0
            const birthDt    = new Date(`${birthDate}T${birthTime}`)
            const dashaTree  = buildDashaTree(birthDt, moonLon)
            const currentDasha = getCurrentDasha(dashaTree)
            const summary    = buildChartSummary(calc, dashaTree, currentDasha)

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
          return
        }

        if (req.url === '/api/chat') {
          if (!openRouterKey) {
            sendJson(res, 500, { error: 'OPENROUTER_API_KEY is not set.' })
            return
          }
          try {
            const { VEDIC_RULES_PROMPT } = await import('./server/knowledge.js')
            const body = await readBody(req) as Record<string, unknown>
            const { question, chartSummary, name, history } = body as {
              question: string; chartSummary: string; name?: string
              history?: { role: 'user' | 'assistant'; content: string }[]
            }

            if (!question || !chartSummary) {
              sendJson(res, 400, { error: 'Missing question or chartSummary' })
              return
            }

            const systemPrompt = `${VEDIC_RULES_PROMPT}

══════════════════════════════════════════
BIRTH CHART FOR: ${name ?? 'Native'}
══════════════════════════════════════════
${chartSummary}
══════════════════════════════════════════

Answer all questions about this person using ONLY the chart above and the Vedic rules provided. Be specific about which planets, signs, and houses you are referencing.`

            type Message = { role: 'user' | 'assistant'; content: string }
            const messages: Message[] = [
              ...((history as Message[]) ?? []),
              { role: 'user', content: question },
            ]

            const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://astrokarmaz.local',
                'X-Title': 'Astrokarmaz Vedic AI',
              },
              body: JSON.stringify({
                model: 'anthropic/claude-3.5-haiku',
                max_tokens: 800,
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
              }),
            })

            if (!apiRes.ok) {
              const errText = await apiRes.text()
              sendJson(res, 500, { error: `OpenRouter error: ${errText}` })
              return
            }

            const data = await apiRes.json() as { choices?: { message?: { content?: string } }[] }
            const answer = data.choices?.[0]?.message?.content ?? ''
            sendJson(res, 200, { answer })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Chat API error'
            sendJson(res, 500, { error: message })
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      vedaApiPlugin(env.OPENROUTER_API_KEY ?? ''),
    ].filter(Boolean),
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  }
})
