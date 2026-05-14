'use client'

import { useEffect, useState } from 'react'
import { getSocket, closeSocket } from '@/lib/socket'

export function useSocket(backendUrl: string) {
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)

  useEffect(() => {
    const socket = getSocket(backendUrl)

    const handleConnect = () => {
      setConnected(true)
      setReconnecting(false)
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    const handleReconnecting = () => {
      setReconnecting(true)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('reconnect_attempt', handleReconnecting)

    if (socket.connected) {
      setConnected(true)
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('reconnect_attempt', handleReconnecting)
    }
  }, [backendUrl])

  return { connected, reconnecting, socket: getSocket(backendUrl) }
}
