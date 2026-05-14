'use client'

import { FIBONACCI_CARDS } from '@pokaface/shared'
import type { CardValue } from '@pokaface/shared'
import { Card } from './Card'

interface CardDeckProps {
  selectedCard: CardValue | null
  onSelect: (card: CardValue) => void
  disabled?: boolean
  revealed?: boolean
}

export function CardDeck({ selectedCard, onSelect, disabled = false, revealed = false }: CardDeckProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        {revealed ? 'Votes' : 'Cast Your Vote'}
      </h2>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8">
        {FIBONACCI_CARDS.map(card => (
          <Card
            key={card}
            value={card}
            selected={selectedCard === card}
            revealed={revealed}
            onClick={() => !disabled && onSelect(card)}
            disabled={disabled || revealed}
          />
        ))}
      </div>
    </div>
  )
}
