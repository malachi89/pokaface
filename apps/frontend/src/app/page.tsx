'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useIdentity } from '@/hooks/useIdentity'
import { NameForm } from '@/components/home/NameForm'
import { JoinForm } from '@/components/home/JoinForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export default function HomePage() {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const [step, setStep] = useState<'name' | 'action' | 'team'>('name')
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const stepInitialized = useRef(false)

  useEffect(() => {
    if (synced && !stepInitialized.current) {
      stepInitialized.current = true
      if (identity.name) setStep('action')
    }
  }, [synced, identity.name])

  const handleNameSubmit = (name: string) => {
    setName(name)
    setStep('action')
  }

  const handleCreateRoom = () => {
    setTeamName('')
    setStep('team')
  }

  const handleTeamSubmit = () => {
    if (creating) return
    setCreating(true)
    sessionStorage.setItem('pokaface_team_name', teamName.trim())
    router.push('/room/new')
  }

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <Button
        onClick={() => router.push('/retrospective')}
        className="absolute left-4 top-4 flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-lg !p-3 text-center shadow-lg shadow-brand/20 sm:h-32 sm:w-32"
      >
        <RetrospectiveIcon />
        <span className="text-sm font-semibold leading-tight sm:text-base">Retrospective</span>
      </Button>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-2">Pokaface</h1>
        <p className="text-lg text-muted">Planning Poker</p>
      </div>

      {step === 'name' && (
        <NameForm defaultName={identity.name} onContinue={handleNameSubmit} />
      )}

      {step === 'action' && (
        <div className="w-full max-w-sm">
          <JoinForm onJoin={handleJoinRoom} onCreate={handleCreateRoom} />
        </div>
      )}

      {step === 'team' && (
        <form onSubmit={(e) => { e.preventDefault(); handleTeamSubmit() }} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Team name</label>
            <Input
              value={teamName}
              onChange={setTeamName}
              placeholder="Team name"
              maxLength={50}
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            onClick={handleTeamSubmit}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={creating}
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Creating…
              </span>
            ) : 'Create Room'}
          </Button>
          <button
            type="button"
            onClick={() => setStep('action')}
            className="w-full text-sm text-muted hover:text-white transition-colors"
          >
            ← Back
          </button>
        </form>
      )}

      {(step === 'action' || step === 'team') && identity.name && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-full">
            <Avatar seed={identity.name} size={24} />
            <span className="text-sm font-medium text-white">{identity.name}</span>
          </div>
          {step === 'action' && (
            <button
              onClick={() => setStep('name')}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Change name
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RetrospectiveIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="m3 6 1 1 2-2" />
      <path d="m3 12 1 1 2-2" />
      <path d="m3 18 1 1 2-2" />
    </svg>
  )
}
