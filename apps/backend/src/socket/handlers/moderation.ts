import type { Socket, Server } from 'socket.io'
import { EVENTS } from '@pokaface/shared'
import type { KickParticipantPayload, ChangeStoryPayload } from '@pokaface/shared'
import {
  getParticipantBySocketAndRoom,
  removeParticipant,
  updateStoryTitle,
  buildRoomState,
  getRoomParticipants,
} from '../../db/queries'

async function getModeratorRow(socket: Socket, roomId: string) {
  const row = await getParticipantBySocketAndRoom(socket.id, roomId)
  if (!row || row.is_moderator !== 1) return null
  return row
}

export function registerModerationHandlers(io: Server, socket: Socket) {
  socket.on(EVENTS.PARTICIPANT_KICK, async (payload: KickParticipantPayload) => {
    try {
      const { roomId, targetParticipantId } = payload

      if (!(await getModeratorRow(socket, roomId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can kick participants' })
        return
      }

      const participants = await getRoomParticipants(roomId)
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

      await removeParticipant(targetParticipantId, roomId)

      io.to(roomId).emit(EVENTS.PARTICIPANT_KICKED, { participantId: targetParticipantId })

      const room = await buildRoomState(roomId)
      if (room) {
        io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to kick participant' })
    }
  })

  socket.on(EVENTS.STORY_CHANGE, async (payload: ChangeStoryPayload) => {
    try {
      const { roomId, storyTitle } = payload

      if (!(await getModeratorRow(socket, roomId))) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'FORBIDDEN', message: 'Only the moderator can change the story' })
        return
      }

      await updateStoryTitle(roomId, storyTitle)

      const room = await buildRoomState(roomId)
      if (room) {
        io.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to change story' })
    }
  })
}
