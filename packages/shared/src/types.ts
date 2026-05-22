import type { CardValue } from './cards'

export type RoomPhase = 'idle' | 'voting' | 'revealed'

export interface ParticipantPublic {
  participantId: string
  name: string
  hasVoted: boolean
  isConnected: boolean
  isModerator: boolean
}

export interface VoteEntry {
  participantId: string
  name: string
  card: CardValue
}

export interface VoteResults {
  votes: VoteEntry[]
  average: number | null
  mode: CardValue[]
  dispersion: number | null
  consensus: boolean
}

export interface RoomState {
  roomId: string
  teamName: string
  storyTitle: string
  phase: RoomPhase
  roundId: string
  participants: ParticipantPublic[]
  results: VoteResults | null
  createdAt: string
}

export interface UserIdentity {
  name: string
  participantToken: string
}

export type RetrospectiveColumn = 'loved' | 'learned' | 'lacked' | 'longed' | 'kudos'

export interface RetrospectiveParticipantPublic {
  participantId: string
  name: string
  isConnected: boolean
  isModerator: boolean
}

export interface RetrospectiveCardPublic {
  cardId: string
  column: RetrospectiveColumn
  body: string
  authorName: string | null
  showAuthor: boolean
  likeCount: number
  likedByMe: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

export interface RetrospectiveState {
  retroId: string
  title: string
  participants: RetrospectiveParticipantPublic[]
  cards: RetrospectiveCardPublic[]
  createdAt: string
}
