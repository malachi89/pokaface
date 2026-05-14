import type { Socket, Server } from 'socket.io'
import { nanoid } from 'nanoid'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { EVENTS } from '@pokaface/shared'
import type { CreateRoomPayload, JoinRoomPayload } from '@pokaface/shared'
import {
  createRoom,
  getRoom,
  upsertParticipant,
  disconnectParticipant,
  getParticipantBySocket,
  buildRoomState,
} from '../../db/queries'
import { addSocketToRoom, removeSocketFromRoom } from '../rooms'
import { config } from '../../config'

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on(EVENTS.ROOM_CREATE, async (payload: CreateRoomPayload) => {
    try {
      const { name, participantToken, storyTitle = '' } = payload

      if (!name?.trim() || !participantToken) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Name and token are required' })
        return
      }

      const roomId = nanoid(10)
      const roundId = uuid()
      const moderatorToken = await bcrypt.hash(participantToken, config.bcryptRounds)

      await createRoom({ roomId, moderatorToken, storyTitle, roundId })
      await upsertParticipant({
        participantId: participantToken,
        roomId,
        name: name.trim(),
        socketId: socket.id,
        isModerator: true,
      })
      addSocketToRoom(roomId, socket.id)

      await socket.join(roomId)

      const room = await buildRoomState(roomId)
      if (room) {
        socket.emit(EVENTS.ROOM_CREATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to create room' })
    }
  })

  socket.on(EVENTS.ROOM_JOIN, async (payload: JoinRoomPayload) => {
    try {
      const { roomId, name, participantToken } = payload

      if (!roomId || !name?.trim() || !participantToken) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'INVALID_PAYLOAD', message: 'Room ID, name and token are required' })
        return
      }

      const roomRecord = await getRoom(roomId)
      if (!roomRecord) {
        socket.emit(EVENTS.ROOM_ERROR, { code: 'ROOM_NOT_FOUND', message: 'Room not found' })
        return
      }

      await upsertParticipant({
        participantId: participantToken,
        roomId,
        name: name.trim(),
        socketId: socket.id,
        isModerator: false,
      })
      addSocketToRoom(roomId, socket.id)

      await socket.join(roomId)

      const room = await buildRoomState(roomId)
      if (room) {
        socket.emit(EVENTS.ROOM_STATE, { room })
        socket.to(roomId).emit(EVENTS.ROOM_UPDATED, { room })
      }
    } catch (err) {
      socket.emit(EVENTS.ROOM_ERROR, { code: 'ERROR', message: 'Failed to join room' })
    }
  })

  socket.on('disconnect', async () => {
    try {
      const row = await getParticipantBySocket(socket.id)
      if (!row) return

      await disconnectParticipant(socket.id)
      removeSocketFromRoom(row.room_id, socket.id)

      io.to(row.room_id).emit(EVENTS.PARTICIPANT_LEFT, { participantId: row.participant_id })
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  })
}
