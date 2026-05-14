import { db } from './client'

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id          TEXT PRIMARY KEY,
      moderator_token  TEXT NOT NULL,
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
  `)
}

export function resetConnections() {
  db.prepare(`UPDATE participants SET is_connected = 0, socket_id = NULL`).run()
}
