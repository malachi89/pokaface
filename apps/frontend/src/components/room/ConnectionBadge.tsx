'use client'

interface ConnectionBadgeProps {
  connected: boolean
  reconnecting: boolean
}

export function ConnectionBadge({ connected, reconnecting }: ConnectionBadgeProps) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full" />
        Connected
      </div>
    )
  }

  if (reconnecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-400 animate-pulse-slow">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        Reconnecting...
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-red-400">
      <div className="w-2 h-2 bg-red-400 rounded-full" />
      Disconnected
    </div>
  )
}
