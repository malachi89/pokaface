'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useIdentity } from '@/hooks/useIdentity'
import { useSocket } from '@/hooks/useSocket'
import { useRoom } from '@/hooks/useRoom'
import { RoomHeader } from '@/components/room/RoomHeader'
import { CardDeck } from '@/components/room/CardDeck'
import { ParticipantList } from '@/components/room/ParticipantList'
import { ConnectionBadge } from '@/components/room/ConnectionBadge'
import { CopyLinkButton } from '@/components/room/CopyLinkButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PokerTable } from '@/components/room/PokerTable'
import { NameForm } from '@/components/home/NameForm'
import { VoteStartBanner } from '@/components/room/VoteStartBanner'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { CardValue } from '@pokaface/shared'

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001')
  const { socket, connected, reconnecting } = useSocket(backendUrl)
  const isCreating = params.roomId === 'new'
  const { state, submitVote, startVote, revealVotes, resetVotes, changeStory, kickParticipant } = useRoom(
    isCreating ? null : params.roomId,
    identity,
    socket,
    connected,
  )

  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null)
  const [storyTitleInput, setStoryTitleInput] = useState<string | null>(null)
  const displayTitle = state.isModerator && storyTitleInput !== null
    ? storyTitleInput
    : (state.room?.storyTitle ?? '')

  useEffect(() => {
    if (!socket || !isCreating || !connected || !identity.participantToken || !identity.name) return
    const teamName = sessionStorage.getItem('pokaface_team_name') ?? ''
    sessionStorage.removeItem('pokaface_team_name')
    socket.emit('room:create', { name: identity.name, participantToken: identity.participantToken, teamName })
    const handleCreated = ({ room }: { room: { roomId: string } }) => {
      router.replace(`/room/${room.roomId}`)
    }
    socket.on('room:created', handleCreated)
    return () => { socket.off('room:created', handleCreated) }
  }, [socket, connected, isCreating, identity, router])

  useEffect(() => {
    if (state.error && state.error.includes('removed')) {
      setTimeout(() => router.push('/'), 2000)
    }
  }, [state.error, router])

  useEffect(() => {
    if (state.room?.phase === 'idle') {
      setSelectedCard(null)
    }
  }, [state.room?.phase])

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

  if (synced && !identity.name) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">Pokaface</h1>
          <p className="text-muted">Enter your name to join the room</p>
        </div>
        <NameForm defaultName="" onContinue={setName} />
      </div>
    )
  }

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
          <p className="text-muted">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (isCreating || state.connecting) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-surface-2 rounded-lg mx-auto"></div>
          </div>
          <p className="text-white">{isCreating ? 'Creating room…' : 'Joining room…'}</p>
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

  const voters = state.room.participants.filter(p => !p.isModerator && p.isConnected)
  const votedCount = voters.filter(p => p.hasVoted).length

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <VoteStartBanner phase={state.room.phase} roundId={state.room.roundId} />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Avatar seed={identity.name} size={32} />
            <span className="text-sm font-medium text-white">{identity.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ConnectionBadge connected={connected} reconnecting={reconnecting} />
            <span className="text-sm text-muted">Room ID: <code className="text-white">{params.roomId}</code></span>
            <Link href="/"><Button variant="secondary" size="sm">+ New Room</Button></Link>
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
          teamName={state.room.teamName}
          storyTitle={displayTitle}
          onStoryChange={state.isModerator ? (title: string) => {
            setStoryTitleInput(title)
            changeStory(title)
          } : undefined}
          participantCount={state.room.participants.length}
          isModerator={state.isModerator}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PokerTable
              participants={state.room.participants}
              results={state.room.results}
              phase={state.room.phase}
              currentParticipantId={identity.participantToken}
              isModerator={state.isModerator}
              onStart={() => startVote(displayTitle)}
              onReveal={revealVotes}
              onKick={state.isModerator ? kickParticipant : undefined}
              votedCount={votedCount}
              totalVoters={voters.length}
            />

            {!state.isModerator && (
              <CardDeck
                selectedCard={selectedCard}
                onSelect={card => {
                  setSelectedCard(card)
                  submitVote(card)
                }}
                disabled={state.room.phase !== 'voting'}
                revealed={state.room.phase === 'revealed'}
              />
            )}

          </div>

          <div className="space-y-8">
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
