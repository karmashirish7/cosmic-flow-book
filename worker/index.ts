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

// ─── Private /books: password form + cookie ──────────────────────────────────

const BOOKS_COOKIE = 'books_auth'
const BOOKS_LOGIN = '/books/login'
const isBooksPath = (p: string) => p === '/books' || p.startsWith('/books/')

/** Cookie value: a hash of the password, so the cookie never holds the password itself. */
async function booksToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`astrokarmaz-books:${password}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function readCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.get('Cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function loginPage(next: string, wrong: boolean): Response {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Books · Astrokarmaz</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box;
         background: #08080e; color: #ece6d6; font: 16px/1.5 Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
  form { width: 100%; max-width: 340px; padding: 28px; border: 1px solid #2a2a3a; border-radius: 14px; background: #11111a; }
  h1 { margin: 0 0 4px; font: 600 26px Cinzel, Georgia, serif; color: #e0b53e; }
  p { margin: 0 0 20px; color: #9a96a8; font-size: 14px; }
  label { display: block; font-size: 13px; color: #9a96a8; margin-bottom: 6px; }
  input { width: 100%; box-sizing: border-box; padding: 11px 12px; font-size: 16px; border-radius: 8px;
          border: 1px solid #33334a; background: #0b0b12; color: inherit; }
  input:focus { outline: 2px solid #e0b53e55; border-color: #e0b53e; }
  button { margin-top: 14px; width: 100%; padding: 11px; font-size: 16px; font-weight: 600; border: 0; border-radius: 8px;
           background: #e0b53e; color: #08080e; cursor: pointer; }
  .err { margin: 10px 0 0; color: #f08d99; font-size: 14px; }
</style></head>
<body>
<form method="post" action="${BOOKS_LOGIN}">
  <h1>Books</h1>
  <p>Enter the password to continue.</p>
  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  ${wrong ? '<p class="err">Wrong password. Try again.</p>' : ''}
  <button type="submit">Open</button>
</form>
</body></html>`
  return new Response(html, {
    status: wrong ? 401 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    },
  })
}

async function handleBooks(req: Request, env: Env, url: URL): Promise<Response> {
  const password = env.BOOKS_PASSWORD
  const expected = password ? await booksToken(password) : null

  if (url.pathname === BOOKS_LOGIN) {
    if (req.method !== 'POST') return Response.redirect(new URL('/books', url).toString(), 303)
    const form = await req.formData().catch(() => null)
    const given = String(form?.get('password') ?? '')
    const nextRaw = String(form?.get('next') ?? '/books')
    const next = isBooksPath(nextRaw) && nextRaw !== BOOKS_LOGIN ? nextRaw : '/books'
    if (!expected || !safeEqual(await booksToken(given), expected)) return loginPage(next, true)
    return new Response(null, {
      status: 303,
      headers: {
        Location: next,
        'Set-Cookie': `${BOOKS_COOKIE}=${expected}; Path=/books; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const cookie = readCookie(req, BOOKS_COOKIE)
  if (!expected || !cookie || !safeEqual(cookie, expected)) {
    return loginPage(url.pathname + url.search, false)
  }
  const res = await env.ASSETS.fetch(req)
  const out = new Response(res.body, res)
  out.headers.set('Cache-Control', 'private, no-store')
  return out
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const { pathname } = url
    if (pathname === '/api/kundli') return handleKundli(req, env)
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 })
    if (isBooksPath(pathname)) return handleBooks(req, env, url)
    return env.ASSETS.fetch(req)
  },
}
