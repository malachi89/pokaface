'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useIdentity } from '@/hooks/useIdentity'
import { NameForm } from '@/components/home/NameForm'
import { JoinForm } from '@/components/home/JoinForm'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function HomePage() {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const [step, setStep] = useState<'name' | 'action'>('name')
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

      {step === 'name' ? (
        <NameForm defaultName={identity.name} onContinue={handleNameSubmit} />
      ) : (
        <JoinForm onJoin={handleJoinRoom} onCreate={handleCreateRoom} />
      )}

      {step === 'action' && identity.name && (
        <div className="mt-8 text-center text-muted">
          <p className="text-sm">Logged in as <span className="text-white font-medium">{identity.name}</span></p>
          <button
            onClick={() => setStep('name')}
            className="text-xs text-muted hover:text-white transition-colors mt-2"
          >
            Change name
          </button>
        </div>
      )}
    </div>
  )
}
