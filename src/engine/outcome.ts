import { inCheck } from './attacks'
import { countColor } from './position'
import { kindOf, opposite } from './squares'
import type { GameResult, Position, Rules } from './types'
import { legalMoves, makeMove, safeMoves } from './moves'

function insufficient(pos: Position): boolean {
  const kinds: string[] = []
  for (const code of pos.board) {
    if (!code) continue
    const kind = kindOf(code)
    if (!kind || kind === 'k') continue
    kinds.push(kind)
  }
  if (kinds.length === 0) return true
  if (kinds.length === 1 && (kinds[0] === 'n' || kinds[0] === 'b')) return true
  return false
}

export function outcome(pos: Position, rules: Rules, repeats = 1): GameResult | null {
  const me = countColor(pos, pos.turn)
  const them = countColor(pos, opposite(pos.turn))
  if (rules.bareKing && me === 1 && them === 1) return { winner: null, reason: 'mutual-bare' }

  if (rules.bareKing && me === 1 && them >= 2) {
    const safe = safeMoves(pos, rules)
    const opp = opposite(pos.turn)
    const baring = safe.filter((move) => countColor(makeMove(pos, rules, move), opp) === 1)
    if (baring.length === 0) {
      if (safe.length === 0 && inCheck(pos, pos.turn)) {
        return { winner: opposite(pos.turn), reason: 'checkmate' }
      }
      return { winner: opposite(pos.turn), reason: 'bare-king' }
    }
  }

  const moves = legalMoves(pos, rules)
  if (moves.length === 0) {
    if (inCheck(pos, pos.turn)) return { winner: opposite(pos.turn), reason: 'checkmate' }
    if (rules.stalemate === 'win') return { winner: opposite(pos.turn), reason: 'stalemate' }
    if (rules.stalemate === 'unsettled') return { winner: null, reason: 'stalemate-unsettled' }
    return { winner: null, reason: 'stalemate' }
  }

  if (rules.repetition && repeats >= 3) return { winner: null, reason: 'repetition' }
  if (rules.fiftyMove && pos.halfmove >= 100) return { winner: null, reason: 'fifty-move' }
  if (rules.insufficient && insufficient(pos)) return { winner: null, reason: 'insufficient' }
  return null
}
