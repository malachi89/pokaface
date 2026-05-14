'use client'

import type { VoteResults } from '@pokaface/shared'

interface VoteResultsProps {
  results: VoteResults
}

export function VoteResults({ results }: VoteResultsProps) {
  return (
    <div className="space-y-6 p-6 bg-surface-2 rounded-lg">
      {results.consensus && (
        <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg text-center">
          <p className="text-green-400 font-semibold">Consensus reached! 🎉</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.average !== null && (
          <div className="p-4 bg-surface-3 rounded-lg">
            <p className="text-surface text-xs font-medium uppercase tracking-wide mb-1">Average</p>
            <p className="text-3xl font-bold text-brand">{results.average}</p>
          </div>
        )}

        <div className="p-4 bg-surface-3 rounded-lg">
          <p className="text-surface text-xs font-medium uppercase tracking-wide mb-1">Most Frequent</p>
          <div className="flex flex-wrap gap-2">
            {results.mode.map((card, i) => (
              <span key={i} className="text-xl font-bold text-brand">
                {typeof card === 'number' ? card : card}
              </span>
            ))}
          </div>
        </div>

        {results.dispersion !== null && (
          <div className="p-4 bg-surface-3 rounded-lg">
            <p className="text-surface text-xs font-medium uppercase tracking-wide mb-1">Dispersion</p>
            <p className="text-2xl font-bold text-brand">{results.dispersion}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-surface uppercase tracking-wide">All Votes</h4>
        <div className="space-y-2">
          {results.votes.map(vote => (
            <div key={vote.participantId} className="flex items-center justify-between p-3 bg-surface-1 rounded">
              <span className="text-white">{vote.name}</span>
              <span className="text-xl font-bold text-brand">
                {typeof vote.card === 'number' ? vote.card : vote.card}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
