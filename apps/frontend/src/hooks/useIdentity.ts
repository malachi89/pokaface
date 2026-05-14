'use client'

import { useLocalStorage } from './useLocalStorage'
import type { UserIdentity } from '@pokaface/shared'
import { v4 as uuid } from 'uuid'

const EMPTY_IDENTITY: UserIdentity = {
  name: '',
  participantToken: '',
}

export function useIdentity() {
  const [identity, setIdentity, synced] = useLocalStorage<UserIdentity>('pokaface:identity', EMPTY_IDENTITY)

  const setName = (name: string) =>
    setIdentity(prev => ({
      ...prev,
      name,
      participantToken: prev.participantToken || uuid(),
    }))

  return { identity, setName, synced }
}
