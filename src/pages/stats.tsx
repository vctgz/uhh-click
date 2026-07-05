import type { FC } from 'hono/jsx'
import { Layout, Card, Wordmark, FootTag } from './layout'
import type { StatsDetail } from '../redirect'
import { THRESHOLDS, nextThreshold } from '../thresholds'
import { fmt, truncate } from '../util'

export const StatsPage: FC<{ data: StatsDetail; baseUrl: string }> = ({ data, baseUrl }) => {
  const { link, series, referrers, countries } = data
  const clicks = link.clicks
  const shortUrl = `${baseUrl}/${link.slug}`

  let prev = 0
  for (const t of THRESHOLDS) if (clicks >= t) prev = t
  const next = nextThreshold(clicks)
  const pct = next ? Math.round(Math.max(0, Math.min(1, (clicks - prev) / (next - prev))) * 100) : 100

  const maxDay = Math.max(1, ...series.map((s) => s.clicks))
  const ogTitle = `uhh… ${link.slug} hit ${fmt(clicks)} clicks`

  return (
    <Layout
      wide
      meta={{
        title: `${link.slug} — ${fmt(clicks)} clicks · uhh.click`,
        description: `${fmt(clicks)} human clicks and counting. tracked live on uhh.click.`,
        og: {
          title: ogTitle,
          description: `tracked live on uhh.click${next ? ` — next stop ${fmt(next)}` : ' — topped out at 100k'}.`,
          url: `${shortUrl}+`,
        },
      }}
    >
      <Wordmark suffix="/ stats" />

      <Card>
        <div class="stats-top">
          <div>
            <div class="big">{fmt(clicks)}</div>
            <div class="big-label">human clicks on {link.slug}</div>
          </div>
          {link.alerts_muted ? <span class="muted-badge">alerts muted</span> : null}
        </div>
        <div class="dest">
          → <a href={link.url}>{truncate(link.url, 66)}</a>
        </div>
        <div class="dest">
          short link: {shortUrl} · <a href={link.url}>visit</a>
        </div>

        <div class="stat-row">
          <div class="stat hot">
            <div class="n">{fmt(clicks)}</div>
            <div class="k">humans</div>
          </div>
          <div class="stat">
            <div class="n">{fmt(link.bot_clicks)}</div>
            <div class="k">bots filtered</div>
          </div>
          <div class="stat">
            <div class="n">{next ? fmt(next) : '🏁'}</div>
            <div class="k">{next ? 'next milestone' : 'topped out'}</div>
          </div>
        </div>

        <div class="sechead">milestones</div>
        {next ? (
          <div class="prog">
            <div class="prog-track">
              <div class="prog-fill" style={`width:${pct}%`}></div>
            </div>
            <div class="prog-label">
              {fmt(clicks)} / {fmt(next)}
            </div>
          </div>
        ) : (
          <div class="prog">
            <div class="prog-label" style="color:var(--coral)">
              🏁 topped out — every milestone cleared.
            </div>
          </div>
        )}
        <div class="pills">
          {THRESHOLDS.map((t) => {
            const cls = clicks >= t ? 'pill done' : t === next ? 'pill next' : 'pill'
            return (
              <span class={cls}>
                {fmt(t)}
                {clicks >= t ? ' ✓' : ''}
              </span>
            )
          })}
        </div>

        <div class="sechead">last 7 days</div>
        <div class="chart">
          {series.map((s) => (
            <div class="col">
              <div class="cn">{s.clicks}</div>
              <div class="barv" style={`height:${Math.max(4, Math.round((s.clicks / maxDay) * 100))}px`}></div>
              <div class="cd">{s.day.slice(5)}</div>
            </div>
          ))}
        </div>

        <div class="sechead">top referrers</div>
        {referrers.length ? (
          referrers.map((r) => (
            <div class="kv">
              <span class="k">{r.host}</span>
              <span class="v">{fmt(r.n)}</span>
            </div>
          ))
        ) : (
          <div class="empty-note">quiet so far — no referrers recorded yet.</div>
        )}

        <div class="sechead">top countries</div>
        {countries.length ? (
          countries.map((c) => (
            <div class="kv">
              <span class="k">{c.country}</span>
              <span class="v">{fmt(c.n)}</span>
            </div>
          ))
        ) : (
          <div class="empty-note">no country data yet.</div>
        )}

        <p class="honest">
          raw human clicks. known bots filtered out, nothing deduped. numbers are honest, not
          flattering.
        </p>
      </Card>

      <FootTag />
    </Layout>
  )
}
