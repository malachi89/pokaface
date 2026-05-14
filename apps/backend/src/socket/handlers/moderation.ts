import type { Socket, Server } from 'socket.io'
import { EVENTS } from '@pokaface/shared'
import type { KickParticipantPayload, ChangeStoryPayload } from '@pokaface/shared'
import {
  getParticipantBySocket,
  removeParticipant,
  updateStoryTitle,
  buildRoomState,
  getRoomParticipants,
} from '../../db/queries'

function getModeratorRow(socket: Socket, roomId: string) {
  const row = getParticipantBySocket(socket.id)
  if (!row || row.room_id !== roomId || row.is_moderator !== 1) return null
  return row
}

export function registerModerationHandlers(io: Server, socket: Socket) {
  socket.on(EVENTS.PARTICIPANT_KICK, (payload: KickParticipantPayload) => {
    const { roomId, targetParticipantId } = payload

    if (!getModeratorRow(socket, roomId)) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can kick participants' })
      return
    }

    const participants = getRoomParticipants(roomId)
    const target = participants.find(p => p.participant_id === targetParticipantId)

    if (!target) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'NOT_FOUND', message: 'Participant not found' })
      return
    }

    if (target.is_moderator === 1) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Cannot kick the moderator' })
      return
    }

    if (target.socket_id) {
      io.to(target.socket_id).emit(EVENTS.ROOM_KICKED, { reason: 'You were removed by the moderator' })
    }

    removeParticipant(targetParticipantId, roomId)

    io.to(roomId).emit(EVENTS.PARTICIPANT_KICKED, { participantId: targetParticipantId })

    const room = buildRoomState(roomId)!
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
  })

  socket.on(EVENTS.STORY_CHANGE, (payload: ChangeStoryPayload) => {
    const { roomId, storyTitle } = payload

    if (!getModeratorRow(socket, roomId)) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can change the story' })
      return
    }

    updateStoryTitle(roomId, storyTitle)

    const room = buildRoomState(roomId)!
    io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
  })
}
