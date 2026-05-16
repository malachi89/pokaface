import { db, runAsync, allAsync, getAsync } from './client'

export function logEvent(
  eventType: string,
  roomId?: string,
  participantName?: string
): void {
  db.run(
    `INSERT INTO events (event_type, room_id, participant_name) VALUES (?, ?, ?)`,
    [eventType, roomId ?? null, participantName ?? null],
    (err: Error | null) => { if (err) console.error('logEvent error:', err) }
  )
}

export async function cleanupOldEvents(): Promise<void> {
  await runAsync(`DELETE FROM events WHERE created_at < datetime('now', '-30 days')`)
}

export async function getAdminStats() {
  const [roomsCreated, participantsJoined, activeRooms, recentEvents] = await Promise.all([
    getAsync(`SELECT COUNT(*) as count FROM events WHERE event_type = 'room_created'`),
    getAsync(`SELECT COUNT(*) as count FROM events WHERE event_type = 'participant_joined'`),
    getAsync(`SELECT COUNT(*) as count FROM rooms WHERE last_activity_at > datetime('now', '-1 hour')`),
    allAsync(`SELECT id, event_type, room_id, participant_name, created_at FROM events ORDER BY id DESC LIMIT 50`),
  ])

  return {
    recentEvents,
    totals: {
      roomsCreated: roomsCreated?.count ?? 0,
      participantsJoined: participantsJoined?.count ?? 0,
      activeRooms: activeRooms?.count ?? 0,
    },
  }
}
