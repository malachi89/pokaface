'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useIdentity } from '@/hooks/useIdentity'
import { NameForm } from '@/components/home/NameForm'
import { JoinForm } from '@/components/home/JoinForm'
import { v4 as uuid } from 'uuid'

export default function HomePage() {
  const router = useRouter()
  const { identity, setName } = useIdentity()
  const [step, setStep] = useState<'name' | 'action'>(identity.name ? 'action' : 'name')

  const handleNameSubmit = (name: string) => {
    setName(name)
    setStep('action')
  }

  const handleCreateRoom = () => {
    const roomId = uuid().substring(0, 10)
    router.push(`/room/${roomId}`)
  }

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-2">Pokaface</h1>
        <p className="text-lg text-surface">Planning Poker for Scrum Teams</p>
      </div>

      {step === 'name' ? (
        <NameForm defaultName={identity.name} onContinue={handleNameSubmit} />
      ) : (
        <JoinForm onJoin={handleJoinRoom} onCreate={handleCreateRoom} />
      )}

      {step === 'action' && identity.name && (
        <div className="mt-8 text-center text-surface">
          <p className="text-sm">Logged in as <span className="text-white font-medium">{identity.name}</span></p>
          <button
            onClick={() => setStep('name')}
            className="text-xs text-surface hover:text-white transition-colors mt-2"
          >
            Change name
          </button>
        </div>
      )}
    </div>
  )
}
