'use client'

import type { CardValue } from '@pokaface/shared'

interface CardProps {
  value: CardValue
  selected?: boolean
  revealed?: boolean
  onClick?: () => void
  disabled?: boolean
}

export function Card({ value, selected = false, revealed = false, onClick, disabled = false }: CardProps) {
  const formatValue = typeof value === 'number' ? String(value) : value

  const baseClass =
    'aspect-square flex items-center justify-center rounded-lg font-bold text-xl transition-all cursor-pointer'

  const cardClass = revealed
    ? 'bg-surface-1 border-2 border-surface-3'
    : selected
      ? 'bg-brand border-2 border-brand-light scale-105 shadow-lg shadow-brand/20'
      : 'bg-surface-1 border-2 border-surface-3 hover:border-brand hover:shadow-md'

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${cardClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick?.()
        }
      }}
    >
      <span className={selected && !revealed ? 'text-white' : revealed ? 'text-brand' : 'text-white'}>{formatValue}</span>
    </div>
  )
}
