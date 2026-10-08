import type { GameResult } from '../engine/types'
import type { Rules } from '../engine/types'

export function boardLines(rules: Rules): string[] {
  const piece =
    rules.counselor === 'ferz'
      ? 'Ferz: one square diagonally. Alfil: a jump of two.'
      : 'Queen and bishop slide any distance.'
  const pawn = !rules.doubleStep
    ? 'Pawns move one square. No en passant.'
    : rules.enPassant
      ? 'A pawn may double-step, and be taken in passing.'
      : rules.id.includes('italy')
        ? 'A pawn may double-step. Passar battaglia: no capture in passing.'
        : 'A pawn may double-step. There is no capture in passing.'
  const castle =
    rules.castling === 'none'
      ? 'No castling.'
      : rules.castling === 'ordinary'
        ? 'Ordinary castling, on fixed squares.'
        : 'Italian free castling, a reconstruction. The move itself may not give check. This board does not apply the stricter Modenese rule against landing on a square that attacks an enemy man.'
  const promo =
    rules.promotion.join('') === 'f'
      ? 'Promotion to a ferz only.'
      : rules.promotion.join('') === 'q'
        ? 'Promotion to a queen only.'
        : 'Promotion to any piece.'
  const ending = rules.bareKing
    ? 'A bare king loses, unless the reply bares you too. Stalemate wins.'
    : rules.stalemate === 'unsettled'
      ? 'A bare king does not win. Stalemate is unsettled — scored a draw.'
      : rules.stalemate === 'win'
        ? 'Stalemate is scored a win here, a simplification. England and France had already moved toward a draw, and Staunton printed a draw in 1847.'
        : rules.fiftyMove
          ? 'Stalemate is a draw. Fifty barren moves is a draw.'
          : 'Stalemate is a draw.'
  const array =
    rules.counselor === 'ferz'
      ? 'The king starts on the d-file, the ferz on the e-file.'
      : 'The queen starts on the d-file, the king on the e-file.'
  return [array, piece, pawn, castle, promo, ending]
}

export function resultTitle(result: GameResult): string {
  const white = result.winner === 'w'
  const black = result.winner === 'b'
  switch (result.reason) {
    case 'checkmate':
      return white ? 'Checkmate. White wins.' : 'Checkmate. Black wins.'
    case 'bare-king':
      return white ? 'Bare king. White wins.' : 'Bare king. Black wins.'
    case 'mutual-bare':
      return 'Both kings are bare. Drawn.'
    case 'stalemate':
      if (white) return 'Stalemate. White wins.'
      if (black) return 'Stalemate. Black wins.'
      return 'Stalemate. Drawn.'
    case 'stalemate-unsettled':
      return 'Stalemate. Unsettled in this era — scored a draw.'
    case 'fifty-move':
      return 'Fifty moves without a capture or a pawn move. Drawn.'
    case 'repetition':
      return 'The same position three times. Drawn.'
    case 'insufficient':
      return 'Not enough material to force mate. Drawn.'
    case 'resign':
      return white ? 'Black resigns. White wins.' : 'White resigns. Black wins.'
    case 'time':
      return white ? 'Black’s clock ran out. White wins.' : 'White’s clock ran out. Black wins.'
    case 'agreement':
      return 'Drawn by agreement.'
  }
}
