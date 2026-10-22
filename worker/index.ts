/**
 * Cloudflare Worker entry. Serves the built site from ./dist and handles
 * /api/kundli. Secrets come from `wrangler secret put` (or .dev.vars locally).
 */
import { handleKundli, type KundliEnv } from '../server/kundli'

interface Env extends KundliEnv {
  ASSETS: { fetch(req: Request): Promise<Response> }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)
    if (pathname === '/api/kundli') return handleKundli(req, env)
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 })
    return env.ASSETS.fetch(req)
  },
}
