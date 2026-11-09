/**
 * Cloudflare Worker entry. Serves the built site from ./dist and handles
 * /api/kundli. Secrets come from `wrangler secret put` (or .dev.vars locally).
 */
import { handleKundli, type KundliEnv } from '../server/kundli'

interface Env extends KundliEnv {
  ASSETS: { fetch(req: Request): Promise<Response> }
  /** Password for the private /books pages. Unset = /books is locked for everyone. */
  BOOKS_PASSWORD?: string
}

const isBooksPath = (p: string) => p === '/books' || p.startsWith('/books/')

/** HTTP Basic auth: any username, password must match BOOKS_PASSWORD. */
function booksAuthorized(req: Request, password: string | undefined): boolean {
  if (!password) return false
  const header = req.headers.get('Authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  let decoded: string
  try { decoded = atob(header.slice(6)) } catch { return false }
  const given = decoded.slice(decoded.indexOf(':') + 1)
  if (given.length !== password.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ password.charCodeAt(i)
  return diff === 0
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)
    if (pathname === '/api/kundli') return handleKundli(req, env)
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 })
    if (isBooksPath(pathname) && !booksAuthorized(req, env.BOOKS_PASSWORD)) {
      return new Response('Password required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Astrokarmaz Books", charset="UTF-8"',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
      })
    }
    return env.ASSETS.fetch(req)
  },
}
