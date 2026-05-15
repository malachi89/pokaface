import { getAsync, allAsync, runAsync } from './client'
import type { RoomPhase, ParticipantPublic, VoteResults, RoomState, VoteEntry } from '@pokaface/shared'
import { isNumericCard } from '@pokaface/shared'
import type { CardValue } from '@pokaface/shared'

interface RoomRow {
  room_id: string
  moderator_token: string
  team_name: string
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

export async function createRoom(params: {
  roomId: string
  moderatorToken: string
  teamName: string
  storyTitle: string
  roundId: string
}) {
  await runAsync(
    `INSERT INTO rooms (room_id, moderator_token, team_name, story_title, round_id) VALUES (?, ?, ?, ?, ?)`,
    [params.roomId, params.moderatorToken, params.teamName, params.storyTitle, params.roundId],
  )
}

export async function getRoom(roomId: string): Promise<RoomRow | undefined> {
  return getAsync(`SELECT * FROM rooms WHERE room_id = ?`, [roomId])
}

export async function touchRoom(roomId: string) {
  await runAsync(`UPDATE rooms SET last_activity_at = datetime('now') WHERE room_id = ?`, [roomId])
}

export async function updateRoomPhase(roomId: string, phase: RoomPhase, roundId?: string) {
  if (roundId) {
    await runAsync(
      `UPDATE rooms SET phase = ?, round_id = ?, last_activity_at = datetime('now') WHERE room_id = ?`,
      [phase, roundId, roomId],
    )
  } else {
    await runAsync(`UPDATE rooms SET phase = ?, last_activity_at = datetime('now') WHERE room_id = ?`, [phase, roomId])
  }
}

export async function updateStoryTitle(roomId: string, storyTitle: string) {
  await runAsync(
    `UPDATE rooms SET story_title = ?, last_activity_at = datetime('now') WHERE room_id = ?`,
    [storyTitle, roomId],
  )
}

export async function upsertParticipant(params: {
  participantId: string
  roomId: string
  name: string
  socketId: string
  isModerator: boolean
}) {
  const existing = await getAsync(
    `SELECT participant_id FROM participants WHERE participant_id = ? AND room_id = ?`,
    [params.participantId, params.roomId],
  )

  if (existing) {
    await runAsync(
      `UPDATE participants SET socket_id = ?, is_connected = 1, name = ? WHERE participant_id = ? AND room_id = ?`,
      [params.socketId, params.name, params.participantId, params.roomId],
    )
  } else {
    await runAsync(
      `INSERT INTO participants (participant_id, room_id, name, socket_id, is_connected, is_moderator) VALUES (?, ?, ?, ?, 1, ?)`,
      [params.participantId, params.roomId, params.name, params.socketId, params.isModerator ? 1 : 0],
    )
  }
}

export async function disconnectParticipant(socketId: string) {
  await runAsync(`UPDATE participants SET is_connected = 0, socket_id = NULL WHERE socket_id = ?`, [socketId])
}

export async function getParticipantBySocket(socketId: string): Promise<ParticipantRow | undefined> {
  return getAsync(`SELECT * FROM participants WHERE socket_id = ?`, [socketId])
}

export async function getParticipantsBySocket(socketId: string): Promise<ParticipantRow[]> {
  return allAsync(`SELECT * FROM participants WHERE socket_id = ?`, [socketId])
}

export async function getParticipantBySocketAndRoom(socketId: string, roomId: string): Promise<ParticipantRow | undefined> {
  return getAsync(`SELECT * FROM participants WHERE socket_id = ? AND room_id = ?`, [socketId, roomId])
}

export async function getParticipant(participantId: string, roomId: string): Promise<ParticipantRow | undefined> {
  return getAsync(`SELECT * FROM participants WHERE participant_id = ? AND room_id = ?`, [participantId, roomId])
}

export async function setVote(participantId: string, roomId: string, card: CardValue) {
  await runAsync(`UPDATE participants SET card = ? WHERE participant_id = ? AND room_id = ?`, [
    String(card),
    participantId,
    roomId,
  ])
}

export async function clearVotes(roomId: string) {
  await runAsync(`UPDATE participants SET card = NULL WHERE room_id = ?`, [roomId])
}

export async function removeParticipant(participantId: string, roomId: string) {
  await runAsync(`DELETE FROM participants WHERE participant_id = ? AND room_id = ?`, [participantId, roomId])
}

export async function getRoomParticipants(roomId: string): Promise<ParticipantRow[]> {
  return allAsync(`SELECT * FROM participants WHERE room_id = ? ORDER BY joined_at`, [roomId])
}

export async function buildRoomState(roomId: string): Promise<RoomState | null> {
  const room = await getRoom(roomId)
  if (!room) return null

  const rows = await getRoomParticipants(roomId)
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
    teamName: room.team_name,
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

  const average = numericVotes.length > 0
    ? Math.round((numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 100) / 100
    : null

  const dispersion = numericVotes.length > 1
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

export async function cleanupOldRooms(ttlDays: number) {
  await runAsync(`DELETE FROM rooms WHERE last_activity_at < datetime('now', '-' || ? || ' days')`, [ttlDays])
}
