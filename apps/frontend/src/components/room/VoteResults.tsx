'use client'

import type { VoteResults } from '@pokaface/shared'

interface VoteResultsProps {
  results: VoteResults
}

export function VoteResults({ results }: VoteResultsProps) {
  const distribution = results.votes.reduce<Map<string, number>>((acc, v) => {
    const key = String(v.card)
    acc.set(key, (acc.get(key) ?? 0) + 1)
    return acc
  }, new Map())

  const sortedEntries = Array.from(distribution.entries()).sort((a, b) => b[1] - a[1])

  const avgDisplay = results.average !== null
    ? String(Number(results.average.toFixed(2)))
    : null

  return (
    <div className="space-y-6 p-6 bg-surface-2 rounded-lg">
      {results.consensus && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600/30 rounded-lg text-center">
          <p className="text-green-700 dark:text-green-400 font-semibold">Vote completed</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {avgDisplay !== null && (
          <div className="p-4 bg-surface-3 rounded-lg">
            <p className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Average</p>
            <p className="text-3xl font-bold text-brand">{avgDisplay}</p>
          </div>
        )}

        <div className="p-4 bg-surface-3 rounded-lg">
          <p className="text-muted text-xs font-medium uppercase tracking-wide mb-2">Votes</p>
          <div className="flex flex-wrap gap-3">
            {sortedEntries.map(([card, count]) => (
              <div key={card} className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-brand">{card}</span>
                <span className="text-sm text-muted">×{count}</span>
              </div>
            ))}
          </div>
        </div>

        {results.dispersion !== null && (
          <div className="p-4 bg-surface-3 rounded-lg">
            <p className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Dispersion</p>
            <p className="text-2xl font-bold text-brand">{results.dispersion}</p>
          </div>
        )}
      </div>

    </div>
  )
}
