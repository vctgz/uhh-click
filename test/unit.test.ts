import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { crossedThreshold, nextThreshold, THRESHOLDS } from '../src/thresholds'
import { isBot } from '../src/bots'
import { validateUrl, validateEmail, validateCustomSlug } from '../src/validate'

const here = dirname(fileURLToPath(import.meta.url))
const MIGRATION = readFileSync(join(here, '../migrations/0001_init.sql'), 'utf8')

describe('thresholds', () => {
  it('fires only on exact ladder values', () => {
    for (const t of THRESHOLDS) expect(crossedThreshold(t)).toBe(t)
    for (const n of [0, 1, 99, 101, 249, 251, 99_999, 100_001]) {
      expect(crossedThreshold(n)).toBeNull()
    }
  })
  it('nextThreshold walks the ladder and tops out at 100k', () => {
    expect(nextThreshold(0)).toBe(100)
    expect(nextThreshold(100)).toBe(250)
    expect(nextThreshold(99_999)).toBe(100_000)
    expect(nextThreshold(100_000)).toBeNull()
  })
})

describe('bot detection', () => {
  const h = (obj: Record<string, string> = {}) => new Headers(obj)
  const humans = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 Edg/125.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  ]
  const bots = [
    'curl/8.4.0',
    'Wget/1.21.3',
    'python-requests/2.31.0',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Twitterbot/1.0',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'WhatsApp/2.23',
  ]
  it('lets real browsers through', () => {
    for (const ua of humans) expect(isBot(ua, h()), ua).toBe(false)
  })
  it('catches known bots', () => {
    for (const ua of bots) expect(isBot(ua, h()), ua).toBe(true)
  })
  it('treats empty/missing UA as a bot', () => {
    expect(isBot('', h())).toBe(true)
    expect(isBot(null, h())).toBe(true)
    expect(isBot(undefined, h())).toBe(true)
  })
  it('catches prefetch/preview even with a browser UA', () => {
    expect(isBot(humans[0], h({ 'Sec-Purpose': 'prefetch;prerender' }))).toBe(true)
    expect(isBot(humans[0], h({ Purpose: 'preview' }))).toBe(true)
  })
})

describe('url validation', () => {
  it('accepts normal http/https', () => {
    expect(validateUrl('https://example.com/landing').ok).toBe(true)
    expect(validateUrl('http://a.co/?utm=x').ok).toBe(true)
  })
  it('does not mistake fc/fd/fe domains for private IPv6', () => {
    // regression: the old prefix check blocked any host starting fc/fd.
    for (const u of ['https://fcbarcelona.com', 'https://fdny.org', 'https://fe-design.io']) {
      expect(validateUrl(u).ok, u).toBe(true)
    }
  })
  it('blocks private IPs written in sneaky encodings', () => {
    const sneaky = [
      'http://2130706433', // 127.0.0.1 as an integer
      'http://0x7f000001', // 127.0.0.1 in hex
      'http://0177.0.0.1', // 127.0.0.1 with an octal first byte
      'http://127.1', // shorthand for 127.0.0.1
      'http://[::ffff:127.0.0.1]', // IPv4-mapped IPv6
      'http://[::ffff:169.254.1.1]',
    ]
    for (const u of sneaky) expect(validateUrl(u).ok, u).toBe(false)
  })
  it('rejects the dangerous / silly stuff', () => {
    const bad = [
      'ftp://x.com',
      'javascript:alert(1)',
      'http://localhost/x',
      'http://foo.local/x',
      'https://uhh.click/y',
      'https://sub.uhh.click/y',
      'http://127.0.0.1',
      'http://10.0.0.1',
      'http://192.168.1.1',
      'http://172.16.5.5',
      'http://169.254.1.1',
      'http://[::1]/',
      'not a url',
      '',
    ]
    for (const u of bad) expect(validateUrl(u).ok, u).toBe(false)
  })
  it('rejects > 2048 chars', () => {
    expect(validateUrl('https://x.com/' + 'a'.repeat(2050)).ok).toBe(false)
  })
})

describe('email + slug validation', () => {
  it('emails', () => {
    expect(validateEmail('victor@example.com')).toBe(true)
    for (const e of ['', 'nope', 'a@', '@b.co', 'a b@c.co', 'x'.repeat(250) + '@y.co']) {
      expect(validateEmail(e), e).toBe(false)
    }
  })
  it('slugs (lowercased, bounded, no reserved)', () => {
    expect(validateCustomSlug('Launch-2026')).toEqual({ ok: true, slug: 'launch-2026' })
    for (const s of ['a', 'api', 'stats', 'has space', 'a'.repeat(33), 'bad_underscore']) {
      expect(validateCustomSlug(s).ok, s).toBe(false)
    }
  })
})

describe('alert claim is idempotent (real sqlite, real migration)', () => {
  it('INSERT OR IGNORE on (slug, threshold) yields exactly one winner', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(MIGRATION)
    const claim = db.prepare('INSERT OR IGNORE INTO alerts (slug, threshold) VALUES (?, ?)')

    expect(claim.run('abc', 100).changes).toBe(1) // first click at 100 wins
    expect(claim.run('abc', 100).changes).toBe(0) // retries / concurrent losers no-op
    expect(claim.run('abc', 100).changes).toBe(0) // ...and stay no-ops forever
    expect(claim.run('abc', 250).changes).toBe(1) // the next milestone is its own claim

    const { n } = db.prepare('SELECT COUNT(*) n FROM alerts WHERE slug = ?').get('abc') as {
      n: number
    }
    expect(n).toBe(2)
    db.close()
  })
})
