export type CardValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | 34 | 55 | 89 | '?' | '☕'

export const FIBONACCI_CARDS: CardValue[] = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '☕']

export function isNumericCard(card: CardValue): card is number {
  return typeof card === 'number'
}
