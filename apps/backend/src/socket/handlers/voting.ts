import type { Socket, Server } from 'socket.io'
import { v4 as uuid } from 'uuid'
import { EVENTS, FIBONACCI_CARDS } from '@pokaface/shared'
import type { SubmitVotePayload, StartVotePayload, RevealVotePayload, ResetVotePayload } from '@pokaface/shared'
import type { CardValue } from '@pokaface/shared'
import {
  getParticipantBySocketAndRoom,
  setVote,
  updateRoomPhase,
  clearVotes,
  buildRoomState,
  touchRoom,
  updateStoryTitle,
} from '../../db/queries'

async function getModeratorParticipant(socket: Socket, roomId: string) {
  const row = await getParticipantBySocketAndRoom(socket.id, roomId)
  if (!row || row.is_moderator !== 1) return null
  return row
}

export function registerVotingHandlers(io: Server, socket: Socket) {
  socket.on(EVENTS.VOTE_START, async (payload: StartVotePayload) => {
    try {
      const { roomId, storyTitle } = payload
      if (!(await getModeratorParticipant(socket, roomId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can start voting' })
        return
      }

      const roundId = uuid()
      await clearVotes(roomId)
      await updateRoomPhase(roomId, 'voting', roundId)

      if (storyTitle !== undefined) {
        await updateStoryTitle(roomId, storyTitle)
      }

      const room = await buildRoomState(roomId)
      if (room) {
        io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to start voting' })
    }
  })

  socket.on(EVENTS.VOTE_SUBMIT, async (payload: SubmitVotePayload) => {
    try {
      const { roomId, card } = payload
      const row = await getParticipantBySocketAndRoom(socket.id, roomId)

      if (!row) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Not in this room' })
        return
      }

      if (row.is_moderator === 1) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Moderators cannot vote' })
        return
      }

      if (!(FIBONACCI_CARDS as CardValue[]).includes(card)) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_CARD', message: 'Invalid card value' })
        return
      }

      await setVote(row.participant_id, roomId, card)
      await touchRoom(roomId)

      const room = await buildRoomState(roomId)
      if (room) {
        io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to submit vote' })
    }
  })

  socket.on(EVENTS.VOTE_REVEAL, async (payload: RevealVotePayload) => {
    try {
      const { roomId } = payload
      if (!(await getModeratorParticipant(socket, roomId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can reveal votes' })
        return
      }

      await updateRoomPhase(roomId, 'revealed')
      const room = await buildRoomState(roomId)

      if (room) {
        io.to(roomId).emit(EVENTS.VOTE_REVEALED, { results: room.results })
        io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to reveal votes' })
    }
  })

  socket.on(EVENTS.VOTE_RESET, async (payload: ResetVotePayload) => {
    try {
      const { roomId } = payload
      if (!(await getModeratorParticipant(socket, roomId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can reset votes' })
        return
      }

      const roundId = uuid()
      await clearVotes(roomId)
      await updateRoomPhase(roomId, 'idle', roundId)

      const room = await buildRoomState(roomId)
      if (room) {
        io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to reset votes' })
    }
  })
}
