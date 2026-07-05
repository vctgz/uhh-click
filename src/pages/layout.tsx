import type { FC, PropsWithChildren } from 'hono/jsx'
import { raw } from 'hono/html'

export type HeadMeta = {
  title: string
  description?: string
  og?: { title: string; description: string; url?: string }
}

// Coral lightning mark — the new brand.
export const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
  '<rect x="1" y="1" width="22" height="22" rx="7" fill="#FF5B4A" stroke="#16130F" stroke-width="2"/>' +
  '<g transform="translate(3.2,2.4) scale(0.72)"><path d="M5 2 L5 19 L9.3 15 L12 21 L14.4 19.9 L11.7 14 L18 14 Z" fill="#16130F"/></g>' +
  '</svg>'

/** Wrap a JSX tree as a full HTML document (doctype + string) for c.html(). */
export const doc = (node: unknown) => raw('<!DOCTYPE html>' + String(node))

/**
 * Shared light shell — playful neo-brutalist design (matches home.tsx tokens).
 * Used by stats/404/mute. Home is its own self-contained document.
 */
export const Layout: FC<PropsWithChildren<{ meta: HeadMeta; wide?: boolean }>> = ({
  meta,
  wide,
  children,
}) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{meta.title}</title>
      {meta.description ? <meta name="description" content={meta.description} /> : null}
      {meta.og ? (
        <>
          <meta property="og:title" content={meta.og.title} />
          <meta property="og:description" content={meta.og.description} />
          <meta property="og:type" content="website" />
          {meta.og.url ? <meta property="og:url" content={meta.og.url} /> : null}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={meta.og.title} />
          <meta name="twitter:description" content={meta.og.description} />
        </>
      ) : null}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </head>
    <body>
      <section class="uhh-section">
        <div class="blob" style="--r:14deg; top:-80px; left:-60px; width:221px; height:221px; background:#C7F04A; border-radius:46% 54% 60% 40%/50% 44% 56% 50%; animation:uhhfloat 11s ease-in-out infinite; opacity:.7;"></div>
        <div class="blob" style="--r:-10deg; bottom:-105px; right:-70px; width:255px; height:255px; background:#57C4FF; border-radius:60% 40% 46% 54%/48% 60% 40% 52%; animation:uhhfloat 13s ease-in-out infinite; opacity:.55;"></div>
        <div class="blob" style="top:60px; right:95px; width:24px; height:24px; background:#FF5B4A; border-radius:50%; animation:uhhfloat 6s ease-in-out infinite;"></div>
        <div class={wide ? 'uhh-wrap wide' : 'uhh-wrap'}>{children}</div>
      </section>
    </body>
  </html>
)

/** The white card with two floating blobs. `center` centers its inner content. */
export const Card: FC<PropsWithChildren<{ center?: boolean }>> = ({ center, children }) => (
  <div class="uhh-card">
    <div class="blob" style="--r:12deg; top:-34px; right:38px; width:128px; height:128px; background:#C7F04A; border-radius:46% 54% 60% 40%/50% 44% 56% 50%; animation:uhhfloat 7s ease-in-out infinite;"></div>
    <div class="blob" style="--r:-8deg; bottom:-76px; left:-40px; width:109px; height:109px; background:#57C4FF; border-radius:60% 40% 46% 54%/48% 60% 40% 52%; animation:uhhfloat 9s ease-in-out infinite;"></div>
    <div class={center ? 'uhh-inner center' : 'uhh-inner'}>{children}</div>
  </div>
)

/** Footer tagline + repo link. Shared by every page so the copy lives once. */
export const FootTag: FC = () => (
  <div class="foot-tag">
    uhh.click — short links that tell you when they blow up ·{' '}
    <a href="https://github.com/vctgz/uhh-click" target="_blank" rel="noopener">
      View on GitHub
    </a>
  </div>
)

/** The pill wordmark, linking home. Optional suffix like "/ stats". */
export const Wordmark: FC<{ suffix?: string }> = ({ suffix }) => (
  <a href="/" class="wordmark">
    <span class="wordmark-icon">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M5 2 L5 19 L9.3 15 L12 21 L14.4 19.9 L11.7 14 L18 14 Z" fill="#16130F" />
      </svg>
    </span>
    <span class="wordmark-text">
      uhh.click{suffix ? <span class="wordmark-suffix"> {suffix}</span> : null}
    </span>
  </a>
)

const CSS = `
:root{
  --bg:#EAECF0; --card:#FBFCFE; --ink:#16130F; --muted:#5b5445; --dim:#9a917d; --faint:#b8ad97;
  --coral:#FF5B4A; --coral-d:#E5402E; --lime:#C7F04A; --blue:#57C4FF; --cream:#FFF7ED; --panel:#EEF1F6;
  --fred:'Fredoka',sans-serif; --nun:'Nunito',sans-serif;
}
*{ box-sizing:border-box; }
body{ margin:0; }
a{ text-decoration:none; color:inherit; }
@keyframes uhhfloat{ 0%,100%{ transform:translateY(0) rotate(var(--r,0deg)); } 50%{ transform:translateY(-22px) rotate(var(--r,0deg)); } }
@keyframes uhhpop{ 0%{ transform:scale(.82); opacity:0; } 60%{ transform:scale(1.04); } 100%{ transform:scale(1); opacity:1; } }

.uhh-section{ position:relative; overflow:hidden; display:flex; align-items:flex-start; justify-content:center; min-height:100vh; padding:48px 24px 150px; background:var(--bg); font-family:var(--nun); }
.blob{ position:absolute; border:3px solid var(--ink); }
.uhh-wrap{ position:relative; z-index:5; width:100%; max-width:476px; margin:0 auto; }
.uhh-wrap.wide{ max-width:612px; }
.uhh-card{ position:relative; overflow:hidden; background:var(--card); border:3px solid var(--ink); border-radius:34px; box-shadow:10px 12px 0 var(--ink); padding:37px 37px 34px; }
.uhh-inner{ position:relative; z-index:5; }
.uhh-inner.center{ text-align:center; max-width:460px; margin:0 auto; }

.wordmark{ display:inline-flex; align-items:center; gap:9px; background:var(--ink); padding:9px 18px 9px 14px; border-radius:999px; margin-bottom:18px; }
.wordmark-icon{ display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; background:var(--coral); border-radius:9px; box-shadow:0 0 0 2px var(--ink); }
.wordmark-text{ font-family:var(--fred); font-weight:600; font-size:20px; color:var(--cream); letter-spacing:.01em; }
.wordmark-suffix{ color:var(--faint); }

.uhh-h1{ font-family:var(--fred); font-weight:700; font-size:38px; line-height:1.05; color:var(--ink); margin:4px 0 12px; letter-spacing:-.01em; }
.hl{ background:var(--lime); padding:0 10px; border-radius:12px; -webkit-box-decoration-break:clone; box-decoration-break:clone; }
.hl-coral{ background:var(--coral); color:var(--cream); padding:0 10px; border-radius:12px; -webkit-box-decoration-break:clone; box-decoration-break:clone; }
.uhh-lead{ font-family:var(--nun); font-weight:600; font-size:18px; line-height:1.5; color:var(--muted); margin:0 0 24px; }
.uhh-lead a{ color:var(--coral); border-bottom:2px solid var(--lime); }
.uhh-lead b{ color:var(--ink); }

.btn{ display:inline-block; cursor:pointer; font-family:var(--fred); font-weight:600; border:3px solid var(--ink); border-radius:18px; transition:transform .1s, box-shadow .1s, background .1s; }
.btn-primary{ background:var(--coral); color:var(--cream); box-shadow:5px 5px 0 var(--ink); padding:13px 22px; font-size:18px; }
.btn-primary:hover{ background:var(--coral-d); }
.btn-primary:active{ transform:translate(5px,5px); box-shadow:0 0 0 var(--ink); }
.btn-ghost{ background:var(--card); color:var(--ink); padding:11px 20px; font-size:16px; }
.btn-ghost:hover{ background:var(--panel); }

/* ── stats ── */
.stats-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.big{ font-family:var(--fred); font-weight:700; font-size:55px; line-height:1; color:var(--coral); letter-spacing:-.02em; }
.big-label{ font-family:var(--nun); font-weight:700; color:var(--muted); font-size:15px; margin-top:6px; }
.muted-badge{ font-family:var(--fred); font-weight:500; font-size:12px; color:var(--muted); background:var(--panel); border:2px solid var(--ink); border-radius:999px; padding:4px 12px; white-space:nowrap; }
.dest{ font-family:var(--nun); font-weight:600; font-size:14px; color:var(--dim); margin-top:10px; word-break:break-all; }
.dest a{ color:var(--muted); border-bottom:2px solid #e3dcc9; }

.stat-row{ display:flex; gap:12px; flex-wrap:wrap; margin-top:22px; }
.stat{ flex:1; min-width:120px; background:#fff; border:3px solid var(--ink); border-radius:18px; box-shadow:4px 4px 0 var(--ink); padding:14px 16px; }
.stat .n{ font-family:var(--fred); font-weight:700; font-size:26px; color:var(--ink); }
.stat.hot .n{ color:var(--coral); }
.stat .k{ font-family:var(--nun); font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--dim); margin-top:2px; }

.sechead{ font-family:var(--fred); font-weight:500; font-size:13px; letter-spacing:.06em; text-transform:uppercase; color:var(--dim); margin:24px 0 12px; }

.prog{ display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.prog-track{ flex:1; height:26px; background:#fff; border:3px solid var(--ink); border-radius:999px; overflow:hidden; }
.prog-fill{ height:100%; background:var(--lime); border-right:3px solid var(--ink); }
.prog-label{ font-family:var(--fred); font-weight:600; font-size:14px; color:var(--ink); white-space:nowrap; }

.pills{ display:flex; flex-wrap:wrap; gap:8px; }
.pill{ font-family:var(--fred); font-weight:500; font-size:14px; color:var(--ink); background:#fff; border:2px solid var(--ink); border-radius:999px; padding:5px 13px; }
.pill.done{ background:var(--lime); }
.pill.next{ background:var(--coral); color:var(--cream); font-weight:600; }

.chart{ display:flex; align-items:flex-end; gap:8px; height:132px; }
.chart .col{ flex:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:6px; height:100%; }
.chart .cn{ font-family:var(--fred); font-weight:600; font-size:11px; color:var(--muted); }
.chart .barv{ width:100%; background:var(--lime); border:2px solid var(--ink); border-radius:7px 7px 0 0; min-height:4px; }
.chart .cd{ font-family:var(--nun); font-weight:600; font-size:10px; color:var(--dim); }

.kv{ display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:2px dashed #d8cdb4; }
.kv .k{ font-family:var(--nun); font-weight:700; font-size:14px; color:var(--ink); word-break:break-all; }
.kv .v{ font-family:var(--fred); font-weight:600; font-size:13px; color:var(--ink); background:var(--panel); border:2px solid var(--ink); border-radius:999px; padding:2px 11px; margin-left:12px; }
.empty-note{ font-family:var(--nun); font-weight:600; font-size:14px; color:var(--dim); padding:4px 0; }

.honest{ font-family:var(--nun); font-weight:600; font-size:12px; color:var(--dim); margin-top:26px; padding-top:18px; border-top:2px dashed #d8cdb4; }
.foot-tag{ text-align:center; margin-top:22px; font-family:var(--fred); font-weight:500; font-size:13px; color:var(--faint); }
.foot-tag a{ color:inherit; text-decoration:underline; }

@media (max-width:600px){
  .uhh-section{ padding:36px 16px 140px; }
  .uhh-card{ padding:32px 22px 30px; border-radius:30px; box-shadow:8px 10px 0 var(--ink); }
  .big{ font-size:52px; }
  .uhh-h1{ font-size:34px; }
}
`
