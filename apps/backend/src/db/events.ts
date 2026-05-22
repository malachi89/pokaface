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
  const [
    roomsCreated,
    participantsJoined,
    activeRooms,
    roomsTotal,
    connectedParticipants,
    retrospectivesTotal,
    activeRetrospectives,
    retrospectiveParticipantsTotal,
    connectedRetrospectiveParticipants,
    retrospectiveCardsTotal,
    retrospectiveLikesTotal,
  ] = await Promise.all([
    getAsync(`SELECT COUNT(*) as count FROM events WHERE event_type = 'room_created'`),
    getAsync(`SELECT COUNT(*) as count FROM events WHERE event_type = 'participant_joined'`),
    getAsync(`SELECT COUNT(*) as count FROM rooms WHERE last_activity_at > datetime('now', '-1 hour')`),
    getAsync(`SELECT COUNT(*) as count FROM rooms`),
    getAsync(`SELECT COUNT(*) as count FROM participants WHERE is_connected = 1`),
    getAsync(`SELECT COUNT(*) as count FROM retrospectives`),
    getAsync(`SELECT COUNT(*) as count FROM retrospectives WHERE last_activity_at > datetime('now', '-1 hour')`),
    getAsync(`SELECT COUNT(*) as count FROM retrospective_participants`),
    getAsync(`SELECT COUNT(*) as count FROM retrospective_participants WHERE is_connected = 1`),
    getAsync(`SELECT COUNT(*) as count FROM retrospective_cards`),
    getAsync(`SELECT COUNT(*) as count FROM retrospective_card_likes`),
  ])

  return {
    voting: {
      roomsCreated: roomsCreated?.count ?? 0,
      participantsJoined: participantsJoined?.count ?? 0,
      activeRooms: activeRooms?.count ?? 0,
      roomsTotal: roomsTotal?.count ?? 0,
      connectedParticipants: connectedParticipants?.count ?? 0,
    },
    retroboard: {
      retrospectivesTotal: retrospectivesTotal?.count ?? 0,
      activeRetrospectives: activeRetrospectives?.count ?? 0,
      participantsTotal: retrospectiveParticipantsTotal?.count ?? 0,
      connectedParticipants: connectedRetrospectiveParticipants?.count ?? 0,
      cardsTotal: retrospectiveCardsTotal?.count ?? 0,
      likesTotal: retrospectiveLikesTotal?.count ?? 0,
    },
  }
}
