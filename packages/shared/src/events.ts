import type { CardValue } from './cards'
import type { RoomState, VoteResults } from './types'

export const EVENTS = {
  ROOM_CREATE: 'room:create',
  ROOM_CREATED: 'room:created',
  ROOM_JOIN: 'room:join',
  ROOM_STATE: 'room:state',
  ROOM_UPDATED: 'room:updated',
  ROOM_KICKED: 'room:kicked',
  ROOM_ERROR: 'error',

  VOTE_SUBMIT: 'vote:submit',
  VOTE_START: 'vote:start',
  VOTE_REVEAL: 'vote:reveal',
  VOTE_RESET: 'vote:reset',
  VOTE_REVEALED: 'vote:revealed',

  STORY_CHANGE: 'story:change',

  PARTICIPANT_JOINED: 'participant:joined',
  PARTICIPANT_LEFT: 'participant:left',
  PARTICIPANT_KICK: 'participant:kick',
  PARTICIPANT_KICKED: 'participant:kicked',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

export interface CreateRoomPayload {
  name: string
  participantToken: string
  teamName?: string
  storyTitle?: string
}

export interface JoinRoomPayload {
  roomId: string
  name: string
  participantToken: string
}

export interface SubmitVotePayload {
  roomId: string
  card: CardValue
}

export interface StartVotePayload {
  roomId: string
  storyTitle?: string
}

export interface RevealVotePayload {
  roomId: string
}

export interface ResetVotePayload {
  roomId: string
}

export interface ChangeStoryPayload {
  roomId: string
  storyTitle: string
}

export interface KickParticipantPayload {
  roomId: string
  targetParticipantId: string
}

export interface RoomCreatedPayload {
  room: RoomState
}

export interface RoomStatePayload {
  room: RoomState
}

export interface VoteRevealedPayload {
  results: VoteResults
}

export interface ParticipantKickedPayload {
  participantId: string
}

export interface ErrorPayload {
  code: string
  message: string
}
