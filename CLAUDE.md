# uhh.click

> hello, friend.

A URL shortener for marketers with one killer feature: it emails you when your link crosses click milestones (100, 250, 500, 1k, 2.5k, 5k, 10k, 25k, 50k, 100k). Copy voice: lowercase, deadpan (unchanged). MVP scope — weekend-hackathon rules, no gold-plating.

**Visual design: playful neo-brutalist** (whole app). Light background, Fredoka/Nunito webfonts, chunky black borders (`#16130F`), hard offset shadows, coral (`#FF5B4A`) / lime (`#C7F04A`) / blue (`#57C4FF`), floating blobs. Originated from `design/uhh.click.dc.html`. The shared design system + `Layout`/`Card`/`Wordmark` live in `src/pages/layout.tsx` and dress stats/404/mute. The home page (`src/pages/home.tsx`) is a **self-contained document with its own copy of the same tokens** — kept separate because it was the first cut, so if you change a color/token, update both `home.tsx` and `layout.tsx`. Emails (`src/emails.ts`) use the same look via email-safe inline styles (box-shadows degrade on Gmail; web fonts fall back to a rounded system stack). Favicon is the coral lightning mark. Copy voice stays lowercase/deadpan.

## Stack (decided — don't relitigate)

- Cloudflare Workers + Hono (TypeScript). One Worker, no separate frontend, no build pipeline beyond wrangler.
- D1 (SQLite) for all storage. Server-rendered pages via Hono JSX; vanilla JS sprinkles only.
- Resend for email, called via plain `fetch`. Dry-run mode when `RESEND_API_KEY` is unset.
- `nanoid` customAlphabet for slugs.

## Commands

- `npm run dev` → `wrangler dev` (local D1, dry-run emails, http://localhost:8787)
- `wrangler d1 migrations apply uhh-click --local` (add `--remote` for prod)
- `npm run smoke` → `scripts/smoke.sh` against local dev
- `wrangler deploy` — the human runs this (already live in prod)

## Invariants (load-bearing — violating any of these breaks the product)

1. Redirects are **302 + `Cache-Control: no-store`**. Never 301 — browsers cache 301s and silently stop hitting us, which kills click counting.
2. The redirect response returns first; counting + alert logic runs in `ctx.waitUntil()`. Never add latency to the hot path.
3. The click increment is one atomic `UPDATE links SET clicks = clicks + 1 ... RETURNING clicks`. A threshold fires iff the returned value is exactly in `THRESHOLDS`. The email send is then claimed via `INSERT OR IGNORE` into `alerts` (PK = slug+threshold) and only sent when `meta.changes === 1`. This makes duplicate milestone emails impossible under concurrency.
4. Bot traffic (UA regex + prefetch headers) increments `bot_clicks`, never `clicks`. Alerts must fire on humans only. **curl's default UA is classified as a bot** — smoke tests must send `-A "Mozilla/5.0 ..."`.
5. Reject link creation for: non-http(s) schemes, uhh.click itself (redirect loop), localhost/private-IP hosts, URLs > 2048 chars.
6. Secrets live in `.dev.vars` locally and `wrangler secret put` in prod. Never in code, never committed (.gitignore covers it).
7. Privacy: never store click IPs or full user agents. Referrer host only, country code only. Creator IPs are stored only as a salted hash, for rate limiting.
