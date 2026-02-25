PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS members (
  guild_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  base_name TEXT,
  last_tag  TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS punches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  start_ts INTEGER NOT NULL,
  end_ts   INTEGER,
  duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  cliente TEXT NOT NULL,
  veiculo TEXT NOT NULL,
  servicos TEXT NOT NULL,
  valor REAL NOT NULL,
  status TEXT NOT NULL,
  created_ts INTEGER NOT NULL,
  closed_ts INTEGER
);

CREATE TABLE IF NOT EXISTS weekly_stats (
  guild_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  os_done INTEGER NOT NULL DEFAULT 0,
  service_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, week_key, user_id)
);