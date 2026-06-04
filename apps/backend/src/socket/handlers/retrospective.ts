import type { Server, Socket } from 'socket.io'
import { uniqueNamesGenerator, adjectives, colors } from 'unique-names-generator'
import { v4 as uuid } from 'uuid'
import { EVENTS } from '@pokaface/shared'
import type {
  AddRetrospectiveCardPayload,
  CreateRetrospectivePayload,
  DeleteRetrospectiveCardPayload,
  EditRetrospectiveCardPayload,
  JoinRetrospectivePayload,
  PauseRetrospectiveTimerPayload,
  ResetRetrospectiveTimerPayload,
  StartRetrospectiveTimerPayload,
  ToggleRetrospectiveCardLikePayload,
  UpdateRetrospectiveTimerPayload,
} from '@pokaface/shared'
import {
  addRetrospectiveCard,
  buildRetrospectiveState,
  createRetrospective,
  deleteRetrospectiveCard,
  disconnectRetrospectiveParticipants,
  editRetrospectiveCard,
  getRetrospective,
  getRetrospectiveCard,
  getRetrospectiveParticipantBySocketAndRetro,
  getRetrospectiveParticipants,
  getRetrospectiveParticipantsBySocket,
  isRetrospectiveColumn,
  pauseRetrospectiveTimer,
  resetRetrospectiveTimer,
  startRetrospectiveTimer,
  toggleRetrospectiveCardLike,
  updateRetrospectiveTimerDuration,
  upsertRetrospectiveParticipant,
} from '../../db/retrospectives'

function generateRetroId(): string {
  return uniqueNamesGenerator({ dictionaries: [colors, adjectives], separator: '-', length: 2 })
}

function retroRoom(retroId: string) {
  return `retro:${retroId}`
}

async function emitRetrospectiveState(io: Server, retroId: string) {
  const participants = await getRetrospectiveParticipants(retroId)
  await Promise.all(participants.filter(p => p.socket_id).map(async participant => {
    const retrospective = await buildRetrospectiveState(retroId, participant.participant_id)
    if (retrospective && participant.socket_id) {
      io.to(participant.socket_id).emit(EVENTS.RETRO_UPDATED, { retrospective })
    }
  }))
}

async function getRetrospectiveModerator(socket: Socket, retroId: string) {
  const participant = await getRetrospectiveParticipantBySocketAndRetro(socket.id, retroId)
  if (!participant || participant.is_moderator !== 1) return null
  return participant
}

export function registerRetrospectiveHandlers(io: Server, socket: Socket) {
  socket.on(EVENTS.RETRO_CREATE, async (payload: CreateRetrospectivePayload) => {
    try {
      const { name, participantToken, title = '' } = payload
      if (!name?.trim() || !participantToken) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Name and token are required' })
        return
      }

      const retroId = generateRetroId()
      await createRetrospective({
        retroId,
        title: title.trim(),
        creatorParticipantId: participantToken,
      })
      await upsertRetrospectiveParticipant({
        participantId: participantToken,
        retroId,
        name: name.trim(),
        socketId: socket.id,
        isModerator: true,
      })
      await socket.join(retroRoom(retroId))

      const retrospective = await buildRetrospectiveState(retroId, participantToken)
      if (retrospective) {
        socket.emit(EVENTS.RETRO_CREATED, { retrospective })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to create retrospective' })
    }
  })

  socket.on(EVENTS.RETRO_JOIN, async (payload: JoinRetrospectivePayload) => {
    try {
      const { retroId, name, participantToken } = payload
      if (!retroId || !name?.trim() || !participantToken) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Retrospective ID, name and token are required' })
        return
      }

      const retrospective = await getRetrospective(retroId)
      if (!retrospective) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'RETRO_NOT_FOUND', message: 'Retrospective not found' })
        return
      }

      await upsertRetrospectiveParticipant({
        participantId: participantToken,
        retroId,
        name: name.trim(),
        socketId: socket.id,
        isModerator: retrospective.creator_participant_id === participantToken,
      })
      await socket.join(retroRoom(retroId))

      const state = await buildRetrospectiveState(retroId, participantToken)
      if (state) {
        socket.emit(EVENTS.RETRO_STATE, { retrospective: state })
        await emitRetrospectiveState(io, retroId)
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to join retrospective' })
    }
  })

  socket.on(EVENTS.RETRO_CARD_ADD, async (payload: AddRetrospectiveCardPayload) => {
    try {
      const { retroId, column, body, showAuthor } = payload
      const participant = await getRetrospectiveParticipantBySocketAndRetro(socket.id, retroId)
      if (!participant) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Not in this retrospective' })
        return
      }
      if (!isRetrospectiveColumn(column) || !body?.trim()) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Column and card text are required' })
        return
      }

      await addRetrospectiveCard({
        cardId: uuid(),
        retroId,
        column,
        body: body.trim(),
        authorParticipantId: participant.participant_id,
        showAuthor,
      })
      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to add card' })
    }
  })

  socket.on(EVENTS.RETRO_CARD_EDIT, async (payload: EditRetrospectiveCardPayload) => {
    try {
      const { retroId, cardId, body, showAuthor } = payload
      const participant = await getRetrospectiveParticipantBySocketAndRetro(socket.id, retroId)
      const card = await getRetrospectiveCard(cardId, retroId)
      if (!participant || !card || card.author_participant_id !== participant.participant_id) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the author can edit this card' })
        return
      }
      if (!body?.trim()) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Card text is required' })
        return
      }

      await editRetrospectiveCard(cardId, retroId, body.trim(), showAuthor)
      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to edit card' })
    }
  })

  socket.on(EVENTS.RETRO_CARD_DELETE, async (payload: DeleteRetrospectiveCardPayload) => {
    try {
      const { retroId, cardId } = payload
      const participant = await getRetrospectiveParticipantBySocketAndRetro(socket.id, retroId)
      const card = await getRetrospectiveCard(cardId, retroId)
      const canDelete = participant && card && (participant.is_moderator === 1 || card.author_participant_id === participant.participant_id)
      if (!canDelete) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'You cannot delete this card' })
        return
      }

      await deleteRetrospectiveCard(cardId, retroId)
      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to delete card' })
    }
  })

  socket.on(EVENTS.RETRO_CARD_LIKE_TOGGLE, async (payload: ToggleRetrospectiveCardLikePayload) => {
    try {
      const { retroId, cardId } = payload
      const participant = await getRetrospectiveParticipantBySocketAndRetro(socket.id, retroId)
      const card = await getRetrospectiveCard(cardId, retroId)
      if (!participant || !card) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Not in this retrospective' })
        return
      }

      await toggleRetrospectiveCardLike(cardId, participant.participant_id, retroId)
      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to update like' })
    }
  })

  socket.on(EVENTS.RETRO_TIMER_UPDATE, async (payload: UpdateRetrospectiveTimerPayload) => {
    try {
      const { retroId, durationMs } = payload
      if (!(await getRetrospectiveModerator(socket, retroId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can change the timer' })
        return
      }
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Timer duration must be greater than zero' })
        return
      }

      await updateRetrospectiveTimerDuration(retroId, durationMs)
      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to update timer' })
    }
  })

  socket.on(EVENTS.RETRO_TIMER_START, async (payload: StartRetrospectiveTimerPayload) => {
    try {
      const { retroId } = payload
      if (!(await getRetrospectiveModerator(socket, retroId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can start the timer' })
        return
      }

      const started = await startRetrospectiveTimer(retroId)
      if (!started) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_STATE', message: 'Timer cannot be started' })
        return
      }

      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to start timer' })
    }
  })

  socket.on(EVENTS.RETRO_TIMER_PAUSE, async (payload: PauseRetrospectiveTimerPayload) => {
    try {
      const { retroId } = payload
      if (!(await getRetrospectiveModerator(socket, retroId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can pause the timer' })
        return
      }

      const paused = await pauseRetrospectiveTimer(retroId)
      if (!paused) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'RETRO_NOT_FOUND', message: 'Retrospective not found' })
        return
      }

      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to pause timer' })
    }
  })

  socket.on(EVENTS.RETRO_TIMER_RESET, async (payload: ResetRetrospectiveTimerPayload) => {
    try {
      const { retroId } = payload
      if (!(await getRetrospectiveModerator(socket, retroId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can reset the timer' })
        return
      }

      const reset = await resetRetrospectiveTimer(retroId)
      if (!reset) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'RETRO_NOT_FOUND', message: 'Retrospective not found' })
        return
      }

      await emitRetrospectiveState(io, retroId)
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to reset timer' })
    }
  })

  socket.on('disconnect', async () => {
    try {
      const rows = await getRetrospectiveParticipantsBySocket(socket.id)
      if (!rows.length) return

      await disconnectRetrospectiveParticipants(socket.id)
      for (const row of rows) {
        await emitRetrospectiveState(io, row.retro_id)
      }
    } catch (err) {
      console.error('Retrospective disconnect error:', err)
    }
  })
}
