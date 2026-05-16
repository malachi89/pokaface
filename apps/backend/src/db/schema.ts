import { db, runAsync, allAsync } from './client'

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
  `

  await new Promise<void>((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  // Safe migration for existing databases — silently ignored if column already exists
  await runAsync(`ALTER TABLE rooms ADD COLUMN team_name TEXT NOT NULL DEFAULT ''`).catch(() => {})
}

export async function resetConnections() {
  await runAsync(`UPDATE participants SET is_connected = 0, socket_id = NULL`)
}
