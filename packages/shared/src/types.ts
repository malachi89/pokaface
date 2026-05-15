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
