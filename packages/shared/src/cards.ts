export type CardValue = 0 | 1 | 2 | 3 | 5 | 8 | '?' | '☕'

export const FIBONACCI_CARDS: CardValue[] = [0, 1, 2, 3, 5, 8, '?', '☕']

export function isNumericCard(card: CardValue): boolean {
  return typeof card === 'number'
}
