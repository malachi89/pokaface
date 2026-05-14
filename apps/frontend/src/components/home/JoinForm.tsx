'use client'

import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface JoinFormProps {
  onJoin: (roomId: string) => void
  onCreate: () => void
}

export function JoinForm({ onJoin, onCreate }: JoinFormProps) {
  const [roomId, setRoomId] = useState('')

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const urlMatch = text.match(/\/room\/([a-z0-9]+)/i)
      if (urlMatch) {
        setRoomId(urlMatch[1])
      } else if (/^[a-z0-9]{10}$/i.test(text)) {
        setRoomId(text)
      }
    } catch {}
  }

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoin(roomId.trim())
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Room ID</label>
        <Input
          value={roomId}
          onChange={setRoomId}
          placeholder="Enter room ID or paste link"
          maxLength={10}
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleJoin}
          disabled={!roomId.trim()}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Join Room
        </Button>
        <Button onClick={handlePaste} variant="secondary" size="lg">
          Paste
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-3" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-muted">or</span>
        </div>
      </div>

      <Button onClick={onCreate} variant="secondary" size="lg" className="w-full">
        Create New Room
      </Button>
    </div>
  )
}
