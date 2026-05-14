import type { CardValue, VoteEntry } from '@pokaface/shared'

export function calculateAverage(votes: VoteEntry[]): number | null {
  const numeric = votes
    .filter(v => typeof v.card === 'number')
    .map(v => v.card as number)

  if (numeric.length === 0 || numeric.length !== votes.length) return null

  const sum = numeric.reduce((a, b) => a + b, 0)
  return Math.round((sum / numeric.length) * 10) / 10
}

export function calculateMode(votes: VoteEntry[]): CardValue[] {
  if (votes.length === 0) return []

  const freq = new Map<string, number>()
  for (const v of votes) {
    const key = String(v.card)
    freq.set(key, (freq.get(key) ?? 0) + 1)
  }

  const maxFreq = Math.max(...freq.values())
  const modes = votes
    .map(v => v.card)
    .filter((c, i, arr) => arr.indexOf(c) === i && freq.get(String(c)) === maxFreq)

  return modes
}

export function calculateDispersion(votes: VoteEntry[]): number | null {
  const numeric = votes
    .filter(v => typeof v.card === 'number')
    .map(v => v.card as number)

  if (numeric.length < 2 || numeric.length !== votes.length) return null

  const mean = numeric.reduce((a, b) => a + b, 0) / numeric.length
  const variance = numeric.reduce((a, b) => a + (b - mean) ** 2, 0) / numeric.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}

export function formatCardValue(card: CardValue): string {
  if (typeof card === 'number') return String(card)
  return card
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
