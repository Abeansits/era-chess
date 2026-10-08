/** Opacity of the king’s-leap drawing. It lives in the gaps, never on a stop. */
export function leapOpacity(index: number, reduced: boolean): number {
  if (reduced) return 0
  const x = Math.min(6, Math.max(0, index))
  const fade = 0.35
  const gap = (left: number, right: number) => {
    if (x <= left || x >= right) return 0
    return Math.max(0, Math.min(1, (x - left) / fade, (right - x) / fade))
  }
  return Math.max(gap(2, 3), gap(3, 4))
}

/** Every caption says the drawing is not a legal move. */
export function leapCaption(t: number): string {
  const note = 'Not a legal move yet.'
  if (t < 0.35) return `The king’s leap, two squares and loose. ${note}`
  if (t < 0.7) return `The leap shortens, and the rook comes along. ${note}`
  return `Ordinary castling: king two squares, rook beside it. ${note}`
}
