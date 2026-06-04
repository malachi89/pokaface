'use client'

import { useCallback, useEffect, useState } from 'react'
import { EVENTS } from '@pokaface/shared'
import type {
  RetrospectiveColumn,
  RetrospectiveState,
  UserIdentity,
} from '@pokaface/shared'
import type { Socket } from 'socket.io-client'

interface UseRetrospectiveState {
  retrospective: RetrospectiveState | null
  isModerator: boolean
  error: string | null
  connecting: boolean
}

const EMPTY_STATE: UseRetrospectiveState = {
  retrospective: null,
  isModerator: false,
  error: null,
  connecting: true,
}

export function useRetrospective(retroId: string | null, identity: UserIdentity, socket: Socket | null, connected: boolean) {
  const [state, setState] = useState<UseRetrospectiveState>(EMPTY_STATE)

  const applyState = useCallback((retrospective: RetrospectiveState) => {
    const me = retrospective.participants.find(p => p.participantId === identity.participantToken)
    setState(prev => ({
      ...prev,
      retrospective,
      isModerator: me?.isModerator ?? false,
      error: null,
      connecting: false,
    }))
  }, [identity.participantToken])

  const joinRetrospective = useCallback(() => {
    if (!socket || !retroId || !identity.participantToken || !identity.name) return
    socket.emit(EVENTS.RETRO_JOIN, {
      retroId,
      name: identity.name,
      participantToken: identity.participantToken,
    })
  }, [socket, retroId, identity])

  const addCard = useCallback((column: RetrospectiveColumn, body: string, showAuthor: boolean) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_CARD_ADD, { retroId, column, body, showAuthor })
  }, [socket, retroId])

  const addColumn = useCallback((title: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_COLUMN_ADD, { retroId, title })
  }, [socket, retroId])

  const updateColumn = useCallback((columnId: string, title: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_COLUMN_UPDATE, { retroId, columnId, title })
  }, [socket, retroId])

  const deleteColumn = useCallback((columnId: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_COLUMN_DELETE, { retroId, columnId })
  }, [socket, retroId])

  const moveColumn = useCallback((columnId: string, targetColumnId: string, position: 'before' | 'after') => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_COLUMN_MOVE, { retroId, columnId, targetColumnId, position })
  }, [socket, retroId])

  const editCard = useCallback((cardId: string, body: string, showAuthor: boolean, ownerName?: string | null) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_CARD_EDIT, { retroId, cardId, body, showAuthor, ownerName })
  }, [socket, retroId])

  const deleteCard = useCallback((cardId: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_CARD_DELETE, { retroId, cardId })
  }, [socket, retroId])

  const toggleLike = useCallback((cardId: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_CARD_LIKE_TOGGLE, { retroId, cardId })
  }, [socket, retroId])

  const addActionItem = useCallback((body: string, showAuthor: boolean, ownerName: string | null, linkedCardIds: string[]) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_ACTION_ITEM_ADD, { retroId, body, showAuthor, ownerName, linkedCardIds })
  }, [socket, retroId])

  const linkActionItem = useCallback((actionItemCardId: string, normalCardId: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_ACTION_ITEM_LINK, { retroId, actionItemCardId, normalCardId })
  }, [socket, retroId])

  const toggleActionItemStatus = useCallback((cardId: string) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_ACTION_ITEM_STATUS_TOGGLE, { retroId, cardId })
  }, [socket, retroId])

  const updateTimer = useCallback((durationMs: number) => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_TIMER_UPDATE, { retroId, durationMs })
  }, [socket, retroId])

  const startTimer = useCallback(() => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_TIMER_START, { retroId })
  }, [socket, retroId])

  const pauseTimer = useCallback(() => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_TIMER_PAUSE, { retroId })
  }, [socket, retroId])

  const resetTimer = useCallback(() => {
    if (!socket || !retroId) return
    socket.emit(EVENTS.RETRO_TIMER_RESET, { retroId })
  }, [socket, retroId])

  useEffect(() => {
    if (!socket) return

    const handleState = (payload: { retrospective: RetrospectiveState }) => applyState(payload.retrospective)
    const handleError = (payload: { code: string; message: string }) => {
      setState(prev => ({ ...prev, error: payload.message, connecting: false }))
    }

    socket.on(EVENTS.RETRO_STATE, handleState)
    socket.on(EVENTS.RETRO_UPDATED, handleState)
    socket.on(EVENTS.ROOM_ERROR, handleError)

    if (connected && retroId && identity.participantToken && identity.name) {
      joinRetrospective()
    }

    return () => {
      socket.off(EVENTS.RETRO_STATE, handleState)
      socket.off(EVENTS.RETRO_UPDATED, handleState)
      socket.off(EVENTS.ROOM_ERROR, handleError)
    }
  }, [socket, connected, retroId, identity, joinRetrospective, applyState])

  return {
    state,
    addCard,
    addColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
    editCard,
    deleteCard,
    toggleLike,
    addActionItem,
    linkActionItem,
    toggleActionItemStatus,
    updateTimer,
    startTimer,
    pauseTimer,
    resetTimer,
  }
}
