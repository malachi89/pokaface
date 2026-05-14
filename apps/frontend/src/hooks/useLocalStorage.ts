'use client'

import { useState, useCallback, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setStoredValue(JSON.parse(item) as T)
    } catch {}
    setSynced(true)
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue, synced] as const
}
