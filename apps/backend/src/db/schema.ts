import { db, runAsync } from './client'

export async function runMigrations() {
  const schema = `
    CREATE TABLE IF NOT EXISTS rooms (
      room_id          TEXT PRIMARY KEY,
      moderator_token  TEXT NOT NULL,
      team_name        TEXT NOT NULL DEFAULT '',
      story_title      TEXT NOT NULL DEFAULT '',
      phase            TEXT NOT NULL DEFAULT 'idle',
      round_id         TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      last_activity_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS participants (
      participant_id TEXT NOT NULL,
      room_id        TEXT NOT NULL,
      name           TEXT NOT NULL,
      socket_id      TEXT,
      card           TEXT,
      is_connected   INTEGER NOT NULL DEFAULT 0,
      is_moderator   INTEGER NOT NULL DEFAULT 0,
      joined_at      TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (participant_id, room_id),
      FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id);
    CREATE INDEX IF NOT EXISTS idx_rooms_activity   ON rooms(last_activity_at);

    CREATE TABLE IF NOT EXISTS events (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type       TEXT NOT NULL,
      room_id          TEXT,
      participant_name TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

    CREATE TABLE IF NOT EXISTS retrospectives (
      retro_id              TEXT PRIMARY KEY,
      title                 TEXT NOT NULL DEFAULT '',
      creator_participant_id TEXT NOT NULL,
      timer_duration_ms     INTEGER NOT NULL DEFAULT 300000,
      timer_remaining_ms    INTEGER NOT NULL DEFAULT 300000,
      timer_status          TEXT NOT NULL DEFAULT 'idle',
      timer_started_at      TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      last_activity_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS retrospective_participants (
      participant_id TEXT NOT NULL,
      retro_id       TEXT NOT NULL,
      name           TEXT NOT NULL,
      socket_id      TEXT,
      is_connected   INTEGER NOT NULL DEFAULT 0,
      is_moderator   INTEGER NOT NULL DEFAULT 0,
      joined_at      TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (participant_id, retro_id),
      FOREIGN KEY (retro_id) REFERENCES retrospectives(retro_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retrospective_cards (
      card_id               TEXT PRIMARY KEY,
      retro_id              TEXT NOT NULL,
      column_key            TEXT NOT NULL,
      body                  TEXT NOT NULL,
      author_participant_id TEXT NOT NULL,
      show_author           INTEGER NOT NULL DEFAULT 0,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (retro_id) REFERENCES retrospectives(retro_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retrospective_card_likes (
      card_id        TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (card_id, participant_id),
      FOREIGN KEY (card_id) REFERENCES retrospective_cards(card_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_retro_participants_retro ON retrospective_participants(retro_id);
    CREATE INDEX IF NOT EXISTS idx_retro_participants_socket ON retrospective_participants(socket_id);
    CREATE INDEX IF NOT EXISTS idx_retro_cards_retro ON retrospective_cards(retro_id);
    CREATE INDEX IF NOT EXISTS idx_retrospectives_activity ON retrospectives(last_activity_at);
  `

  db.exec(schema)

  // Safe migration for existing databases — silently ignored if column already exists
  await runAsync(`ALTER TABLE rooms ADD COLUMN team_name TEXT NOT NULL DEFAULT ''`).catch(() => {})
  await runAsync(`ALTER TABLE retrospectives ADD COLUMN timer_duration_ms INTEGER NOT NULL DEFAULT 300000`).catch(() => {})
  await runAsync(`ALTER TABLE retrospectives ADD COLUMN timer_remaining_ms INTEGER NOT NULL DEFAULT 300000`).catch(() => {})
  await runAsync(`ALTER TABLE retrospectives ADD COLUMN timer_status TEXT NOT NULL DEFAULT 'idle'`).catch(() => {})
  await runAsync(`ALTER TABLE retrospectives ADD COLUMN timer_started_at TEXT`).catch(() => {})
}

export async function resetConnections() {
  await runAsync(`UPDATE participants SET is_connected = 0, socket_id = NULL`)
  await runAsync(`UPDATE retrospective_participants SET is_connected = 0, socket_id = NULL`)
}
