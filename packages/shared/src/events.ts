import type { CardValue } from './cards'
import type {
  RetrospectiveColumn,
  RetrospectiveState,
  RoomState,
  VoteResults,
} from './types'

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

  RETRO_CREATE: 'retro:create',
  RETRO_CREATED: 'retro:created',
  RETRO_JOIN: 'retro:join',
  RETRO_STATE: 'retro:state',
  RETRO_UPDATED: 'retro:updated',
  RETRO_CARD_ADD: 'retro:card:add',
  RETRO_CARD_EDIT: 'retro:card:edit',
  RETRO_CARD_DELETE: 'retro:card:delete',
  RETRO_CARD_LIKE_TOGGLE: 'retro:card:like:toggle',
  RETRO_TIMER_UPDATE: 'retro:timer:update',
  RETRO_TIMER_START: 'retro:timer:start',
  RETRO_TIMER_PAUSE: 'retro:timer:pause',
  RETRO_TIMER_RESET: 'retro:timer:reset',
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

export interface CreateRetrospectivePayload {
  name: string
  participantToken: string
  title?: string
}

export interface JoinRetrospectivePayload {
  retroId: string
  name: string
  participantToken: string
}

export interface AddRetrospectiveCardPayload {
  retroId: string
  column: RetrospectiveColumn
  body: string
  showAuthor: boolean
}

export interface EditRetrospectiveCardPayload {
  retroId: string
  cardId: string
  body: string
  showAuthor: boolean
}

export interface DeleteRetrospectiveCardPayload {
  retroId: string
  cardId: string
}

export interface ToggleRetrospectiveCardLikePayload {
  retroId: string
  cardId: string
}

export interface UpdateRetrospectiveTimerPayload {
  retroId: string
  durationMs: number
}

export interface StartRetrospectiveTimerPayload {
  retroId: string
}

export interface PauseRetrospectiveTimerPayload {
  retroId: string
}

export interface ResetRetrospectiveTimerPayload {
  retroId: string
}

export interface RetrospectiveCreatedPayload {
  retrospective: RetrospectiveState
}

export interface RetrospectiveStatePayload {
  retrospective: RetrospectiveState
}
