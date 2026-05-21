import { db, runAsync, getAsync } from './client'

export function logEvent(
  eventType: string,
  roomId?: string,
  participantName?: string
): void {
  try {
    db.prepare(`INSERT INTO events (event_type, room_id, participant_name) VALUES (?, ?, ?)`).run(
      eventType,
      roomId ?? null,
      participantName ?? null,
    )
  } catch (err) {
    console.error('logEvent error:', err)
  }
}

export async function cleanupOldEvents(): Promise<void> {
  await runAsync(`DELETE FROM events WHERE created_at < datetime('now', '-30 days')`)
}

export async function getAdminStats() {
  const [roomsCreated, participantsJoined, activeRooms, roomsTotal, connectedParticipants] = await Promise.all([
    getAsync(`SELECT COUNT(*) as count FROM events WHERE event_type = 'room_created'`),
    getAsync(`SELECT COUNT(*) as count FROM events WHERE event_type = 'participant_joined'`),
    getAsync(`SELECT COUNT(*) as count FROM rooms WHERE last_activity_at > datetime('now', '-1 hour')`),
    getAsync(`SELECT COUNT(*) as count FROM rooms`),
    getAsync(`SELECT COUNT(*) as count FROM participants WHERE is_connected = 1`),
  ])

  return {
    roomsCreated: roomsCreated?.count ?? 0,
    participantsJoined: participantsJoined?.count ?? 0,
    activeRooms: activeRooms?.count ?? 0,
    roomsTotal: roomsTotal?.count ?? 0,
    connectedParticipants: connectedParticipants?.count ?? 0,
  }
}
