const roomSockets = new Map<string, Set<string>>()

export function addSocketToRoom(roomId: string, socketId: string) {
  if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set())
  roomSockets.get(roomId)!.add(socketId)
}

export function removeSocketFromRoom(roomId: string, socketId: string) {
  roomSockets.get(roomId)?.delete(socketId)
}

export function getRoomSocketCount(roomId: string): number {
  return roomSockets.get(roomId)?.size ?? 0
}
