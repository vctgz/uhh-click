import type { Bindings } from './types'
import { isBot } from './bots'
import { hostOf } from './util'

/** Result of counting a single click. */
export type ClickOutcome =
  | { human: true; clicks: number; muted: boolean; email: string; url: string; secret: string }
  | { human: false }

/**
 * The click pipeline. Runs in ctx.waitUntil AFTER the redirect is already sent,
 * so it never adds latency to the hot path. Bots bump bot_clicks; humans get the
 * atomic increment whose RETURNING value drives the alert ladder (see alerts.ts).
 */
export async function recordClick(
  env: Bindings,
  req: Request,
  slug: string,
): Promise<ClickOutcome> {
  const ua = req.headers.get('user-agent')
  const bot = isBot(ua, req.headers)
  const country = (req as unknown as { cf?: { country?: string } }).cf?.country ?? null
  const refHost = hostOf(req.headers.get('referer'))

  if (bot) {
    await env.DB.batch([
      env.DB.prepare('UPDATE links SET bot_clicks = bot_clicks + 1 WHERE slug = ?').bind(slug),
      env.DB
        .prepare('INSERT INTO clicks (slug, country, ref_host, is_bot) VALUES (?, ?, ?, 1)')
        .bind(slug, country, refHost),
    ])
    return { human: false }
  }

  const res = await env.DB.batch([
    env.DB
      .prepare(
        "UPDATE links SET clicks = clicks + 1, last_click_at = datetime('now') WHERE slug = ? RETURNING clicks, alerts_muted, email, url, secret",
      )
      .bind(slug),
    env.DB
      .prepare('INSERT INTO clicks (slug, country, ref_host, is_bot) VALUES (?, ?, ?, 0)')
      .bind(slug, country, refHost),
  ])

  const row = res[0]?.results?.[0] as
    | { clicks: number; alerts_muted: number; email: string; url: string; secret: string }
    | undefined
  if (!row) return { human: false }

  return {
    human: true,
    clicks: row.clicks,
    muted: row.alerts_muted === 1,
    email: row.email,
    url: row.url,
    secret: row.secret,
  }
}

export type Stats = {
  slug: string
  url: string
  clicks: number
  bot_clicks: number
  alerts_muted: number
  created_at: string
  last_click_at: string | null
}

/** Core stats row for a slug, or null if it doesn't exist. */
export async function getStats(env: Bindings, slug: string): Promise<Stats | null> {
  const row = await env.DB.prepare(
    'SELECT slug, url, clicks, bot_clicks, alerts_muted, created_at, last_click_at FROM links WHERE slug = ?',
  )
    .bind(slug)
    .first<Stats>()
  return row ?? null
}

export type StatsDetail = {
  link: Stats
  series: { day: string; clicks: number }[] // last 7 UTC days, humans only
  referrers: { host: string; n: number }[] // top 5
  countries: { country: string; n: number }[] // top 5
}

/** Everything the public stats page needs, in a few grouped queries. */
export async function getStatsDetail(env: Bindings, slug: string): Promise<StatsDetail | null> {
  const link = await getStats(env, slug)
  if (!link) return null

  const [rawSeries, refs, countries] = await env.DB.batch([
    env.DB
      .prepare(
        `SELECT substr(ts,1,10) AS day, COUNT(*) AS n FROM clicks
         WHERE slug = ? AND is_bot = 0 AND ts >= datetime('now','-6 days','start of day')
         GROUP BY day`,
      )
      .bind(slug),
    env.DB
      .prepare(
        `SELECT ref_host AS host, COUNT(*) AS n FROM clicks
         WHERE slug = ? AND is_bot = 0 AND ref_host IS NOT NULL
         GROUP BY ref_host ORDER BY n DESC LIMIT 5`,
      )
      .bind(slug),
    env.DB
      .prepare(
        `SELECT country, COUNT(*) AS n FROM clicks
         WHERE slug = ? AND is_bot = 0 AND country IS NOT NULL
         GROUP BY country ORDER BY n DESC LIMIT 5`,
      )
      .bind(slug),
  ])

  // Zero-fill the last 7 UTC days so the chart always shows a full week.
  const counts = new Map<string, number>()
  for (const r of (rawSeries.results ?? []) as { day: string; n: number }[]) {
    counts.set(r.day, r.n)
  }
  const now = new Date()
  const series: { day: string; clicks: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    const key = d.toISOString().slice(0, 10)
    series.push({ day: key, clicks: counts.get(key) ?? 0 })
  }

  return {
    link,
    series,
    referrers: (refs.results ?? []) as { host: string; n: number }[],
    countries: (countries.results ?? []) as { country: string; n: number }[],
  }
}
