'use client'

import { Input } from '../ui/Input'

interface RoomHeaderProps {
  roomId: string
  teamName: string
  storyTitle: string
  onStoryChange?: (title: string) => void
  isModerator: boolean
}

export function RoomHeader({
  roomId,
  teamName,
  storyTitle,
  onStoryChange,
  isModerator,
}: RoomHeaderProps) {
  return (
    <div className="border-b border-surface-3 pb-6 mb-6">
      <div className="mb-4">
        {teamName ? (
          <h1 className="text-3xl font-bold text-white mb-1">{teamName}</h1>
        ) : (
          <h1 className="text-3xl font-bold text-white mb-1">Pokaface</h1>
        )}
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
          <p className="text-lg text-white">{storyTitle || <span className="text-muted">No story title</span>}</p>
        )}
      </div>
    </div>
  )
}
