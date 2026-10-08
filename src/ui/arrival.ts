import type { EraId } from '../rules/eras'

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
