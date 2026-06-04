import type {
  RetrospectiveCardPublic,
  RetrospectiveColumn,
  RetrospectiveParticipantPublic,
  RetrospectiveState,
  RetrospectiveTimerState,
  RetrospectiveTimerStatus,
} from '@pokaface/shared'
import { allAsync, getAsync, runAsync } from './client'

const VALID_COLUMNS: RetrospectiveColumn[] = ['loved', 'learned', 'lacked', 'longed', 'kudos']
const DEFAULT_RETRO_TIMER_MS = 5 * 60 * 1000

interface RetrospectiveRow {
  retro_id: string
  title: string
  creator_participant_id: string
  timer_duration_ms: number | null
  timer_remaining_ms: number | null
  timer_status: string | null
  timer_started_at: string | null
  created_at: string
  last_activity_at: string
}

export interface RetrospectiveParticipantRow {
  participant_id: string
  retro_id: string
  name: string
  socket_id: string | null
  is_connected: number
  is_moderator: number
  joined_at: string
}

interface RetrospectiveCardRow {
  card_id: string
  retro_id: string
  column_key: RetrospectiveColumn
  body: string
  author_participant_id: string
  author_name: string | null
  show_author: number
  created_at: string
  updated_at: string
  like_count: number
  liked_by_me: number
}

export function isRetrospectiveColumn(value: string): value is RetrospectiveColumn {
  return VALID_COLUMNS.includes(value as RetrospectiveColumn)
}

function normalizeDurationMs(durationMs: number | null | undefined) {
  if (!Number.isFinite(durationMs) || (durationMs ?? 0) <= 0) {
    return DEFAULT_RETRO_TIMER_MS
  }

  return Math.max(1000, Math.floor(durationMs as number))
}

function clampRemainingMs(remainingMs: number | null | undefined, durationMs: number) {
  if (!Number.isFinite(remainingMs)) {
    return durationMs
  }

  return Math.min(durationMs, Math.max(0, Math.floor(remainingMs as number)))
}

function normalizeTimerStatus(status: string | null | undefined): RetrospectiveTimerStatus {
  return status === 'running' ? 'running' : 'idle'
}

function computeTimerSnapshot(retrospective: RetrospectiveRow): RetrospectiveTimerState {
  const durationMs = normalizeDurationMs(retrospective.timer_duration_ms)
  const baseRemainingMs = clampRemainingMs(retrospective.timer_remaining_ms, durationMs)
  const status = normalizeTimerStatus(retrospective.timer_status)

  if (status !== 'running' || !retrospective.timer_started_at) {
    return {
      durationMs,
      remainingMs: baseRemainingMs,
      status: 'idle',
      startedAt: null,
    }
  }

  const startedAtMs = Date.parse(retrospective.timer_started_at)
  if (Number.isNaN(startedAtMs)) {
    return {
      durationMs,
      remainingMs: baseRemainingMs,
      status: 'idle',
      startedAt: null,
    }
  }

  const elapsedMs = Date.now() - startedAtMs
  const remainingMs = Math.max(0, baseRemainingMs - Math.max(0, elapsedMs))

  return {
    durationMs,
    remainingMs,
    status: remainingMs > 0 ? 'running' : 'idle',
    startedAt: remainingMs > 0 ? retrospective.timer_started_at : null,
  }
}

async function persistTimerState(retroId: string, timer: RetrospectiveTimerState) {
  await runAsync(
    `UPDATE retrospectives
      SET timer_duration_ms = ?,
          timer_remaining_ms = ?,
          timer_status = ?,
          timer_started_at = ?
      WHERE retro_id = ?`,
    [timer.durationMs, timer.remainingMs, timer.status, timer.startedAt, retroId],
  )
}

export async function createRetrospective(params: {
  retroId: string
  title: string
  creatorParticipantId: string
}) {
  await runAsync(
    `INSERT INTO retrospectives (retro_id, title, creator_participant_id) VALUES (?, ?, ?)`,
    [params.retroId, params.title, params.creatorParticipantId],
  )
}

export async function getRetrospective(retroId: string): Promise<RetrospectiveRow | undefined> {
  return getAsync(`SELECT * FROM retrospectives WHERE retro_id = ?`, [retroId])
}

export async function touchRetrospective(retroId: string) {
  await runAsync(`UPDATE retrospectives SET last_activity_at = datetime('now') WHERE retro_id = ?`, [retroId])
}

export async function cleanupOldRetrospectives(ttlDays: number) {
  await runAsync(`DELETE FROM retrospectives WHERE last_activity_at < datetime('now', '-' || ? || ' days')`, [ttlDays])
}

export async function upsertRetrospectiveParticipant(params: {
  participantId: string
  retroId: string
  name: string
  socketId: string
  isModerator: boolean
}) {
  const existing = await getAsync(
    `SELECT participant_id FROM retrospective_participants WHERE participant_id = ? AND retro_id = ?`,
    [params.participantId, params.retroId],
  )

  if (existing) {
    await runAsync(
      `UPDATE retrospective_participants SET socket_id = ?, is_connected = 1, name = ? WHERE participant_id = ? AND retro_id = ?`,
      [params.socketId, params.name, params.participantId, params.retroId],
    )
  } else {
    await runAsync(
      `INSERT INTO retrospective_participants (participant_id, retro_id, name, socket_id, is_connected, is_moderator) VALUES (?, ?, ?, ?, 1, ?)`,
      [params.participantId, params.retroId, params.name, params.socketId, params.isModerator ? 1 : 0],
    )
  }
}

export async function disconnectRetrospectiveParticipants(socketId: string) {
  await runAsync(`UPDATE retrospective_participants SET is_connected = 0, socket_id = NULL WHERE socket_id = ?`, [socketId])
}

export async function getRetrospectiveParticipantsBySocket(socketId: string): Promise<RetrospectiveParticipantRow[]> {
  return allAsync(`SELECT * FROM retrospective_participants WHERE socket_id = ?`, [socketId])
}

export async function getRetrospectiveParticipantBySocketAndRetro(socketId: string, retroId: string): Promise<RetrospectiveParticipantRow | undefined> {
  return getAsync(`SELECT * FROM retrospective_participants WHERE socket_id = ? AND retro_id = ?`, [socketId, retroId])
}

export async function getRetrospectiveParticipants(retroId: string): Promise<RetrospectiveParticipantRow[]> {
  return allAsync(`SELECT * FROM retrospective_participants WHERE retro_id = ? ORDER BY joined_at`, [retroId])
}

export async function updateRetrospectiveTimerDuration(retroId: string, durationMs: number) {
  const normalizedDurationMs = normalizeDurationMs(durationMs)
  await runAsync(
    `UPDATE retrospectives
      SET timer_duration_ms = ?,
          timer_remaining_ms = ?,
          timer_status = 'idle',
          timer_started_at = NULL
      WHERE retro_id = ?`,
    [normalizedDurationMs, normalizedDurationMs, retroId],
  )
  await touchRetrospective(retroId)
}

export async function startRetrospectiveTimer(retroId: string) {
  const retrospective = await getRetrospective(retroId)
  if (!retrospective) return false

  const timer = computeTimerSnapshot(retrospective)
  if (timer.remainingMs <= 0) {
    return false
  }

  await persistTimerState(retroId, {
    ...timer,
    status: 'running',
    startedAt: new Date().toISOString(),
  })
  await touchRetrospective(retroId)
  return true
}

export async function pauseRetrospectiveTimer(retroId: string) {
  const retrospective = await getRetrospective(retroId)
  if (!retrospective) return false

  const timer = computeTimerSnapshot(retrospective)
  await persistTimerState(retroId, {
    ...timer,
    status: 'idle',
    startedAt: null,
  })
  await touchRetrospective(retroId)
  return true
}

export async function resetRetrospectiveTimer(retroId: string) {
  const retrospective = await getRetrospective(retroId)
  if (!retrospective) return false

  const durationMs = normalizeDurationMs(retrospective.timer_duration_ms)
  await persistTimerState(retroId, {
    durationMs,
    remainingMs: durationMs,
    status: 'idle',
    startedAt: null,
  })
  await touchRetrospective(retroId)
  return true
}

export async function addRetrospectiveCard(params: {
  cardId: string
  retroId: string
  column: RetrospectiveColumn
  body: string
  authorParticipantId: string
  showAuthor: boolean
}) {
  await runAsync(
    `INSERT INTO retrospective_cards (card_id, retro_id, column_key, body, author_participant_id, show_author) VALUES (?, ?, ?, ?, ?, ?)`,
    [params.cardId, params.retroId, params.column, params.body, params.authorParticipantId, params.showAuthor ? 1 : 0],
  )
  await touchRetrospective(params.retroId)
}

export async function editRetrospectiveCard(cardId: string, retroId: string, body: string, showAuthor: boolean) {
  await runAsync(
    `UPDATE retrospective_cards SET body = ?, show_author = ?, updated_at = datetime('now') WHERE card_id = ? AND retro_id = ?`,
    [body, showAuthor ? 1 : 0, cardId, retroId],
  )
  await touchRetrospective(retroId)
}

export async function deleteRetrospectiveCard(cardId: string, retroId: string) {
  await runAsync(`DELETE FROM retrospective_cards WHERE card_id = ? AND retro_id = ?`, [cardId, retroId])
  await touchRetrospective(retroId)
}

export async function getRetrospectiveCard(cardId: string, retroId: string): Promise<{ author_participant_id: string } | undefined> {
  return getAsync(`SELECT author_participant_id FROM retrospective_cards WHERE card_id = ? AND retro_id = ?`, [cardId, retroId])
}

export async function toggleRetrospectiveCardLike(cardId: string, participantId: string, retroId: string) {
  const existing = await getAsync(
    `SELECT card_id FROM retrospective_card_likes WHERE card_id = ? AND participant_id = ?`,
    [cardId, participantId],
  )

  if (existing) {
    await runAsync(`DELETE FROM retrospective_card_likes WHERE card_id = ? AND participant_id = ?`, [cardId, participantId])
  } else {
    await runAsync(`INSERT INTO retrospective_card_likes (card_id, participant_id) VALUES (?, ?)`, [cardId, participantId])
  }

  await touchRetrospective(retroId)
}

export async function buildRetrospectiveState(retroId: string, requesterParticipantId: string): Promise<RetrospectiveState | null> {
  const retrospective = await getRetrospective(retroId)
  if (!retrospective) return null

  const timer = computeTimerSnapshot(retrospective)
  if (
    timer.durationMs !== normalizeDurationMs(retrospective.timer_duration_ms)
    || timer.remainingMs !== clampRemainingMs(retrospective.timer_remaining_ms, normalizeDurationMs(retrospective.timer_duration_ms))
    || timer.status !== normalizeTimerStatus(retrospective.timer_status)
    || timer.startedAt !== retrospective.timer_started_at
  ) {
    await persistTimerState(retroId, timer)
  }

  const participantRows = await getRetrospectiveParticipants(retroId)
  const requester = participantRows.find(p => p.participant_id === requesterParticipantId)
  const isModerator = requester?.is_moderator === 1
  const participants: RetrospectiveParticipantPublic[] = participantRows.map(row => ({
    participantId: row.participant_id,
    name: row.name,
    isConnected: row.is_connected === 1,
    isModerator: row.is_moderator === 1,
  }))

  const cardRows: RetrospectiveCardRow[] = await allAsync(
    `SELECT
      c.*,
      p.name AS author_name,
      COUNT(l.card_id) AS like_count,
      MAX(CASE WHEN l.participant_id = ? THEN 1 ELSE 0 END) AS liked_by_me
    FROM retrospective_cards c
    LEFT JOIN retrospective_participants p ON p.participant_id = c.author_participant_id AND p.retro_id = c.retro_id
    LEFT JOIN retrospective_card_likes l ON l.card_id = c.card_id
    WHERE c.retro_id = ?
    GROUP BY c.card_id
    ORDER BY c.created_at ASC`,
    [requesterParticipantId, retroId],
  )

  const cards: RetrospectiveCardPublic[] = cardRows.map(row => {
    const isAuthor = row.author_participant_id === requesterParticipantId
    return {
      cardId: row.card_id,
      column: row.column_key,
      body: row.body,
      authorName: row.show_author === 1 ? row.author_name : null,
      showAuthor: row.show_author === 1,
      likeCount: row.like_count,
      likedByMe: row.liked_by_me === 1,
      canEdit: isAuthor,
      canDelete: isAuthor || isModerator,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })

  return {
    retroId: retrospective.retro_id,
    title: retrospective.title,
    participants,
    cards,
    timer,
    createdAt: retrospective.created_at,
  }
}
