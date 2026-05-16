'use client'
import { useEffect, useState } from 'react'

interface AdminEvent {
  id: number
  event_type: string
  room_id: string | null
  participant_name: string | null
  created_at: string
}

interface Stats {
  recentEvents: AdminEvent[]
  totals: {
    roomsCreated: number
    participantsJoined: number
    activeRooms: number
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'

const EVENT_LABELS: Record<string, string> = {
  room_created: 'Room created',
  participant_joined: 'Participant joined',
  participant_disconnected: 'Disconnected',
}

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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin</h1>
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Rooms created', value: stats.totals.roomsCreated },
            { label: 'Participants joined', value: stats.totals.participantsJoined },
            { label: 'Active rooms (last hour)', value: stats.totals.activeRooms },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Event</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Room</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Participant</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      No events yet
                    </td>
                  </tr>
                ) : (
                  stats.recentEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {ev.room_id ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {ev.participant_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(ev.created_at + 'Z').toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
