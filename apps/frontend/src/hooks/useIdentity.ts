'use client'

import { useLocalStorage } from './useLocalStorage'
import type { UserIdentity } from '@pokaface/shared'
import { v4 as uuid } from 'uuid'

const DEFAULT_IDENTITY: UserIdentity = {
  name: '',
  participantToken: uuid(),
}

export function useIdentity() {
  const [identity, setIdentity] = useLocalStorage<UserIdentity>('pokaface:identity', DEFAULT_IDENTITY)

  const setName = (name: string) => setIdentity(prev => ({ ...prev, name }))

  const ensureToken = () => {
    if (!identity.participantToken) {
      setIdentity(prev => ({ ...prev, participantToken: uuid() }))
    }
    return identity.participantToken
  }

  return { identity, setName, ensureToken }
}
