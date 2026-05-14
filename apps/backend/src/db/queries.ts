import { db } from './client'
import type { RoomPhase, ParticipantPublic, VoteResults, RoomState, VoteEntry } from '@pokaface/shared'
import { isNumericCard } from '@pokaface/shared'
import type { CardValue } from '@pokaface/shared'

interface RoomRow {
  room_id: string
  moderator_token: string
  story_title: string
  phase: string
  round_id: string
  created_at: string
  last_activity_at: string
}

interface ParticipantRow {
  participant_id: string
  room_id: string
  name: string
  socket_id: string | null
  card: string | null
  is_connected: number
  is_moderator: number
  joined_at: string
}

function rowToPublic(row: ParticipantRow): ParticipantPublic {
  return {
    participantId: row.participant_id,
    name: row.name,
    hasVoted: row.card !== null,
    isConnected: row.is_connected === 1,
    isModerator: row.is_moderator === 1,
  }
}

function parseCard(raw: string): CardValue {
  if (raw === '?' || raw === '☕') return raw
  return parseInt(raw, 10) as CardValue
}

export function createRoom(params: {
  roomId: string
  moderatorToken: string
  storyTitle: string
  roundId: string
}) {
  db.prepare(`
    INSERT INTO rooms (room_id, moderator_token, story_title, round_id)
    VALUES (@roomId, @moderatorToken, @storyTitle, @roundId)
  `).run(params)
}

export function getRoom(roomId: string): RoomRow | undefined {
  return db.prepare(`SELECT * FROM rooms WHERE room_id = ?`).get(roomId) as RoomRow | undefined
}

export function touchRoom(roomId: string) {
  db.prepare(`UPDATE rooms SET last_activity_at = datetime('now') WHERE room_id = ?`).run(roomId)
}

export function updateRoomPhase(roomId: string, phase: RoomPhase, roundId?: string) {
  if (roundId) {
    db.prepare(`UPDATE rooms SET phase = ?, round_id = ?, last_activity_at = datetime('now') WHERE room_id = ?`)
      .run(phase, roundId, roomId)
  } else {
    db.prepare(`UPDATE rooms SET phase = ?, last_activity_at = datetime('now') WHERE room_id = ?`)
      .run(phase, roomId)
  }
}

export function updateStoryTitle(roomId: string, storyTitle: string) {
  db.prepare(`UPDATE rooms SET story_title = ?, last_activity_at = datetime('now') WHERE room_id = ?`)
    .run(storyTitle, roomId)
}

export function upsertParticipant(params: {
  participantId: string
  roomId: string
  name: string
  socketId: string
  isModerator: boolean
}) {
  const existing = db.prepare(`
    SELECT participant_id FROM participants WHERE participant_id = ? AND room_id = ?
  `).get(params.participantId, params.roomId)

  if (existing) {
    db.prepare(`
      UPDATE participants
      SET socket_id = @socketId, is_connected = 1, name = @name
      WHERE participant_id = @participantId AND room_id = @roomId
    `).run({ socketId: params.socketId, name: params.name, participantId: params.participantId, roomId: params.roomId })
  } else {
    db.prepare(`
      INSERT INTO participants (participant_id, room_id, name, socket_id, is_connected, is_moderator)
      VALUES (@participantId, @roomId, @name, @socketId, 1, @isModerator)
    `).run({ ...params, isModerator: params.isModerator ? 1 : 0 })
  }
}

export function disconnectParticipant(socketId: string) {
  db.prepare(`
    UPDATE participants SET is_connected = 0, socket_id = NULL WHERE socket_id = ?
  `).run(socketId)
}

export function getParticipantBySocket(socketId: string): ParticipantRow | undefined {
  return db.prepare(`SELECT * FROM participants WHERE socket_id = ?`).get(socketId) as ParticipantRow | undefined
}

export function getParticipant(participantId: string, roomId: string): ParticipantRow | undefined {
  return db.prepare(`SELECT * FROM participants WHERE participant_id = ? AND room_id = ?`)
    .get(participantId, roomId) as ParticipantRow | undefined
}

export function setVote(participantId: string, roomId: string, card: CardValue) {
  db.prepare(`UPDATE participants SET card = ? WHERE participant_id = ? AND room_id = ?`)
    .run(String(card), participantId, roomId)
}

export function clearVotes(roomId: string) {
  db.prepare(`UPDATE participants SET card = NULL WHERE room_id = ?`).run(roomId)
}

export function removeParticipant(participantId: string, roomId: string) {
  db.prepare(`DELETE FROM participants WHERE participant_id = ? AND room_id = ?`)
    .run(participantId, roomId)
}

export function getRoomParticipants(roomId: string): ParticipantRow[] {
  return db.prepare(`SELECT * FROM participants WHERE room_id = ? ORDER BY joined_at`).all(roomId) as ParticipantRow[]
}

export function buildRoomState(roomId: string): RoomState | null {
  const room = getRoom(roomId)
  if (!room) return null

  const rows = getRoomParticipants(roomId)
  const participants = rows.map(rowToPublic)

  let results: VoteResults | null = null
  if (room.phase === 'revealed') {
    const votedRows = rows.filter(r => r.card !== null)
    const votes: VoteEntry[] = votedRows.map(r => ({
      participantId: r.participant_id,
      name: r.name,
      card: parseCard(r.card!),
    }))
    results = computeResults(votes)
  }

  return {
    roomId: room.room_id,
    storyTitle: room.story_title,
    phase: room.phase as RoomPhase,
    roundId: room.round_id,
    participants,
    results,
    createdAt: room.created_at,
  }
}

function computeResults(votes: VoteEntry[]): VoteResults {
  const numericVotes = votes.filter(v => isNumericCard(v.card)).map(v => v.card as number)
  const allNumeric = numericVotes.length === votes.length

  const average = allNumeric && votes.length > 0
    ? Math.round((numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10) / 10
    : null

  const dispersion = allNumeric && numericVotes.length > 1
    ? (() => {
        const mean = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
        const variance = numericVotes.reduce((a, b) => a + (b - mean) ** 2, 0) / numericVotes.length
        return Math.round(Math.sqrt(variance) * 10) / 10
      })()
    : null

  const freq = new Map<string, number>()
  for (const v of votes) freq.set(String(v.card), (freq.get(String(v.card)) ?? 0) + 1)
  const maxFreq = Math.max(...freq.values())
  const mode = votes
    .map(v => v.card)
    .filter((c, i, arr) => arr.indexOf(c) === i && freq.get(String(c)) === maxFreq)

  const consensus = votes.length > 0 && mode.length === 1 && freq.get(String(mode[0])) === votes.length

  return { votes, average, mode, dispersion, consensus }
}

export function cleanupOldRooms(ttlDays: number) {
  db.prepare(`
    DELETE FROM rooms WHERE last_activity_at < datetime('now', '-' || ? || ' days')
  `).run(ttlDays)
}
