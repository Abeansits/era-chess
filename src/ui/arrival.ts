import { eras, type EraId } from '../rules/eras'

/** One line when the strip settles on a stop. Not a legal claim, a cue. */
export const ARRIVAL: Record<EraId, string> = {
  shatranj: 'Shatranj. The ferz steps once, and a bare king loses.',
  medieval: 'The bare king is no longer the win.',
  queen: '1475: the queen wakes up.',
  passant: 'A pawn can be taken as it slips past.',
  castling: 'The king and the rook leave together.',
  tournament: 'One code for the tournament hall.',
  fide: '1924: the laws sit in one book.',
}

/**
 * One line, and only when the slider is resting on a new stop.
 * A jump that passes 1475 does not announce the queen.
 */
export function arrivalCue(
  stop: number,
  index: number,
  dragging: boolean,
  target: number | null,
): { stop: number; line: string | null } {
  if (dragging || target === null) return { stop, line: null }
  const clamped = Math.min(6, Math.max(0, index))
  const nearest = Math.round(clamped)
  const settled = Math.abs(clamped - target) < 0.02 && nearest === target
  if (!settled || stop === target) return { stop, line: null }
  const era = eras[target]
  return { stop: target, line: era ? ARRIVAL[era.id] : null }
}
