'use client'

import type { ParticipantPublic } from '@pokaface/shared'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface ParticipantListProps {
  participants: ParticipantPublic[]
  onKick?: (participantId: string) => void
  isModerator?: boolean
}

export function ParticipantList({ participants, onKick, isModerator = false }: ParticipantListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-surface uppercase tracking-wide">Participants ({participants.length})</h3>

      <div className="space-y-2">
        {participants.map(participant => (
          <div key={participant.participantId} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white truncate">{participant.name}</span>
                  {participant.isModerator && <Badge>Moderator</Badge>}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {participant.hasVoted && (
                    <Badge variant="success">✓ Voted</Badge>
                  )}
                  {!participant.hasVoted && (
                    <Badge variant="warning">Waiting</Badge>
                  )}
                  {participant.isConnected ? (
                    <Badge variant="default">Online</Badge>
                  ) : (
                    <Badge variant="error">Offline</Badge>
                  )}
                </div>
              </div>
            </div>

            {isModerator && !participant.isModerator && onKick && (
              <Button
                onClick={() => onKick(participant.participantId)}
                variant="danger"
                size="sm"
                className="ml-2 flex-shrink-0"
              >
                Kick
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
