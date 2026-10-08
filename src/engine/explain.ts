import { inCheck, isAttacked } from './attacks'
import { REASONS } from '../rules/reasons'
import {
  colorOf,
  fileOf,
  kindOf,
  makeSq,
  opposite,
  rankOf,
  type Color,
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

/**
 * An enemy pawn sits where a capture in passing would take it, on the rank a
 * double step lands, with the two squares behind it empty. The ep square counts
 * even when those squares are not empty. A plain diagonal step with no such
 * pawn has not met a pawn that is passing.
 */
function pawnHasPassed(pos: Position, to: number, color: Color): boolean {
  if (pos.ep === to) return true
  const capSq = to + (color === 'w' ? -8 : 8)
  if (capSq < 0 || capSq > 63) return false
  const cap = pos.board[capSq]
  if (!cap || kindOf(cap) !== 'p' || colorOf(cap) === color) return false
  const enemy = colorOf(cap)
  if (!enemy || rankOf(capSq) !== (enemy === 'w' ? 3 : 4)) return false
  const file = fileOf(capSq)
  const origin = enemy === 'w' ? 1 : 6
  const crossed = enemy === 'w' ? 2 : 5
  return !pos.board[makeSq(file, origin)] && !pos.board[makeSq(file, crossed)]
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
      const mid = pos.board[makeSq(fileOf(from), rankOf(from) + dir)]
      if (mid || dest) return REASONS.blocked
    }
    if (df === 0 && Math.abs(dr) > 2) return rules.doubleStep ? REASONS.pawnTooFar : REASONS.pawnDoubleEarly
    if (df === 0 && dr === -dir) return REASONS.pawnBackward
    if (dr === 0) return REASONS.pawnSideways
    if (adf === 1 && dr === dir && !dest) {
      if (!pawnHasPassed(pos, to, color)) return REASONS.pawnDiagonal
      if (!rules.enPassant && rules.doubleStep) return REASONS.passar
      if (!rules.enPassant) return REASONS.noEnPassant
      if (pos.ep !== to) return REASONS.epExpired
    }
    if (adf === 1 && dr === dir && dest && colorOf(dest) === color) return REASONS.ownPiece
    if (df === 0 && dr === dir && dest) return REASONS.pawnQuietCapture
  }

  if (kind === 'f') {
    const longDiagonal = adr === adf && adr > 1
    const longOrthogonal = (df === 0 || dr === 0) && adf + adr > 1
    if (longDiagonal || longOrthogonal) return REASONS.ferzSlide
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
    const home = color === 'w' ? 0 : 7
    const towardKing = fileOf(to) > fileOf(from)
    const step = towardKing ? 1 : -1
    const rank = rankOf(from)
    const rookFile = towardKing ? 7 : 0
    const rookSq = makeSq(rookFile, home)
    const rook = pos.board[rookSq]
    let blocked = false
    for (let file = fileOf(from) + step; ; file += step) {
      const occ = pos.board[makeSq(file, rank)]
      const landingOnRook = file === fileOf(to) && file === rookFile && kindOf(rook) === 'r' && colorOf(rook) === color
      if (occ && !landingOnRook) blocked = true
      if (file === fileOf(to)) break
    }
    if (blocked) return REASONS.blocked

    const rightK = color === 'w' ? pos.castle.wk : pos.castle.bk
    const rightQ = color === 'w' ? pos.castle.wq : pos.castle.bq
    const hasRight = towardKing ? rightK : rightQ
    const rookReady = kindOf(rook) === 'r' && colorOf(rook) === color
    if (rank !== home || !hasRight || !rookReady) return REASONS.castleMoved

    if (inCheck(pos, color)) return REASONS.castleOutOfCheck
    const enemy = opposite(color)
    let through = false
    let land = false
    for (let file = fileOf(from) + step; ; file += step) {
      if (isAttacked(pos.board, makeSq(file, rank), enemy)) {
        if (file === fileOf(to)) land = true
        else through = true
      }
      if (file === fileOf(to)) break
    }
    if (through) return REASONS.castleThrough
    if (land) return REASONS.castleLand

    const castleLike = pseudoMoves(pos, rules).filter(
      (move) => move.castle && move.from === from && move.to === to,
    )
    const quiet = castleLike.filter((move) => {
      const next = makeMove(pos, rules, move)
      return !inCheck(next, color)
    })
    if (quiet.length && rules.castling === 'free') return REASONS.castleGivesCheck
    if (!quiet.length && castleLike.length) return REASONS.exposed
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
