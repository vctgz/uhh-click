import type { Bindings } from './types'
import { nextThreshold } from './thresholds'
import { fmt, truncate, escapeHtml } from './util'

type SendArgs = { to: string; subject: string; html: string }

/**
 * Send via Resend, or dry-run when RESEND_API_KEY is unset (all local dev).
 * Dry-run logs the intent and returns id 'dry-run' so the alerts row still
 * records status='sent'.
 */
export async function sendEmail(env: Bindings, args: SendArgs): Promise<{ id: string }> {
  if (!env.RESEND_API_KEY) {
    console.log(`[dry-run] would send "${args.subject}" -> ${args.to}`)
    return { id: 'dry-run' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `uhh.click <${env.ALERT_FROM}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`resend ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { id?: string }
  return { id: data.id ?? 'unknown' }
}

// ── email-safe design tokens (inline only; box-shadow degrades on Gmail) ──────
// Web fonts load in Apple/iOS Mail and fall back to rounded system stacks elsewhere.
const FRED = "'Fredoka','Trebuchet MS','Segoe UI',Verdana,sans-serif"
const NUN = "'Nunito',-apple-system,'Segoe UI',Arial,sans-serif"
const BTN = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#FF5B4A;color:#FFF7ED;text-decoration:none;font-family:${FRED};font-weight:600;font-size:16px;border:3px solid #16130F;border-radius:16px;padding:13px 22px;box-shadow:4px 4px 0 #16130F;">${label}</a>`

function shell(inner: string): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet"></head>` +
    `<body style="margin:0;padding:0;background:#EAECF0;">` +
    `<div style="background:#EAECF0;padding:32px 16px;">` +
    `<div style="max-width:480px;margin:0 auto;background:#FBFCFE;border:3px solid #16130F;border-radius:26px;box-shadow:8px 10px 0 #16130F;overflow:hidden;">` +
    `<div style="padding:26px 28px 6px;"><span style="display:inline-block;background:#16130F;border-radius:999px;padding:7px 15px;font-family:${FRED};font-weight:600;font-size:16px;color:#FFF7ED;">⚡ uhh.click</span></div>` +
    inner +
    `</div>` +
    `<div style="max-width:480px;margin:14px auto 0;text-align:center;font-family:${FRED};font-weight:500;font-size:12px;color:#b8ad97;">uhh.click — short links that tell you when they blow up.</div>` +
    `</div></body></html>`
  )
}

// ── milestone email ──────────────────────────────────────────────────────────
export function milestoneEmail(opts: {
  slug: string
  count: number
  destUrl: string
  statsUrl: string
  muteUrl: string
}): { subject: string; html: string } {
  const slug = escapeHtml(opts.slug)
  const dest = escapeHtml(truncate(opts.destUrl, 64))
  const next = nextThreshold(opts.count)
  const progress = next
    ? `next stop: ${fmt(next)}`
    : `we're out of milestones. you win. go buy a billboard.`

  const inner =
    `<div style="padding:16px 28px 30px;">` +
    `<div style="font-family:${FRED};font-weight:700;font-size:60px;line-height:1;color:#FF5B4A;">${fmt(opts.count)}</div>` +
    `<div style="font-family:${NUN};font-weight:700;font-size:16px;color:#5b5445;margin-top:8px;">human clicks on <span style="color:#16130F;">${slug}</span></div>` +
    `<div style="font-family:${NUN};font-weight:600;font-size:13px;color:#9a917d;margin-top:6px;word-break:break-all;">→ ${dest}</div>` +
    `<div style="display:inline-block;background:#C7F04A;border:3px solid #16130F;border-radius:14px;padding:8px 14px;margin-top:20px;font-family:${FRED};font-weight:600;font-size:15px;color:#16130F;">${progress}</div>` +
    `<div style="margin-top:24px;">${BTN(opts.statsUrl, 'see the stats →')}</div>` +
    `<div style="margin-top:26px;padding-top:18px;border-top:2px dashed #d8cdb4;font-family:${NUN};font-weight:600;font-size:12px;color:#9a917d;line-height:1.6;">you get these because you created this link. too loud? <a href="${opts.muteUrl}" style="color:#FF5B4A;">mute this link</a>.</div>` +
    `</div>`

  return { subject: `uhh… ${opts.slug} just hit ${fmt(opts.count)} clicks`, html: shell(inner) }
}

// ── "your link is live" email ────────────────────────────────────────────────
export function linkLiveEmail(opts: {
  slug: string
  shortUrl: string
  destUrl: string
  statsUrl: string
}): { subject: string; html: string } {
  const short = escapeHtml(opts.shortUrl.replace(/^https?:\/\//, ''))
  const dest = escapeHtml(truncate(opts.destUrl, 64))

  const inner =
    `<div style="padding:16px 28px 30px;">` +
    `<div style="font-family:${FRED};font-weight:700;font-size:26px;color:#16130F;">your link is live. 🎉</div>` +
    `<div style="font-family:${NUN};font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9a917d;margin:18px 0 6px;">short link</div>` +
    `<div style="font-family:${FRED};font-weight:600;font-size:20px;color:#16130F;word-break:break-all;">${short}</div>` +
    `<div style="font-family:${NUN};font-weight:600;font-size:13px;color:#9a917d;margin-top:14px;word-break:break-all;">→ ${dest}</div>` +
    `<div style="font-family:${NUN};font-weight:700;font-size:15px;color:#5b5445;margin-top:18px;">we'll email you at 100.</div>` +
    `<div style="margin-top:22px;">${BTN(opts.statsUrl, 'watch it climb →')}</div>` +
    `</div>`

  return { subject: 'uhh… your link is live', html: shell(inner) }
}
