'use client'

import { useEffect, useState, useCallback } from 'react'
import { EVENTS } from '@pokaface/shared'
import type { RoomState, UserIdentity } from '@pokaface/shared'
import type { Socket } from 'socket.io-client'

export interface UseRoomState {
  room: RoomState | null
  isModerator: boolean
  myVote: string | null
  hasVoted: boolean
  error: string | null
  connecting: boolean
}

const EMPTY_STATE: UseRoomState = {
  room: null,
  isModerator: false,
  myVote: null,
  hasVoted: false,
  error: null,
  connecting: true,
}

export function useRoom(roomId: string | null, identity: UserIdentity, socket: Socket | null, connected: boolean) {
  const [state, setState] = useState<UseRoomState>(EMPTY_STATE)

  const joinRoom = useCallback(() => {
    if (!socket || !roomId || !identity.participantToken || !identity.name) return

    socket.emit(EVENTS.ROOM_JOIN, {
      roomId,
      name: identity.name,
      participantToken: identity.participantToken,
    })
  }, [socket, roomId, identity])

  const submitVote = useCallback(
    (card: any) => {
      if (!socket || !roomId) return
      socket.emit(EVENTS.VOTE_SUBMIT, { roomId, card })
      setState(prev => ({ ...prev, myVote: String(card) }))
    },
    [socket, roomId],
  )

  const startVote = useCallback(
    (storyTitle?: string) => {
      if (!socket || !roomId) return
      socket.emit(EVENTS.VOTE_START, { roomId, storyTitle })
    },
    [socket, roomId],
  )

  const revealVotes = useCallback(() => {
    if (!socket || !roomId) return
    socket.emit(EVENTS.VOTE_REVEAL, { roomId })
  }, [socket, roomId])

  const resetVotes = useCallback(() => {
    if (!socket || !roomId) return
    socket.emit(EVENTS.VOTE_RESET, { roomId })
    setState(prev => ({ ...prev, myVote: null }))
  }, [socket, roomId])

  const changeStory = useCallback(
    (storyTitle: string) => {
      if (!socket || !roomId) return
      socket.emit(EVENTS.STORY_CHANGE, { roomId, storyTitle })
    },
    [socket, roomId],
  )

  const kickParticipant = useCallback(
    (participantId: string) => {
      if (!socket || !roomId) return
      socket.emit(EVENTS.PARTICIPANT_KICK, { roomId, targetParticipantId: participantId })
    },
    [socket, roomId],
  )

  useEffect(() => {
    if (!socket) return

    const handleRoomState = (payload: { room: RoomState }) => {
      const myParticipant = payload.room.participants.find(p => p.participantId === identity.participantToken)
      setState(prev => ({
        ...prev,
        room: payload.room,
        isModerator: myParticipant?.isModerator ?? false,
        hasVoted: myParticipant?.hasVoted ?? false,
        myVote: myParticipant?.hasVoted ? myParticipant.name : null,
        connecting: false,
        error: null,
      }))
    }

    const handleRoomUpdated = (payload: { room: RoomState }) => {
      const myParticipant = payload.room.participants.find(p => p.participantId === identity.participantToken)
      setState(prev => ({
        ...prev,
        room: payload.room,
        isModerator: myParticipant?.isModerator ?? false,
        hasVoted: myParticipant?.hasVoted ?? false,
      }))
    }

    const handleRoomKicked = () => {
      setState(prev => ({
        ...prev,
        error: 'You have been removed from the room',
        room: null,
      }))
    }

    const handleError = (payload: { code: string; message: string }) => {
      setState(prev => ({ ...prev, error: payload.message, connecting: false }))
    }

    socket.on(EVENTS.ROOM_STATE, handleRoomState)
    socket.on(EVENTS.ROOM_UPDATED, handleRoomUpdated)
    socket.on(EVENTS.ROOM_KICKED, handleRoomKicked)
    socket.on(EVENTS.ROOM_ERROR, handleError)

    if (connected && roomId && identity.participantToken) {
      joinRoom()
    }

    return () => {
      socket.off(EVENTS.ROOM_STATE, handleRoomState)
      socket.off(EVENTS.ROOM_UPDATED, handleRoomUpdated)
      socket.off(EVENTS.ROOM_KICKED, handleRoomKicked)
      socket.off(EVENTS.ROOM_ERROR, handleError)
    }
  }, [socket, connected, roomId, identity, joinRoom])

  return {
    state,
    submitVote,
    startVote,
    revealVotes,
    resetVotes,
    changeStory,
    kickParticipant,
  }
}
