// Link-creation guardrails.

export const RESERVED = new Set([
  'api',
  'stats',
  'mute',
  'static',
  'robots.txt',
  'favicon.ico',
  'favicon.svg',
])

type UrlResult = { ok: true; url: string } | { ok: false; error: string }

export function validateUrl(raw: string): UrlResult {
  if (!raw) return { ok: false, error: 'a url is required' }
  if (raw.length > 2048) return { ok: false, error: 'url too long (max 2048 chars)' }

  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return { ok: false, error: "that doesn't parse as a url" }
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, error: 'only http/https links' }
  }

  const host = u.hostname.toLowerCase()
  if (host === 'uhh.click' || host.endsWith('.uhh.click')) {
    return { ok: false, error: 'no self-links (that would loop forever)' }
  }
  if (isBlockedHost(host)) {
    return { ok: false, error: 'no localhost / private addresses' }
  }

  return { ok: true, url: u.toString() }
}

function isBlockedHost(host: string): boolean {
  // Strip IPv6 brackets: new URL('http://[::1]/').hostname === '[::1]'
  let h = host
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1)

  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true

  // IPv6 checks only apply to actual IPv6 literals (they contain ':'), so we
  // never mistake a domain like fcbarcelona.com for the fc00::/7 range.
  if (h.includes(':')) {
    if (h === '::1' || h === '::') return true // loopback
    if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true // link-local / ULA
    // ::ffff:127.0.0.1 style falls through to the IPv4 check below.
  }

  // Normalize odd-but-valid IPv4 spellings (integer, hex, octal, a.b shorthand,
  // ::ffff-mapped) to dotted-quad, then range-check. Closes the 2130706433 /
  // 0x7f000001 / 127.1 bypasses.
  const v4 = toIPv4(h)
  if (v4) {
    const [a, b] = v4.split('.').map(Number)
    if (a === 0 || a === 10 || a === 127) return true // this-host / private / loopback
    if (a === 169 && b === 254) return true // link-local
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a >= 224) return true // multicast / reserved
  }
  return false
}

/** Any accepted IPv4 spelling → canonical "a.b.c.d", or null if not an IPv4. */
function toIPv4(host: string): string | null {
  // IPv4-mapped IPv6, either dotted (::ffff:127.0.0.1) or the hex-compressed
  // form URL parsers normalize it into (::ffff:7f00:1).
  const dotted = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
  const hex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
  let h = host
  if (dotted) h = dotted[1]
  else if (hex) {
    const v = (parseInt(hex[1], 16) * 65536 + parseInt(hex[2], 16)) >>> 0
    h = `${(v >>> 24) & 255}.${(v >>> 16) & 255}.${(v >>> 8) & 255}.${v & 255}`
  }

  const parts = h.split('.')
  if (parts.length === 0 || parts.length > 4) return null

  const nums: number[] = []
  for (const p of parts) {
    let n: number
    if (/^0x[0-9a-f]+$/i.test(p)) n = parseInt(p, 16)
    else if (/^0[0-7]+$/.test(p)) n = parseInt(p, 8)
    else if (/^(0|[1-9]\d*)$/.test(p)) n = parseInt(p, 10)
    else return null
    if (!Number.isFinite(n) || n < 0) return null
    nums.push(n)
  }

  // Expand shorthand: trailing part absorbs the remaining low-order bytes.
  const oct = [0, 0, 0, 0]
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] > 255) return null
    oct[i] = nums[i]
  }
  let tail = nums[nums.length - 1]
  const width = 4 - (nums.length - 1)
  if (tail >= 2 ** (8 * width)) return null
  for (let i = 3; i >= nums.length - 1; i--) {
    oct[i] = tail & 255
    tail = Math.floor(tail / 256)
  }
  return oct.join('.')
}

export function validateEmail(raw: string): boolean {
  if (!raw || raw.length > 254) return false
  // Deliberately loose — Resend is the real validator. Just catch obvious junk.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)
}

type SlugResult = { ok: true; slug: string } | { ok: false; error: string }

export function validateCustomSlug(raw: string): SlugResult {
  const slug = raw.toLowerCase().trim()
  if (!/^[a-z0-9-]{2,32}$/.test(slug)) {
    return { ok: false, error: 'custom slug must be 2–32 chars: a–z, 0–9, and dashes' }
  }
  if (RESERVED.has(slug)) {
    return { ok: false, error: 'that slug is reserved' }
  }
  return { ok: true, slug }
}
