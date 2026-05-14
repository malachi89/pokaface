'use client'

import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

interface RoomHeaderProps {
  roomId: string
  storyTitle: string
  onStoryChange?: (title: string) => void
  participantCount: number
  isModerator: boolean
}

export function RoomHeader({
  roomId,
  storyTitle,
  onStoryChange,
  participantCount,
  isModerator,
}: RoomHeaderProps) {
  return (
    <div className="border-b border-surface-3 pb-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Pokaface</h1>
          <code className="text-surface text-sm">{roomId}</code>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-surface">Participants:</span>
          <Badge variant="success">{participantCount}</Badge>
        </div>
      </div>

      <div className="max-w-2xl">
        {isModerator && onStoryChange ? (
          <Input
            value={storyTitle}
            onChange={onStoryChange}
            placeholder="Story title (optional)"
            maxLength={100}
          />
        ) : (
          <p className="text-lg text-white">{storyTitle || <span className="text-surface">No story title</span>}</p>
        )}
      </div>
    </div>
  )
}
