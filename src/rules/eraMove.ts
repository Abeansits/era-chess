import type { GameResult, Move, Rules } from '../engine/types'
import { resultTitle } from './describe'

/**
 * The sentence for a move that only some stops have.
 * Bare king, capture in passing, ordinary castling, and free castling.
 */
export function eraMoveSentence(rules: Rules, move: Move, result: GameResult | null): string | null {
  if (result?.reason === 'bare-king') return resultTitle(result)
  if (move.enPassant) return 'A pawn that has just stepped two squares may be taken in passing.'
  if (move.castle && rules.castling === 'free') {
    return 'Italian free castling: the king moves at least two squares and finishes on the far side of the rook.'
  }
  if (move.castle) return 'Ordinary castling: the king moves two squares, and the rook takes the square beside it.'
  return null
}
