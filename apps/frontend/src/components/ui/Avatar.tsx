'use client'

import BoringAvatar from 'boring-avatars'

const PALETTE = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981']

interface AvatarProps {
  seed: string
  size?: number
}

export function Avatar({ seed, size = 36 }: AvatarProps) {
  return (
    <BoringAvatar size={size} name={seed} variant="beam" colors={PALETTE} />
  )
}
