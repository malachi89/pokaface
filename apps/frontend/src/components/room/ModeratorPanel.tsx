'use client'

import type { RoomPhase } from '@pokaface/shared'
import { Button } from '../ui/Button'

interface ModeratorPanelProps {
  phase: RoomPhase
  onStart: () => void
  onReveal: () => void
  onReset: () => void
  votedCount: number
  totalParticipants: number
}

export function ModeratorPanel({
  phase,
  onStart,
  onReveal,
  onReset,
  votedCount,
  totalParticipants,
}: ModeratorPanelProps) {
  return (
    <div className="p-6 bg-surface-2 rounded-lg border border-surface-3 space-y-4">
      <h3 className="font-semibold text-white text-lg">Moderator Controls</h3>

      <div className="text-sm text-muted mb-4">
        {votedCount} of {totalParticipants} voted
        {phase === 'voting' && ` (${totalParticipants - votedCount} waiting)`}
      </div>

      <div className="flex flex-wrap gap-3">
        {phase === 'idle' && (
          <Button onClick={onStart} variant="primary" size="lg" className="flex-1 min-w-fit">
            Start Voting
          </Button>
        )}

        {phase === 'voting' && (
          <>
            <Button onClick={onReveal} variant="primary" size="lg" className="flex-1 min-w-fit">
              Reveal Votes
            </Button>
            <Button onClick={onReset} variant="secondary" size="lg">
              Reset
            </Button>
          </>
        )}

        {phase === 'revealed' && (
          <>
            <Button onClick={onStart} variant="primary" size="lg" className="flex-1 min-w-fit">
              Next Story
            </Button>
            <Button onClick={onReset} variant="secondary" size="lg">
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
