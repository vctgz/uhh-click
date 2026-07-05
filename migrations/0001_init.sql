-- uhh.click schema.

CREATE TABLE links (
  slug            TEXT PRIMARY KEY,
  url             TEXT NOT NULL,
  email           TEXT NOT NULL,
  secret          TEXT NOT NULL,              -- manage token (mute now; edit/delete later)
  clicks          INTEGER NOT NULL DEFAULT 0, -- humans only; drives alerts
  bot_clicks      INTEGER NOT NULL DEFAULT 0,
  alerts_muted    INTEGER NOT NULL DEFAULT 0,
  created_ip_hash TEXT,                        -- sha-256(ip + pepper), rate limiting only
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_click_at   TEXT
);

CREATE TABLE alerts (
  slug       TEXT NOT NULL,
  threshold  INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | sent | failed
  resend_id  TEXT,                             -- 'dry-run' in local dev
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (slug, threshold)
);

CREATE TABLE clicks (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  slug     TEXT NOT NULL,
  ts       TEXT NOT NULL DEFAULT (datetime('now')),
  country  TEXT,          -- request.cf.country
  ref_host TEXT,          -- Referer header, host part only
  is_bot   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_clicks_slug_ts ON clicks(slug, ts);
