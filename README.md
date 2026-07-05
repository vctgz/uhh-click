# uhh.click

> short links that tell you when they blow up.

fun weekend project. it's a url shortener with one twist:
it emails you when a link crosses a click milestone (100 · 250 · 500 · 1k … 100k).
no account, bots filtered out, public stats page per link.

## stack

one cloudflare worker, [hono](https://hono.dev), d1 (sqlite), server-rendered
pages, [resend](https://resend.com) for email. no build step beyond `wrangler`.

## run it

```bash
npm install
npm run migrate:local   # local d1 schema
npm run dev             # http://localhost:8787 (emails dry-run until you set RESEND_API_KEY)
npm test
```

that's it.
