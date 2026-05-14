'use client'

import type { ParticipantPublic } from '@pokaface/shared'

interface VoterProgressProps {
  participants: ParticipantPublic[]
}

export function VoterProgress({ participants }: VoterProgressProps) {
  const voters = participants.filter(p => !p.isModerator)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Votes</h2>
      <div className="flex flex-wrap gap-3">
        {voters.map(p => (
          <div
            key={p.participantId}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              p.hasVoted
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400'
                : 'bg-surface-1 border-surface-3 text-muted'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                p.hasVoted ? 'bg-green-500 dark:bg-green-400' : 'bg-surface-3'
              }`}
            />
            <span className={p.hasVoted ? '' : 'opacity-60'}>{p.name}</span>
          </div>
        ))}

        {voters.length === 0 && (
          <p className="text-muted text-sm">No participants yet</p>
        )}
      </div>
    </div>
  )
}
