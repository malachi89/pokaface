'use client'

import { useEffect, useRef, useState } from 'react'

interface VoteStartBannerProps {
  phase: string
  roundId: string
}

export function VoteStartBanner({ phase, roundId }: VoteStartBannerProps) {
  const [visible, setVisible] = useState(false)
  const prevRoundId = useRef<string>(roundId)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      prevRoundId.current = roundId
      return
    }
    if (phase === 'voting' && roundId !== prevRoundId.current) {
      prevRoundId.current = roundId
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(t)
    }
  }, [phase, roundId])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-vote-start bg-brand text-white rounded-2xl px-10 py-7 shadow-2xl text-center">
        <div className="text-5xl mb-3">🗳️</div>
        <p className="text-2xl font-bold tracking-wide">Time to vote!</p>
      </div>
    </div>
  )
}
