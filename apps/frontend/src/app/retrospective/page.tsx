'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EVENTS } from '@pokaface/shared'
import type { RetrospectiveState } from '@pokaface/shared'
import { useIdentity } from '@/hooks/useIdentity'
import { useSocket } from '@/hooks/useSocket'
import { NameForm } from '@/components/home/NameForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? (process.env.NODE_ENV === 'production' ? 'https://api.pokaface.win' : 'http://localhost:3001')

export default function RetrospectiveLobbyPage() {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const { socket, connected } = useSocket(backendUrl)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCreateTimeout = () => {
    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current)
      createTimeoutRef.current = null
    }
  }

  useEffect(() => {
    if (!socket) return

    const handleCreated = ({ retrospective }: { retrospective: RetrospectiveState }) => {
      clearCreateTimeout()
      setCreating(false)
      router.push(`/retrospective/${retrospective.retroId}`)
    }
    const handleError = (payload: { message: string }) => {
      clearCreateTimeout()
      setCreating(false)
      setError(payload.message)
    }

    socket.on(EVENTS.RETRO_CREATED, handleCreated)
    socket.on(EVENTS.ROOM_ERROR, handleError)
    return () => {
      socket.off(EVENTS.RETRO_CREATED, handleCreated)
      socket.off(EVENTS.ROOM_ERROR, handleError)
      clearCreateTimeout()
    }
  }, [socket, router])

  const handleCreate = () => {
    if (!socket || !connected || !identity.name || !identity.participantToken || creating) return
    setCreating(true)
    setError(null)
    clearCreateTimeout()
    createTimeoutRef.current = setTimeout(() => {
      setCreating(false)
      setError('The retrospective could not be created. Check that the backend is running and try again.')
      createTimeoutRef.current = null
    }, 10000)
    socket.emit(EVENTS.RETRO_CREATE, {
      name: identity.name,
      participantToken: identity.participantToken,
      title: title.trim(),
    })
  }

  if (synced && !identity.name) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">Retrospective</h1>
          <p className="text-white">Enter your name to continue</p>
        </div>
        <NameForm defaultName="" onContinue={setName} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Retrospective</h1>
      </div>

      <div className="w-full max-w-sm space-y-8">
        {identity.name && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-full">
              <Avatar seed={identity.name} size={24} />
              <span className="text-sm font-medium text-white">{identity.name}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleCreate() }} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Retro title</label>
            <Input value={title} onChange={setTitle} placeholder="Sprint retrospective" maxLength={80} />
          </div>
          <Button type="submit" disabled={!connected || creating} size="lg" className="w-full">
            {creating ? 'Creating...' : 'Create Retrospective'}
          </Button>
        </form>
      </div>
    </div>
  )
}
