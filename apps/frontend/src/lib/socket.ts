import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(backendUrl: string): Socket {
  if (!socket) {
    socket = io(backendUrl, {
      path: '/socket.io/',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    })
  }
  return socket
}

export function closeSocket() {
  socket?.disconnect()
  socket = null
}
