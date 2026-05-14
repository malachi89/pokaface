'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { copyToClipboard } from '@/lib/utils'

interface CopyLinkButtonProps {
  roomId: string
}

export function CopyLinkButton({ roomId }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = `${window.location.origin}/room/${roomId}`
    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={handleCopy} variant={copied ? 'secondary' : 'primary'} size="sm">
      {copied ? '✓ Copied' : 'Copy Link'}
    </Button>
  )
}
