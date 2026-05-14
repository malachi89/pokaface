'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useIdentity } from '@/hooks/useIdentity'
import { useSocket } from '@/hooks/useSocket'
import { useRoom } from '@/hooks/useRoom'
import { RoomHeader } from '@/components/room/RoomHeader'
import { CardDeck } from '@/components/room/CardDeck'
import { ParticipantList } from '@/components/room/ParticipantList'
import { VoteResults } from '@/components/room/VoteResults'
import { ModeratorPanel } from '@/components/room/ModeratorPanel'
import { ConnectionBadge } from '@/components/room/ConnectionBadge'
import { CopyLinkButton } from '@/components/room/CopyLinkButton'
import type { CardValue } from '@pokaface/shared'

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const router = useRouter()
  const { identity } = useIdentity()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  const { socket, connected, reconnecting } = useSocket(backendUrl)
  const { state, submitVote, startVote, revealVotes, resetVotes, changeStory, kickParticipant } = useRoom(
    params.roomId,
    identity,
    socket,
    connected,
  )

  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null)

  useEffect(() => {
    if (state.error && state.error.includes('removed')) {
      setTimeout(() => router.push('/'), 2000)
    }
  }, [state.error, router])

  useEffect(() => {
    if (state.room && state.room.participants) {
      const myParticipant = state.room.participants.find(p => p.participantId === identity.participantToken)
      if (myParticipant?.hasVoted && !selectedCard) {
        const myVotes = state.room.results?.votes.find(v => v.participantId === identity.participantToken)
        if (myVotes) {
          setSelectedCard(myVotes.card)
        }
      }
    }
  }, [state.room, identity.participantToken, selectedCard])

  if (!connected && !state.room) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-surface-2 rounded-lg mx-auto"></div>
          </div>
          <p className="text-white">Connecting...</p>
        </div>
      </div>
    )
  }

  if (state.error && state.error.includes('removed')) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{state.error}</p>
          <p className="text-surface">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (!state.room) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">Room not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const votedCount = state.room.participants.filter(p => p.hasVoted).length

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div />
          <div className="flex items-center gap-4">
            <ConnectionBadge connected={connected} reconnecting={reconnecting} />
            <CopyLinkButton roomId={params.roomId} />
          </div>
        </div>

        {state.error && !state.error.includes('removed') && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600/30 rounded-lg text-red-400 text-sm">
            {state.error}
          </div>
        )}

        <RoomHeader
          roomId={params.roomId}
          storyTitle={state.room.storyTitle}
          onStoryChange={state.isModerator ? changeStory : undefined}
          participantCount={state.room.participants.length}
          isModerator={state.isModerator}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CardDeck
              selectedCard={selectedCard}
              onSelect={card => {
                setSelectedCard(card)
                submitVote(card)
              }}
              disabled={state.room.phase !== 'voting'}
              revealed={state.room.phase === 'revealed'}
            />

            {state.room.results && state.room.phase === 'revealed' && <VoteResults results={state.room.results} />}
          </div>

          <div className="space-y-8">
            {state.isModerator && (
              <ModeratorPanel
                phase={state.room.phase}
                onStart={() => startVote(state.room!.storyTitle)}
                onReveal={revealVotes}
                onReset={() => {
                  resetVotes()
                  setSelectedCard(null)
                }}
                votedCount={votedCount}
                totalParticipants={state.room.participants.length}
              />
            )}

            <ParticipantList
              participants={state.room.participants}
              onKick={state.isModerator ? kickParticipant : undefined}
              isModerator={state.isModerator}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
