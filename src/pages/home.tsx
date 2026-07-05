import type { FC } from 'hono/jsx'
import { FootTag } from './layout'

// Home page — self-contained document with its own copy of the design tokens
// (kept separate from layout.tsx on purpose). Shares only FootTag.

const INK = '#16130F'

export const Home: FC = () => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>uhh.click — short links that tell you when they blow up</title>
      <meta
        name="description"
        content="a url shortener for marketers. paste a link, get a short one, and get an email every time it crosses a click milestone."
      />
      <meta property="og:title" content="uhh.click" />
      <meta property="og:description" content="short links that email you when they blow up." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="uhh.click" />
      <meta name="twitter:description" content="short links that email you when they blow up." />
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
        {/* ambient page blobs */}
        <div class="blob" style="--r:14deg; top:-80px; left:-60px; width:238px; height:238px; background:#C7F04A; border-radius:46% 54% 60% 40%/50% 44% 56% 50%; animation:uhhfloat 11s ease-in-out infinite; opacity:.7;"></div>
        <div class="blob" style="--r:-10deg; bottom:-100px; right:-70px; width:272px; height:272px; background:#57C4FF; border-radius:60% 40% 46% 54%/48% 60% 40% 52%; animation:uhhfloat 13s ease-in-out infinite; opacity:.6;"></div>
        <div class="blob" style="top:70px; right:100px; width:26px; height:26px; background:#FF5B4A; border-radius:50%; animation:uhhfloat 6s ease-in-out infinite;"></div>

        <div class="uhh-wrap">
          <div class="uhh-card">
            {/* floating blobs inside card */}
            <div class="blob" style="--r:12deg; top:-36px; right:50px; width:144px; height:144px; background:#C7F04A; border-radius:46% 54% 60% 40%/50% 44% 56% 50%; animation:uhhfloat 7s ease-in-out infinite;"></div>
            <div class="blob" style="--r:-8deg; bottom:-86px; left:-46px; width:122px; height:122px; background:#57C4FF; border-radius:60% 40% 46% 54%/48% 60% 40% 52%; animation:uhhfloat 9s ease-in-out infinite;"></div>
            <div class="blob" style="top:170px; left:30px; width:22px; height:22px; background:#FF5B4A; border-radius:50%; animation:uhhfloat 5s ease-in-out infinite;"></div>

            <div class="uhh-inner">
              {/* wordmark */}
              <div class="wordmark">
                <span class="wordmark-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M5 2 L5 19 L9.3 15 L12 21 L14.4 19.9 L11.7 14 L18 14 Z" fill={INK} />
                  </svg>
                </span>
                <span class="wordmark-text">uhh.click</span>
              </div>

              <h1 class="uhh-h1">
                short links that tell you <span class="hl">when they blow up.</span>
              </h1>
              <p class="uhh-sub">
                paste a link. get a short one. we email you at every milestone so you can go{' '}
                <span class="sub-accent">"uhh… it's working."</span>
              </p>

              {/* FORM STATE */}
              <div id="form-state">
                <form id="shorten-form" style="text-align:left;">
                  <div id="form-error"></div>

                  <label for="url-a" class="uhh-label">
                    destination url
                  </label>
                  <input id="url-a" type="text" class="uhh-input" placeholder="https://your-campaign.com/landing" />

                  <label for="email-a" class="uhh-label">
                    your email <span class="label-dim">— where milestone alerts land</span>
                  </label>
                  <input id="email-a" type="text" class="uhh-input" placeholder="you@company.com" />

                  <label for="slug-a" class="uhh-label">
                    custom slug <span class="label-dim">— optional, else we pick one</span>
                  </label>
                  <div class="slug-wrap">
                    <span class="slug-prefix">uhh.click/</span>
                    <input
                      id="slug-a"
                      type="text"
                      class="slug-input"
                      placeholder="spring-sale"
                      autocapitalize="off"
                      autocorrect="off"
                      spellcheck={false}
                    />
                  </div>

                  <button id="btn-shorten" type="submit" class="btn-shorten">
                    shorten it →
                  </button>
                </form>
              </div>

              {/* SUCCESS STATE */}
              <div id="success-state" style="display:none;">
                <div class="pop">
                  <div class="success-pill">
                    <span style="font-size:20px;">🎉</span>
                    <span>done. it's live. we'll email you at 100.</span>
                  </div>

                  <div class="short-box">
                    <div id="suc-short" class="short-url"></div>
                    <button id="btn-copy" type="button" class="btn-copy">
                      copy
                    </button>
                  </div>

                  <a id="suc-track" href="#" class="track-link">
                    track it live → <span id="suc-track-text" style="color:#16130F;"></span>
                  </a>

                  <div style="margin-top:26px;">
                    <button id="btn-reset" type="button" class="reset-btn">
                      shorten another →
                    </button>
                  </div>
                </div>
              </div>

              {/* milestones + privacy */}
              <div class="milestones">
                <div class="milestones-label">MILESTONES</div>
                <div class="pills">
                  <span class="pill">100</span>
                  <span class="pill">250</span>
                  <span class="pill">500</span>
                  <span class="pill">1k</span>
                  <span class="pill">2.5k</span>
                  <span class="pill">5k</span>
                  <span class="pill">10k</span>
                  <span class="pill">25k</span>
                  <span class="pill">50k</span>
                  <span class="pill pill-final">100k 🚀</span>
                </div>
                <p class="privacy">
                  no account. we keep a country + referrer per click, never your visitors' IPs.
                  that's it.
                </p>
              </div>

              <FootTag />
            </div>
          </div>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: HOME_JS }} />
    </body>
  </html>
)

const CSS = `
* { box-sizing: border-box; }
body { margin: 0; }
@keyframes uhhfloat { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-22px) rotate(var(--r,0deg)); } }
@keyframes uhhpop { 0% { transform: scale(.82); opacity: 0; } 60% { transform: scale(1.04); } 100% { transform: scale(1); opacity: 1; } }

.uhh-section {
  position: relative; overflow: hidden; display: flex; align-items: flex-start; justify-content: center;
  min-height: 100vh; padding: 44px 20px 128px; background: #EAECF0; font-family: 'Nunito', sans-serif;
}
.blob { position: absolute; border: 3px solid #16130F; }
.uhh-wrap { position: relative; z-index: 5; width: 100%; max-width: 632px; margin: 0 auto; }
.uhh-card {
  position: relative; overflow: hidden; background: #FBFCFE; border: 3px solid #16130F;
  border-radius: 32px; box-shadow: 8px 10px 0 #16130F; padding: 44px 39px 36px;
}
.uhh-inner { position: relative; z-index: 5; max-width: 536px; margin: 0 auto; text-align: center; }

.wordmark { display: inline-flex; align-items: center; gap: 8px; background: #16130F; padding: 8px 15px 8px 12px; border-radius: 999px; margin-bottom: 22px; }
.wordmark-icon { display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center; background: #FF5B4A; border-radius: 8px; box-shadow: 0 0 0 2px #16130F; }
.wordmark-text { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 19px; color: #FFF7ED; letter-spacing: .01em; }

.uhh-h1 { font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 41px; line-height: 1.03; color: #16130F; margin: 0 0 13px; letter-spacing: -.01em; }
.hl { background: #C7F04A; padding: 0 9px; border-radius: 12px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.uhh-sub { font-size: 17px; line-height: 1.5; font-weight: 600; color: #5b5445; margin: 0 auto 26px; max-width: 391px; }
.sub-accent { font-family: 'Fredoka', sans-serif; color: #FF5B4A; font-weight: 600; }

.uhh-label { display: block; font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 13px; color: #16130F; margin: 0 0 6px 4px; }
.label-dim { color: #9a917d; font-weight: 400; }
.uhh-input {
  width: 100%; font-family: 'Nunito', sans-serif; font-weight: 600; font-size: 15px; color: #16130F;
  background: #fff; border: 3px solid #16130F; border-radius: 15px; padding: 12px 14px; margin-bottom: 14px;
  transition: box-shadow .1s;
}
.uhh-input:focus, .slug-wrap:focus-within { outline: none; }
.uhh-input:focus { box-shadow: 4px 4px 0 #C7F04A; }
input::placeholder { color: #b8ad97; }

.slug-wrap { display: flex; align-items: stretch; border: 3px solid #16130F; border-radius: 15px; overflow: hidden; background: #fff; margin-bottom: 17px; transition: box-shadow .1s; }
.slug-wrap:focus-within { box-shadow: 4px 4px 0 #C7F04A; }
.slug-prefix { display: flex; align-items: center; padding: 0 12px; background: #EEF1F6; font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 14px; color: #5b5445; border-right: 3px solid #16130F; }
.slug-input { flex: 1; min-width: 0; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 15px; color: #16130F; background: transparent; border: none; padding: 13px 14px; }

.btn-shorten {
  width: 100%; cursor: pointer; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 17px;
  color: #FFF7ED; background: #FF5B4A; border: 3px solid #16130F; border-radius: 15px; padding: 13px;
  box-shadow: 4px 4px 0 #16130F; transition: transform .1s, box-shadow .1s, background .1s;
}
.btn-shorten:hover { background: #E5402E; }
.btn-shorten:active { transform: translate(5px,5px); box-shadow: 0 0 0 #16130F; }
.btn-shorten:disabled { opacity: .7; cursor: default; }

#form-error {
  display: none; background: #FFE4E0; border: 3px solid #16130F; border-radius: 14px;
  box-shadow: 4px 4px 0 #16130F; padding: 10px 14px; margin-bottom: 17px;
  font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 13px; color: #16130F; text-align: left;
}

.pop { animation: uhhpop .45s cubic-bezier(.2,1.3,.5,1) both; }
.success-pill { display: inline-flex; align-items: center; gap: 8px; background: #C7F04A; border: 3px solid #16130F; border-radius: 999px; padding: 7px 15px; margin-bottom: 17px; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 15px; color: #16130F; }
.short-box { display: flex; align-items: stretch; border: 3px solid #16130F; border-radius: 15px; overflow: hidden; background: #fff; box-shadow: 4px 4px 0 #16130F; }
.short-url { flex: 1; min-width: 0; display: flex; align-items: center; padding: 14px 15px; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 17px; color: #16130F; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-copy { cursor: pointer; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 14px; color: #16130F; background: #57C4FF; border: none; border-left: 3px solid #16130F; padding: 0 19px; transition: background .1s; }
.btn-copy:hover { background: #3fb4f5; }
.track-link { display: inline-block; margin-top: 14px; font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 14px; color: #5b5445; text-decoration: none; border-bottom: 2px dashed #b8ad97; }
.reset-btn { cursor: pointer; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 15px; color: #16130F; background: #FBFCFE; border: 3px solid #16130F; border-radius: 14px; padding: 10px 19px; transition: background .1s; }
.reset-btn:hover { background: #EEF1F6; }

.milestones { margin-top: 27px; padding-top: 19px; border-top: 3px dashed #d8cdb4; }
.milestones-label { font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 12px; color: #9a917d; margin-bottom: 10px; letter-spacing: .04em; }
.pills { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-bottom: 15px; }
.pill { font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 12px; color: #16130F; background: #fff; border: 2px solid #16130F; border-radius: 999px; padding: 4px 11px; }
.pill-final { font-weight: 600; color: #FFF7ED; background: #FF5B4A; }
.privacy { font-size: 12px; line-height: 1.6; font-weight: 600; color: #9a917d; margin: 0; }
.foot-tag { margin-top: 17px; font-family: 'Fredoka', sans-serif; font-weight: 500; font-size: 12px; color: #b8ad97; }
.foot-tag a { color: inherit; text-decoration: underline; }

@media (max-width: 720px) {
  .uhh-section { padding: 30px 14px 136px; }
  .uhh-card { padding: 34px 19px 31px; border-radius: 27px; box-shadow: 7px 8px 0 #16130F; }
  .uhh-h1 { font-size: 31px; }
  .uhh-sub { font-size: 15px; }
}
`

const HOME_JS = `
(function(){
  var f = document.getElementById('shorten-form');
  var formState = document.getElementById('form-state');
  var successState = document.getElementById('success-state');
  var errBox = document.getElementById('form-error');
  var btn = document.getElementById('btn-shorten');
  var current = null;
  function strip(u){ u = String(u); var i = u.indexOf('://'); return i >= 0 ? u.slice(i + 3) : u; }

  f.addEventListener('submit', async function(e){
    e.preventDefault();
    errBox.style.display = 'none';
    btn.disabled = true; btn.textContent = 'working…';
    try {
      var data = {
        url: document.getElementById('url-a').value.trim(),
        email: document.getElementById('email-a').value.trim()
      };
      var slug = document.getElementById('slug-a').value.trim();
      if (slug) data.slug = slug;
      var r = await fetch('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      var j = await r.json();
      if (!r.ok) throw new Error(j.error || 'something broke');
      current = j;
      document.getElementById('suc-short').textContent = strip(j.short_url);
      var track = document.getElementById('suc-track');
      track.href = j.stats_url;
      document.getElementById('suc-track-text').textContent = strip(j.stats_url);
      formState.style.display = 'none';
      successState.style.display = 'block';
    } catch (err) {
      errBox.textContent = 'uhh… ' + err.message;
      errBox.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'shorten it →';
    }
  });

  document.getElementById('btn-copy').addEventListener('click', function(){
    var cp = document.getElementById('btn-copy');
    if (current) { try { navigator.clipboard.writeText(current.short_url); } catch (e) {} }
    cp.textContent = 'copied!';
    setTimeout(function(){ cp.textContent = 'copy'; }, 1600);
  });

  document.getElementById('btn-reset').addEventListener('click', function(){
    ['url-a','email-a','slug-a'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
    successState.style.display = 'none';
    formState.style.display = 'block';
    errBox.style.display = 'none';
  });
})();
`
