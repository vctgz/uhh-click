import type { Bindings } from './types'
import { crossedThreshold } from './thresholds'
import { sendEmail, milestoneEmail } from './emails'

/**
 * Fire a milestone alert if this click landed exactly on a threshold.
 *
 * Correctness rests on two facts:
 *  1. Each human click increments by exactly 1, so exactly one request ever
 *     observes clicks === 100 (or 250, ...).
 *  2. INSERT OR IGNORE on PK (slug, threshold) means only one caller wins the
 *     claim (changes === 1). Everyone else no-ops. Duplicate emails are
 *     therefore impossible, even under concurrency or retries.
 */
export async function maybeFireAlert(
  env: Bindings,
  slug: string,
  info: { clicks: number; muted: boolean; email: string; url: string; secret: string },
): Promise<void> {
  const threshold = crossedThreshold(info.clicks)
  if (threshold === null || info.muted) return

  const claim = await env.DB.prepare(
    'INSERT OR IGNORE INTO alerts (slug, threshold) VALUES (?, ?)',
  )
    .bind(slug, threshold)
    .run()
  if (claim.meta.changes !== 1) return // already claimed by someone else

  const secret = info.secret
  const base = env.BASE_URL
  const { subject, html } = milestoneEmail({
    slug,
    count: threshold,
    destUrl: info.url,
    statsUrl: `${base}/${slug}+`,
    muteUrl: `${base}/mute/${slug}?key=${encodeURIComponent(secret)}`,
  })

  try {
    const { id } = await sendEmail(env, { to: info.email, subject, html })
    await env.DB.prepare(
      "UPDATE alerts SET status = 'sent', resend_id = ? WHERE slug = ? AND threshold = ?",
    )
      .bind(id, slug, threshold)
      .run()
  } catch (err) {
    console.error('alert send failed', slug, threshold, err)
    await env.DB.prepare(
      "UPDATE alerts SET status = 'failed' WHERE slug = ? AND threshold = ?",
    )
      .bind(slug, threshold)
      .run()
  }
}
