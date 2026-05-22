'use client'

import { FormEvent, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface UserIdentityControlProps {
  name: string
  onRename: (name: string) => void
}

export function UserIdentityControl({ name, onRename }: UserIdentityControlProps) {
  const [renaming, setRenaming] = useState(false)
  const [nextName, setNextName] = useState(name)

  const startRenaming = () => {
    setNextName(name)
    setRenaming(true)
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = nextName.trim()
    if (!trimmedName) return

    onRename(trimmedName)
    setRenaming(false)
  }

  if (renaming) {
    return (
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <Input
          value={nextName}
          onChange={setNextName}
          placeholder="Your name"
          maxLength={50}
          className="w-36"
        />
        <Button type="submit" size="sm">Save</Button>
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={startRenaming}
      title="Cambiar nombre"
      aria-label={`Cambiar nombre de ${name}`}
      className="flex min-w-0 items-center gap-2 px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-full transition-colors"
    >
      <Avatar seed={name} size={24} />
      <span className="max-w-40 truncate text-sm font-medium text-white" title={name}>{name}</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-3.5 w-3.5 flex-shrink-0 text-muted"
      >
        <path
          d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
