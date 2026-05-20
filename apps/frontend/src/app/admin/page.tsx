'use client'
import { useEffect, useState } from 'react'

interface Stats {
  roomsCreated: number
  participantsJoined: number
  activeRooms: number
  roomsTotal: number
  connectedParticipants: number
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001')

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/stats`)
        if (res.ok) {
          setStats(await res.json())
          setLastUpdated(new Date())
        }
      } catch {}
    }
    fetchStats()
    const id = setInterval(fetchStats, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  const cards = [
    { label: 'Rooms created (all time)', value: stats.roomsCreated },
    { label: 'Rooms in database', value: stats.roomsTotal },
    { label: 'Active rooms (last hour)', value: stats.activeRooms },
    { label: 'Participants joined (all time)', value: stats.participantsJoined },
    { label: 'Currently connected', value: stats.connectedParticipants },
  ]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usage stats</h1>
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{value}</p>
            </div>
          ))}
        </div>

        {stats.roomsTotal > 0 && (
          <div className="mt-10 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Averages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Avg participants per room: </span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {(stats.participantsJoined / stats.roomsTotal).toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Room active rate: </span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {((stats.activeRooms / stats.roomsTotal) * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Connection rate: </span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {((stats.connectedParticipants / stats.participantsJoined) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
