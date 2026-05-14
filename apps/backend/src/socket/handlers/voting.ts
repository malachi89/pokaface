import type { Socket, Server } from 'socket.io'
import { v4 as uuid } from 'uuid'
import { EVENTS, FIBONACCI_CARDS } from '@pokaface/shared'
import type { SubmitVotePayload, StartVotePayload, RevealVotePayload, ResetVotePayload } from '@pokaface/shared'
import type { CardValue } from '@pokaface/shared'
import {
  getParticipantBySocket,
  getParticipant,
  setVote,
  updateRoomPhase,
  clearVotes,
  buildRoomState,
  touchRoom,
} from '../../db/queries'

function getModeratorParticipant(socket: Socket, roomId: string) {
  const row = getParticipantBySocket(socket.id)
  if (!row || row.room_id !== roomId || row.is_moderator !== 1) return null
  return row
}

export function registerVotingHandlers(io: Server, socket: Socket) {
  socket.on(EVENTS.VOTE_START, (payload: StartVotePayload) => {
    const { roomId, storyTitle } = payload
    if (!getModeratorParticipant(socket, roomId)) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can start voting' })
      return
    }

    const roundId = uuid()
    clearVotes(roomId)
    updateRoomPhase(roomId, 'voting', roundId)

    if (storyTitle !== undefined) {
      const { updateStoryTitle } = require('../../db/queries')
      updateStoryTitle(roomId, storyTitle)
    }

    const room = buildRoomState(roomId)!
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
  })

  socket.on(EVENTS.VOTE_SUBMIT, (payload: SubmitVotePayload) => {
    const { roomId, card } = payload
    const row = getParticipantBySocket(socket.id)

    if (!row || row.room_id !== roomId) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Not in this room' })
      return
    }

    if (!(FIBONACCI_CARDS as CardValue[]).includes(card)) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_CARD', message: 'Invalid card value' })
      return
    }

    setVote(row.participant_id, roomId, card)
    touchRoom(roomId)

    const room = buildRoomState(roomId)!
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
  })

  socket.on(EVENTS.VOTE_REVEAL, (payload: RevealVotePayload) => {
    const { roomId } = payload
    if (!getModeratorParticipant(socket, roomId)) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can reveal votes' })
      return
    }

    updateRoomPhase(roomId, 'revealed')
    const room = buildRoomState(roomId)!

    io.to(roomId).emit(EVENTS.VOTE_REVEALED, { results: room.results })
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
  })

  socket.on(EVENTS.VOTE_RESET, (payload: ResetVotePayload) => {
    const { roomId } = payload
    if (!getModeratorParticipant(socket, roomId)) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can reset votes' })
      return
    }

    const roundId = uuid()
    clearVotes(roomId)
    updateRoomPhase(roomId, 'idle', roundId)

    const room = buildRoomState(roomId)!
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
  })
}
