import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { config, corsOriginCheck } from '../config'
import { registerRoomHandlers } from './handlers/room'
import { registerVotingHandlers } from './handlers/voting'
import { registerModerationHandlers } from './handlers/moderation'
import { registerRetrospectiveHandlers } from './handlers/retrospective'

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOriginCheck,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  })

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket)
    registerVotingHandlers(io, socket)
    registerModerationHandlers(io, socket)
    registerRetrospectiveHandlers(io, socket)
  })

  return io
}
