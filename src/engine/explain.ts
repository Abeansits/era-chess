import { inCheck } from './attacks'
import { REASONS } from '../rules/reasons'
import {
  colorOf,
  fileOf,
  kindOf,
  makeSq,
  rankOf,
  type PieceKind,
} from './squares'
import type { Position, Rules } from './types'
import { legalMoves, makeMove, pseudoMoves } from './moves'

function pieceFallback(kind: PieceKind): string {
  switch (kind) {
    case 'p':
      return REASONS.pawn
    case 'n':
      return REASONS.knight
    case 'r':
      return REASONS.rook
    case 'b':
      return REASONS.bishop
    case 'q':
      return REASONS.queen
    case 'k':
      return REASONS.king
    case 'f':
      return REASONS.ferzStep
    case 'a':
      return REASONS.alfilJump
  }
}

function sliderBlocked(pos: Position, from: number, to: number, diagonal: boolean, orthogonal: boolean): boolean {
  const df = fileOf(to) - fileOf(from)
  const dr = rankOf(to) - rankOf(from)
  const adf = Math.abs(df)
  const adr = Math.abs(dr)
  const isDiag = adf === adr && adf > 0
  const isOrth = (df === 0 || dr === 0) && adf + adr > 0
  if (isDiag && !diagonal) return false
  if (isOrth && !orthogonal) return false
  if (!isDiag && !isOrth) return false
  const stepF = Math.sign(df)
  const stepR = Math.sign(dr)
  let file = fileOf(from) + stepF
  let rank = rankOf(from) + stepR
  while (file !== fileOf(to) || rank !== rankOf(to)) {
    if (pos.board[makeSq(file, rank)]) return true
    file += stepF
    rank += stepR
  }
  return false
}

/** Quote a stored reason for a refused drop. Empty string when the drop is legal. */
export function explainDrop(pos: Position, rules: Rules, from: number, to: number): string {
  if (from === to) return ''
  if (legalMoves(pos, rules).some((move) => move.from === from && move.to === to)) return ''

  const piece = pos.board[from]
  if (!piece) return REASONS.empty
  const color = colorOf(piece)
  if (!color) return REASONS.empty
  if (color !== pos.turn) return REASONS.turn
  const kind = kindOf(piece)
  if (!kind) return REASONS.generic

  const df = fileOf(to) - fileOf(from)
  const dr = rankOf(to) - rankOf(from)
  const adf = Math.abs(df)
  const adr = Math.abs(dr)
  const dir = color === 'w' ? 1 : -1
  const dest = pos.board[to]

  if (kind === 'p') {
    if (df === 0 && dr === 2 * dir && !rules.doubleStep) return REASONS.pawnDoubleEarly
    if (df === 0 && dr === 2 * dir && rules.doubleStep) {
      if (rankOf(from) !== (color === 'w' ? 1 : 6)) return REASONS.pawnDoubleOnce
      return REASONS.blocked
    }
    if (df === 0 && Math.abs(dr) > 2) return rules.doubleStep ? REASONS.pawnTooFar : REASONS.pawnDoubleEarly
    if (df === 0 && dr === -dir) return REASONS.pawnBackward
    if (dr === 0) return REASONS.pawnSideways
    if (adf === 1 && dr === dir && !dest) {
      if (!rules.enPassant && rules.doubleStep) return REASONS.passar
      if (!rules.enPassant) return REASONS.noEnPassant
      return REASONS.epExpired
    }
    if (adf === 1 && dr === dir && dest && colorOf(dest) === color) return REASONS.ownPiece
    if (df === 0 && dr === dir && dest) return REASONS.pawnQuietCapture
  }

  if (kind === 'f') {
    if (adr === adf && adr > 1) return REASONS.ferzSlide
    if (!(adr === 1 && adf === 1)) return REASONS.ferzStep
  }

  if (kind === 'a') {
    if (adr === adf && adr === 1) return REASONS.alfilStep
    if (!(adr === 2 && adf === 2)) return REASONS.alfilJump
  }

  if (kind === 'k' && dr === 0 && adf >= 2) {
    if (rules.castling === 'none') return REASONS.noCastling
    const ordinaryShape = adf === 2 && (fileOf(to) === 6 || fileOf(to) === 2) && fileOf(from) === 4
    if (rules.castling === 'ordinary' && !ordinaryShape) return REASONS.ordinaryOnly
    const castleLike = pseudoMoves(pos, rules).filter(
      (move) => move.castle && move.from === from && move.to === to,
    )
    if (castleLike.length === 0) {
      const home = color === 'w' ? 0 : 7
      const rightK = color === 'w' ? pos.castle.wk : pos.castle.bk
      const rightQ = color === 'w' ? pos.castle.wq : pos.castle.bq
      const towardKing = fileOf(to) > fileOf(from)
      const hasRight = towardKing ? rightK : rightQ
      if (rankOf(from) !== home || !hasRight) return REASONS.castleMoved
      if (inCheck(pos, color)) return REASONS.castlePath
      return REASONS.blocked
    }
    const quiet = castleLike.filter((move) => {
      const next = makeMove(pos, rules, move)
      return !inCheck(next, color)
    })
    if (quiet.length && rules.castling === 'free') return REASONS.castleGivesCheck
    if (!quiet.length) return REASONS.exposed
    return REASONS.castleFree
  }

  if (dest && colorOf(dest) === color) return REASONS.ownPiece

  if (kind === 'r' && sliderBlocked(pos, from, to, false, true)) return REASONS.blocked
  if (kind === 'b' && sliderBlocked(pos, from, to, true, false)) return REASONS.blocked
  if (kind === 'q' && sliderBlocked(pos, from, to, true, true)) return REASONS.blocked

  const geometric = pseudoMoves(pos, rules).some((move) => move.from === from && move.to === to && !move.castle)
  if (geometric) return REASONS.exposed

  if (kind === 'k' && (adf > 1 || adr > 1) && rules.castling === 'none') return REASONS.noCastling
  if (kind === 'n') return REASONS.knight
  return pieceFallback(kind)
}
