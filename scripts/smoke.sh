#!/usr/bin/env bash
# uhh.click smoke test. Runs the whole loop against local dev in dry-run mode.
#
#   npm run smoke            # uses a running dev server, or starts its own
#   BASE=https://uhh.click npm run smoke   # point at prod (careful: real clicks)
#
# Exits 0 iff every check passes. Uses a unique slug + a forged creator IP each
# run, so it's safe to run repeatedly without tripping the rate limit.
set -uo pipefail

BASE=${BASE:-http://127.0.0.1:8787}
DB=${DB_NAME:-uhh-click}
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
IP="198.51.$((RANDOM % 254 + 1)).$((RANDOM % 254 + 1))"
SLUG="smoke-$RANDOM$RANDOM"
fail=0

we() { CI=1 WRANGLER_SEND_METRICS=false npx wrangler "$@"; }
check() { # label actual expected
  if [ "$2" = "$3" ]; then echo "  ✓ $1"; else echo "  ✗ $1 (got '$2', want '$3')"; fail=$((fail + 1)); fi
}

# ── ensure a dev server is up ────────────────────────────────────────────────
STARTED=0
DEV_PID=""
if ! curl -sf -o /dev/null "$BASE/"; then
  echo "no server at $BASE — starting a local one (dry-run email mode)..."
  we d1 migrations apply "$DB" --local >/dev/null 2>&1
  CI=1 WRANGLER_SEND_METRICS=false npx wrangler dev --port 8787 --ip 127.0.0.1 \
    >/tmp/uhh-smoke-dev.log 2>&1 &
  DEV_PID=$!
  STARTED=1
  for _ in $(seq 1 40); do curl -sf -o /dev/null "$BASE/" && break; sleep 1; done
fi
cleanup() { if [ "$STARTED" = 1 ] && [ -n "$DEV_PID" ]; then kill "$DEV_PID" 2>/dev/null; fi; }
trap cleanup EXIT

echo "smoke → $BASE  (slug=$SLUG, ip=$IP)"

# ── 1. create ────────────────────────────────────────────────────────────────
echo "[1/5] create a link"
BODY=$(curl -s -o /tmp/uhh-smoke.json -w '%{http_code}' -X POST "$BASE/api/links" \
  -H 'Content-Type: application/json' -H "CF-Connecting-IP: $IP" \
  -d "{\"url\":\"https://example.com/smoke\",\"email\":\"smoke@example.com\",\"slug\":\"$SLUG\"}")
check "POST /api/links returns 201" "$BODY" "201"
check "response echoes the slug" "$(grep -o "\"slug\":\"$SLUG\"" /tmp/uhh-smoke.json)" "\"slug\":\"$SLUG\""

# ── 2 + 3. 105 human clicks, then 1 bot click ────────────────────────────────
echo "[2/5] 105 human clicks (browser UA)"
for _ in $(seq 1 105); do curl -s -o /dev/null -A "$UA" "$BASE/$SLUG"; done
echo "[3/5] 1 bot click (curl's default UA is a bot to us)"
curl -s -o /dev/null "$BASE/$SLUG"
sleep 3 # let the deferred waitUntil work drain

STATS=$(curl -s "$BASE/api/links/$SLUG/stats")
check "clicks == 105 (humans)" "$(echo "$STATS" | grep -o '"clicks":[0-9]*' | head -1 | cut -d: -f2)" "105"
check "bot_clicks == 1 (robots)" "$(echo "$STATS" | grep -o '"bot_clicks":[0-9]*' | head -1 | cut -d: -f2)" "1"

# ── 4. exactly one milestone alert, sent, dry-run ────────────────────────────
echo "[4/5] milestone fired exactly once"
ALERT=$(we d1 execute "$DB" --local \
  --command "SELECT threshold||'/'||status||'/'||COALESCE(resend_id,'') AS r FROM alerts WHERE slug='$SLUG'" 2>/dev/null)
check "one 100/sent/dry-run row" "$(echo "$ALERT" | grep -o '100/sent/dry-run' | wc -l | tr -d ' ')" "1"
COUNT=$(we d1 execute "$DB" --local \
  --command "SELECT 'CNT='||COUNT(*) FROM alerts WHERE slug='$SLUG'" 2>/dev/null | grep -oE 'CNT=[0-9]+' | tail -1 | cut -d= -f2)
check "no duplicate alert rows" "$COUNT" "1"

# ── 5. bad URLs rejected ─────────────────────────────────────────────────────
echo "[5/5] dangerous / silly URLs rejected (4xx)"
for u in "ftp://x.com" "http://localhost/x" "https://uhh.click/y"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/links" \
    -H 'Content-Type: application/json' -H "CF-Connecting-IP: $IP" \
    -d "{\"url\":\"$u\",\"email\":\"a@b.co\"}")
  case "$code" in
    4*) echo "  ✓ rejected $u ($code)" ;;
    *) echo "  ✗ $u got $code (want 4xx)"; fail=$((fail + 1)) ;;
  esac
done

echo ""
if [ "$fail" -eq 0 ]; then
  echo "smoke: all good. uhh.click is behaving. 🤖"
  exit 0
else
  echo "smoke: $fail check(s) failed."
  exit 1
fi
