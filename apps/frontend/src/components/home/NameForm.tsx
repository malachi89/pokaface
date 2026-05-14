'use client'

import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface NameFormProps {
  defaultName: string
  onContinue: (name: string) => void
}

export function NameForm({ defaultName, onContinue }: NameFormProps) {
  const [name, setName] = useState(defaultName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onContinue(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">Your Name</label>
        <Input value={name} onChange={setName} placeholder="Enter your name" maxLength={50} />
      </div>

      <Button onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} size="lg" className="w-full">
        Continue
      </Button>
    </form>
  )
}
