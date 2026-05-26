'use client'
import { useEffect, useState } from 'react'
import { getBackendUrl } from '@/lib/backendUrl'

interface Stats {
  voting: {
    roomsCreated: number
    participantsJoined: number
    activeRooms: number
    roomsTotal: number
    connectedParticipants: number
  }
  retroboard: {
    retrospectivesTotal: number
    activeRetrospectives: number
    participantsTotal: number
    connectedParticipants: number
    cardsTotal: number
    likesTotal: number
  }
}

const BACKEND_URL = getBackendUrl()

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

  const votingCards = [
    { label: 'Rooms created (all time)', value: stats.voting.roomsCreated },
    { label: 'Rooms in database', value: stats.voting.roomsTotal },
    { label: 'Active rooms (last hour)', value: stats.voting.activeRooms },
    { label: 'Participants joined (all time)', value: stats.voting.participantsJoined },
    { label: 'Currently connected', value: stats.voting.connectedParticipants },
  ]

  const retroCards = [
    { label: 'Retros in database', value: stats.retroboard.retrospectivesTotal },
    { label: 'Active retros (last hour)', value: stats.retroboard.activeRetrospectives },
    { label: 'Retro participants', value: stats.retroboard.participantsTotal },
    { label: 'Retro connected now', value: stats.retroboard.connectedParticipants },
    { label: 'Cards created', value: stats.retroboard.cardsTotal },
    { label: 'Card likes', value: stats.retroboard.likesTotal },
  ]

  const votingRoomsTotal = stats.voting.roomsTotal
  const votingParticipantsTotal = stats.voting.participantsJoined
  const retrospectivesTotal = stats.retroboard.retrospectivesTotal
  const retroParticipantsTotal = stats.retroboard.participantsTotal

  const sections = [
    {
      title: 'Voting Rooms',
      cards: votingCards,
      averages: votingRoomsTotal > 0 ? [
        {
          label: 'Avg participants per room',
          value: (votingParticipantsTotal / votingRoomsTotal).toFixed(1),
        },
        {
          label: 'Room active rate',
          value: `${((stats.voting.activeRooms / votingRoomsTotal) * 100).toFixed(0)}%`,
        },
        {
          label: 'Connection rate',
          value: votingParticipantsTotal > 0
            ? `${((stats.voting.connectedParticipants / votingParticipantsTotal) * 100).toFixed(0)}%`
            : '0%',
        },
      ] : [],
    },
    {
      title: 'Retroboard',
      cards: retroCards,
      averages: retrospectivesTotal > 0 ? [
        {
          label: 'Avg participants per retro',
          value: (retroParticipantsTotal / retrospectivesTotal).toFixed(1),
        },
        {
          label: 'Avg cards per retro',
          value: (stats.retroboard.cardsTotal / retrospectivesTotal).toFixed(1),
        },
        {
          label: 'Retro active rate',
          value: `${((stats.retroboard.activeRetrospectives / retrospectivesTotal) * 100).toFixed(0)}%`,
        },
        {
          label: 'Retro connection rate',
          value: retroParticipantsTotal > 0
            ? `${((stats.retroboard.connectedParticipants / retroParticipantsTotal) * 100).toFixed(0)}%`
            : '0%',
        },
      ] : [],
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usage stats</h1>
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="space-y-10">
          {sections.map(section => (
            <section key={section.title} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.cards.map(({ label, value }) => (
                  <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{value}</p>
                  </div>
                ))}
              </div>

              {section.averages.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Averages</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {section.averages.map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-gray-500 dark:text-gray-400">{label}: </span>
                        <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
