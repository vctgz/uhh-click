import { customAlphabet, nanoid } from 'nanoid'

// No 0/1/l/o/i — avoids "is that an ell or a one" support tickets.
export const genSlug = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 6)

// Per-link manage token (mute now; edit/delete later). URL-safe.
export const genSecret = (): string => nanoid(24)

/** sha-256(ip + pepper) as hex. We never store raw creator IPs — only this. */
export async function hashIp(ip: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(ip + pepper)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Host portion of a Referer, or null. We never store the full referrer. */
export function hostOf(referer: string | undefined | null): string | null {
  if (!referer) return null
  try {
    return new URL(referer).hostname || null
  } catch {
    return null
  }
}

/** en-US thousands separators: 100000 -> "100,000". */
export const fmt = (n: number): string => n.toLocaleString('en-US')

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
