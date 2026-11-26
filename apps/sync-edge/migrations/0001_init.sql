-- Sync spaces (ADR-0032). A space holds an app's records for the devices
-- linked to it; nothing here names a person.

CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  app TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  -- The last sequence number given to a record in this space.
  seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX devices_by_space ON devices (space_id);

-- Codes to link a device: only their hash, used once, for ten minutes.
CREATE TABLE pairings (
  code_hash TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces (id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- One row per record: the version that won. Deletions stay as tombstones
-- (deleted = 1, no data) so every device learns of them.
CREATE TABLE records (
  space_id TEXT NOT NULL REFERENCES spaces (id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  seq INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  writer TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  data TEXT,
  bytes INTEGER NOT NULL,
  PRIMARY KEY (space_id, kind, key)
);

CREATE INDEX records_by_seq ON records (space_id, seq);
