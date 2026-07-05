// hello, friend
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Bindings } from './types'
import { recordClick, getStats, getStatsDetail } from './redirect'
import { maybeFireAlert } from './alerts'
import { validateUrl, validateEmail, validateCustomSlug } from './validate'
import { genSlug, genSecret, hashIp } from './util'
import { sendEmail, linkLiveEmail } from './emails'
import { doc, FAVICON_SVG } from './pages/layout'
import { Home } from './pages/home'
import { NotFound } from './pages/notfound'
import { StatsPage } from './pages/stats'
import { Notice } from './pages/notice'

const app = new Hono<{ Bindings: Bindings }>()

// ── security headers on every response ───────────────────────────────────────
// HSTS + anti-clickjacking + no MIME sniffing. All responses are locally built,
// so their Headers are mutable; we only add, never touch Location/Cache-Control.
app.use('*', async (c, next) => {
  await next()
  const h = c.res.headers
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('X-Frame-Options', 'DENY')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  h.set('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'none'; object-src 'none'")
})

// ── home ───────────────────────────────────────────────────────────────────
app.get('/', (c) => c.html(doc(<Home />)))

// ── favicon (inline SVG, no asset pipeline) ──────────────────────────────────
app.get('/favicon.svg', (c) =>
  c.body(FAVICON_SVG, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400',
  }),
)

// ── create a link ────────────────────────────────────────────────────────────
app.post('/api/links', async (c) => {
  const body = await readBody(c)
  const rawUrl = String(body.url ?? '').trim()
  const rawEmail = String(body.email ?? '').trim()
  const rawSlug = String(body.slug ?? body.custom ?? '').trim()

  const urlCheck = validateUrl(rawUrl)
  if (!urlCheck.ok) return c.json({ error: urlCheck.error }, 400)
  if (!validateEmail(rawEmail)) {
    return c.json({ error: 'a valid email is required — that is how you get alerts' }, 400)
  }

  let slug: string
  let isCustom = false
  if (rawSlug) {
    const sc = validateCustomSlug(rawSlug)
    if (!sc.ok) return c.json({ error: sc.error }, 400)
    slug = sc.slug
    isCustom = true
  } else {
    slug = genSlug()
  }

  const secret = genSecret()
  const ipHash = await hashIp(c.req.header('CF-Connecting-IP') ?? '0.0.0.0', c.env.IP_PEPPER)

  // Rate limit: 20 links/hour per creator.
  const rl = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM links WHERE created_ip_hash = ? AND created_at >= datetime('now','-1 hour')",
  )
    .bind(ipHash)
    .first<{ n: number }>()
  if ((rl?.n ?? 0) >= 20) {
    return c.json({ error: 'slow down. 20 links an hour is plenty.' }, 429)
  }

  const inserted = await insertLink(c.env, {
    slug,
    isCustom,
    url: urlCheck.url,
    email: rawEmail,
    secret,
    ipHash,
  })
  if (!inserted.ok) {
    return c.json({ error: 'that slug is taken. try another.' }, 409)
  }
  slug = inserted.slug

  const shortUrl = `${c.env.BASE_URL}/${slug}`
  const statsUrl = `${shortUrl}+`

  // "your link is live" email — fire and forget, never blocks the response.
  const { subject, html } = linkLiveEmail({ slug, shortUrl, destUrl: urlCheck.url, statsUrl })
  c.executionCtx.waitUntil(
    sendEmail(c.env, { to: rawEmail, subject, html }).catch((e) =>
      console.error('link-live email failed for', slug, e),
    ),
  )

  return c.json({ slug, short_url: shortUrl, stats_url: statsUrl, secret }, 201)
})

// ── stats as JSON (for the curl crowd) ───────────────────────────────────────
app.get('/api/links/:slug/stats', async (c) => {
  const stats = await getStats(c.env, c.req.param('slug'))
  if (!stats) return c.json({ error: 'no such link' }, 404)
  return c.json(stats)
})

// ── mute a link's alerts (linked from every alert email footer) ──────────────
// GET only shows a confirm page and NEVER mutates — email link-scanners and
// prefetchers issue GETs against links in mail and would otherwise auto-mute.
// The POST (from the confirm button) does the actual muting.
app.get('/mute/:slug', async (c) => {
  const slug = c.req.param('slug')
  const key = c.req.query('key') ?? ''
  const row = await lookupMute(c, slug)
  if (!row || key === '' || key !== row.secret) return muteBadKey(c)
  if (row.alerts_muted) return muteDone(c, slug)

  return c.html(
    doc(
      <Notice title="mute this link? — uhh.click">
        <h1 class="uhh-h1">
          mute <span class="hl">{slug}</span>?
        </h1>
        <p class="uhh-lead">
          no more milestone emails for <b>{slug}</b>. the clicks still count.
        </p>
        <form method="post" action={`/mute/${encodeURIComponent(slug)}`}>
          <input type="hidden" name="key" value={key} />
          <button type="submit" class="btn btn-primary">
            yes, mute it
          </button>
        </form>
      </Notice>,
    ),
  )
})

app.post('/mute/:slug', async (c) => {
  const slug = c.req.param('slug')
  const body = await readBody(c)
  const key = String(body.key ?? '')
  const row = await lookupMute(c, slug)
  if (!row || key === '' || key !== row.secret) return muteBadKey(c)
  if (!row.alerts_muted) {
    await c.env.DB.prepare('UPDATE links SET alerts_muted = 1 WHERE slug = ?').bind(slug).run()
  }
  return muteDone(c, slug)
})

// ── the hot path: redirect + deferred click pipeline ─────────────────────────
// Also serves the public stats page when the slug ends in '+' (bit.ly convention).
app.get('/:slug', async (c) => {
  const raw = c.req.param('slug')

  if (raw.endsWith('+')) {
    const detail = await getStatsDetail(c.env, raw.slice(0, -1))
    if (!detail) return notFound(c)
    return c.html(doc(<StatsPage data={detail} baseUrl={c.env.BASE_URL} />))
  }

  const slug = raw
  const link = await c.env.DB.prepare('SELECT url FROM links WHERE slug = ?')
    .bind(slug)
    .first<{ url: string }>()
  if (!link) return notFound(c)

  // Respond first; count + alert after. Wrapped so a DB hiccup never surfaces
  // to the user.
  const env = c.env
  c.executionCtx.waitUntil(
    recordClick(env, c.req.raw, slug)
      .then((outcome) => {
        if (outcome.human) return maybeFireAlert(env, slug, outcome)
      })
      .catch((err) => console.error('click pipeline failed for', slug, err)),
  )

  return new Response(null, {
    status: 302,
    headers: { Location: link.url, 'Cache-Control': 'no-store, private' },
  })
})

// ── helpers ──────────────────────────────────────────────────────────────────
function notFound(c: Context) {
  return c.html(doc(<NotFound />), 404)
}

function lookupMute(c: Context<{ Bindings: Bindings }>, slug: string) {
  return c.env.DB.prepare('SELECT secret, alerts_muted FROM links WHERE slug = ?')
    .bind(slug)
    .first<{ secret: string; alerts_muted: number }>()
}

function muteBadKey(c: Context) {
  return c.html(
    doc(
      <Notice title="uhh… no — uhh.click">
        <h1 class="uhh-h1">
          uhh… <span class="hl-coral">that didn't work.</span>
        </h1>
        <p class="uhh-lead">bad link or wrong key. nothing changed.</p>
        <a href="/" class="btn btn-ghost">
          ← home
        </a>
      </Notice>,
    ),
    403,
  )
}

function muteDone(c: Context, slug: string) {
  return c.html(
    doc(
      <Notice title="muted — uhh.click">
        <h1 class="uhh-h1">
          muted. <span class="hl">peace and quiet.</span>
        </h1>
        <p class="uhh-lead">
          no more milestone emails for <b>{slug}</b>. the clicks still count — peek anytime at{' '}
          <a href={`/${slug}+`}>{slug}+</a>.
        </p>
      </Notice>,
    ),
  )
}

async function readBody(c: Context): Promise<Record<string, unknown>> {
  const ct = c.req.header('Content-Type') ?? ''
  if (ct.includes('application/json')) {
    try {
      return await c.req.json()
    } catch {
      return {}
    }
  }
  try {
    return (await c.req.parseBody()) as Record<string, unknown>
  } catch {
    return {}
  }
}

type InsertArgs = {
  slug: string
  isCustom: boolean
  url: string
  email: string
  secret: string
  ipHash: string
}

/** Insert, retrying generated slugs on the astronomically-rare collision. */
async function insertLink(
  env: Bindings,
  args: InsertArgs,
): Promise<{ ok: true; slug: string } | { ok: false }> {
  const attempts = args.isCustom ? 1 : 5
  let slug = args.slug
  for (let i = 0; i < attempts; i++) {
    try {
      await env.DB.prepare(
        'INSERT INTO links (slug, url, email, secret, created_ip_hash) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(slug, args.url, args.email, args.secret, args.ipHash)
        .run()
      return { ok: true, slug }
    } catch (e) {
      const msg = String(e)
      if (msg.includes('UNIQUE') || msg.includes('constraint')) {
        if (args.isCustom) return { ok: false }
        slug = genSlug()
        continue
      }
      throw e
    }
  }
  return { ok: false }
}

export default app
