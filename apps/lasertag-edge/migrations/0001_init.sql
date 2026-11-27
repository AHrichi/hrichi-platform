-- BARQ's shared data (ADR-0033). Times are ISO-8601 UTC text; ids are UUIDs.
-- Raw match logs will live in R2 files (P2), never in rows: D1's free tier
-- allows 100,000 rows written a day.

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  -- The handle folded for comparison: Nour and nour are one handle.
  handle_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('ar', 'fr', 'en')),
  country TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  minor INTEGER NOT NULL CHECK (minor IN (0, 1)),
  -- 32 random bytes (base64url): the key of the player's rotating badge.
  badge_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE passkeys (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL,
  -- JSON array, e.g. ["internal","hybrid"].
  transports TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);
CREATE INDEX passkeys_player ON passkeys (player_id);

-- A passkey ceremony under way: taken once, swept daily.
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('signup', 'signin', 'recovery')),
  challenge TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  data TEXT
);

CREATE TABLE venues (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  timezone TEXT NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE maps (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues (id),
  name TEXT NOT NULL,
  indoor INTEGER NOT NULL CHECK (indoor IN (0, 1)),
  -- Null until someone measures the place.
  width_m REAL,
  length_m REAL
);

CREATE TABLE gear (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues (id),
  kind TEXT NOT NULL CHECK (kind IN ('vest', 'blaster')),
  label TEXT NOT NULL,
  paired_with TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'charging', 'repair')),
  UNIQUE (venue_id, label)
);

CREATE TABLE venue_staff (
  venue_id TEXT NOT NULL REFERENCES venues (id),
  player_id TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'game-master')),
  since TEXT NOT NULL,
  PRIMARY KEY (venue_id, player_id)
);

CREATE TABLE guests (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues (id),
  nickname TEXT NOT NULL,
  claim_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  claimed_by TEXT REFERENCES players (id) ON DELETE SET NULL
);

CREATE TABLE recoveries (
  hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL REFERENCES venues (id),
  issued_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE play_sessions (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues (id),
  map_id TEXT NOT NULL REFERENCES maps (id),
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  capacity INTEGER NOT NULL
);
CREATE INDEX play_sessions_open ON play_sessions (venue_id) WHERE closed_at IS NULL;

CREATE TABLE checkins (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES play_sessions (id),
  wearer_kind TEXT NOT NULL CHECK (wearer_kind IN ('player', 'guest')),
  wearer_id TEXT NOT NULL,
  vest_id TEXT NOT NULL REFERENCES gear (id),
  blaster_id TEXT REFERENCES gear (id),
  at TEXT NOT NULL,
  released_at TEXT
);
-- One active check-in per vest and per wearer: two staff phones can't both
-- hand out the same vest, whatever order their requests arrive in.
CREATE UNIQUE INDEX checkins_active_vest ON checkins (session_id, vest_id) WHERE released_at IS NULL;
CREATE UNIQUE INDEX checkins_active_wearer ON checkins (session_id, wearer_kind, wearer_id) WHERE released_at IS NULL;
CREATE INDEX checkins_wearer ON checkins (wearer_kind, wearer_id);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  venue_id TEXT,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  subject_id TEXT
);
