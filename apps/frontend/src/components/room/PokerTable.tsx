'use client'

import type { ParticipantPublic, VoteResults, RoomPhase, CardValue } from '@pokaface/shared'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface PokerTableProps {
  participants: ParticipantPublic[]
  results: VoteResults | null
  phase: RoomPhase
  currentParticipantId: string
  isModerator: boolean
  onStart?: () => void
  onReveal?: () => void
  onKick?: (participantId: string) => void
  votedCount: number
  totalVoters: number
}

function MiniCard({ value, voted, phase }: { value: CardValue | null; voted: boolean; phase: RoomPhase }) {
  if (phase === 'idle') {
    return <div className="w-12 h-16 rounded border border-dashed border-surface-3 opacity-30" />
  }

  if (phase === 'revealed' && value !== null) {
    return (
      <div className="w-12 h-16 rounded border-2 border-brand bg-surface-1 flex items-center justify-center">
        <span className="text-brand font-bold text-xl">{String(value)}</span>
      </div>
    )
  }

  if (voted) {
    return (
      <div className="w-12 h-16 rounded bg-brand border-2 border-brand-light flex items-center justify-center">
        <span className="text-2xl">👍</span>
      </div>
    )
  }

  return <div className="w-12 h-16 rounded border-2 border-dashed border-surface-3 opacity-40" />
}

interface SeatProps {
  participant: ParticipantPublic
  voteValue: CardValue | null
  phase: RoomPhase
  isCurrent: boolean
  isModView: boolean
  onKick?: (id: string) => void
  position: 'top' | 'bottom'
}

function Seat({ participant, voteValue, phase, isCurrent, isModView, onKick, position }: SeatProps) {
  const canKick = isModView && !participant.isModerator && onKick

  return (
    <div
      className={`relative group flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition-all ${
        isCurrent
          ? 'border-brand ring-2 ring-brand ring-offset-2 ring-offset-surface bg-brand/5'
          : 'border-surface-3 bg-surface-2/50'
      }`}
    >
      {canKick && (
        <button
          onClick={() => onKick!(participant.participantId)}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs leading-none items-center justify-center hidden group-hover:flex z-10"
          title="Kick"
        >
          ×
        </button>
      )}

      {position === 'top' ? (
        <>
          <Avatar seed={participant.name} size={40} />
          <span className="text-xs text-muted max-w-[64px] truncate text-center leading-tight" title={participant.name}>{participant.name}</span>
          <MiniCard value={voteValue} voted={participant.hasVoted} phase={phase} />
        </>
      ) : (
        <>
          <MiniCard value={voteValue} voted={participant.hasVoted} phase={phase} />
          <Avatar seed={participant.name} size={40} />
          <span className="text-xs text-muted max-w-[64px] truncate text-center leading-tight" title={participant.name}>{participant.name}</span>
        </>
      )}
    </div>
  )
}

function ModeratorSeat({ participant, isCurrent }: { participant: ParticipantPublic; isCurrent: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition-all ${
        isCurrent
          ? 'border-brand ring-2 ring-brand ring-offset-2 ring-offset-surface bg-brand/5'
          : 'border-surface-3 bg-surface-2/50'
      }`}
    >
      <Avatar seed={participant.name} size={40} />
      <span className="text-xs text-muted max-w-[64px] truncate text-center leading-tight" title={participant.name}>{participant.name}</span>
      <span className="text-[9px] text-brand font-semibold uppercase tracking-wide">mod</span>
    </div>
  )
}

function TableCenter({
  phase,
  isModerator,
  votedCount,
  totalVoters,
  results,
  onStart,
  onReveal,
}: Pick<PokerTableProps, 'phase' | 'isModerator' | 'votedCount' | 'totalVoters' | 'results' | 'onStart' | 'onReveal'>) {
  return (
    <div className="flex-1 mx-4 min-h-36 bg-surface-2 border border-white/10 rounded-[40px] flex flex-col items-center justify-center gap-3 px-6 py-5 shadow-inner">
      {phase === 'idle' && (
        <>
          <p className="text-muted text-sm">Waiting to start</p>
          {isModerator && onStart && (
            <Button onClick={onStart} variant="primary" size="sm">
              Start Voting
            </Button>
          )}
        </>
      )}

      {phase === 'voting' && (
        <>
          {isModerator ? (
            <>
              <p className="text-white font-semibold text-lg">
                {votedCount} <span className="text-muted font-normal text-sm">/ {totalVoters} voted</span>
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalVoters }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < votedCount ? 'bg-brand' : 'bg-surface-3'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted text-sm">Cast your vote</p>
          )}
          {isModerator && onReveal && (
            <div className="flex gap-2 mt-1">
              <Button onClick={onReveal} variant="primary" size="sm">
                Reveal
              </Button>
            </div>
          )}
        </>
      )}

      {phase === 'revealed' && (
        <>
          {results?.average !== null && results?.average !== undefined ? (
            <div className="text-center">
              <p className="text-muted text-xs uppercase tracking-wide mb-1">Average</p>
              <p className="text-white text-3xl font-bold">{String(Number(results.average.toFixed(2)))}</p>
              {results.consensus && (
                <p className="text-green-400 text-xs mt-1">Vote completed</p>
              )}
            </div>
          ) : (
            <p className="text-muted text-sm">No numeric votes</p>
          )}
          {isModerator && onStart && (
            <div className="flex gap-2 mt-1">
              <Button onClick={onStart} variant="primary" size="sm">
                Next Story
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function PokerTable({
  participants,
  results,
  phase,
  currentParticipantId,
  isModerator,
  onStart,
  onReveal,
  onKick,
  votedCount,
  totalVoters,
}: PokerTableProps) {
  const connected = participants.filter(p => p.isConnected)
  const moderators = connected.filter(p => p.isModerator)
  const voters = [...connected.filter(p => !p.isModerator)].sort((a, b) =>
    a.participantId.localeCompare(b.participantId)
  )
  const topCount = Math.ceil(voters.length / 2)
  const topVoters = voters.slice(0, topCount)
  const bottomVoters = voters.slice(topCount)

  const voteMap = new Map<string, CardValue>(
    results?.votes.map(v => [v.participantId, v.card]) ?? []
  )

  const renderVoterRow = (row: ParticipantPublic[], position: 'top' | 'bottom') => (
    <div className="flex justify-center gap-2 flex-wrap">
      {row.map(p => (
        <Seat
          key={p.participantId}
          participant={p}
          voteValue={voteMap.get(p.participantId) ?? null}
          phase={phase}
          isCurrent={p.participantId === currentParticipantId}
          isModView={isModerator}
          onKick={onKick}
          position={position}
        />
      ))}
    </div>
  )

  return (
    <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: 'auto 1fr' }}>
      {/* Row 1: empty placeholder + top voters */}
      <div />
      {renderVoterRow(topVoters, 'top')}

      {/* Row 2: moderator + table (same row = always aligned) */}
      <div className="flex flex-col items-center justify-center gap-3">
        {moderators.map(m => (
          <ModeratorSeat
            key={m.participantId}
            participant={m}
            isCurrent={m.participantId === currentParticipantId}
          />
        ))}
      </div>
      <div className="flex items-stretch min-h-36">
        <TableCenter
          phase={phase}
          isModerator={isModerator}
          votedCount={votedCount}
          totalVoters={totalVoters}
          results={results}
          onStart={onStart}
          onReveal={onReveal}
        />
      </div>

      {/* Row 3: empty placeholder + bottom voters */}
      <div />
      {renderVoterRow(bottomVoters, 'bottom')}
    </div>
  )
}
