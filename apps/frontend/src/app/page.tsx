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
    sessionStorage.setItem('pokaface_team_name', teamName.trim())
    router.push('/room/new')
  }

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
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
        <JoinForm onJoin={handleJoinRoom} onCreate={handleCreateRoom} />
      )}

      {step === 'team' && (
        <form onSubmit={(e) => { e.preventDefault(); handleTeamSubmit() }} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Team name</label>
            <Input
              value={teamName}
              onChange={setTeamName}
              placeholder="e.g. Squad Alpha"
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
          >
            Create Room
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
