import type { IncomingMessage, ServerResponse } from 'http'
import { VEDIC_RULES_PROMPT } from '../server/knowledge.js'

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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY ?? ''
  if (!openRouterKey) {
    sendJson(res, 500, { error: 'OPENROUTER_API_KEY is not set.' })
    return
  }

  try {
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
        'HTTP-Referer': 'https://akashvani.local',
        'X-Title': 'Akashvani Vedic AI',
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
}
