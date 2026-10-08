import { inCheck, isAttacked } from './attacks'
import { countColor, isCapture } from './position'
import {
  codeOf,
  colorOf,
  fileOf,
  kindOf,
  makeSq,
  onBoard,
  opposite,
  rankOf,
  type Color,
  type PieceKind,
} from './squares'
import type { Move, Position, Rules } from './types'

const KNIGHT = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
] as const

const KING = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const

const ROOK_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

const BISHOP_DIRS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const

function addPawnMoves(
  pos: Position,
  rules: Rules,
  from: number,
  color: Color,
  out: Move[],
): void {
  const dir = color === 'w' ? 1 : -1
  const file = fileOf(from)
  const rank = rankOf(from)
  const promoRank = color === 'w' ? 7 : 0
  const oneRank = rank + dir
  if (!onBoard(file, oneRank)) return
  const one = makeSq(file, oneRank)
  if (pos.board[one] === 0) {
    pushPawn(from, one, oneRank === promoRank, rules, out)
    const startRank = color === 'w' ? 1 : 6
    if (rules.doubleStep && rank === startRank) {
      const two = makeSq(file, rank + 2 * dir)
      if (pos.board[two] === 0) out.push({ from, to: two })
    }
  }
  for (const df of [-1, 1]) {
    if (!onBoard(file + df, oneRank)) continue
    const to = makeSq(file + df, oneRank)
    const occ = pos.board[to]
    if (occ && colorOf(occ) !== color && kindOf(occ) !== 'k') {
      pushPawn(from, to, oneRank === promoRank, rules, out)
    } else if (!occ && rules.enPassant && to === pos.ep) {
      out.push({ from, to, enPassant: true })
    }
  }
}

function pushPawn(from: number, to: number, promo: boolean, rules: Rules, out: Move[]): void {
  if (!promo) {
    out.push({ from, to })
    return
  }
  for (const promotion of rules.promotion) out.push({ from, to, promotion })
}

function addSlider(
  pos: Position,
  from: number,
  color: Color,
  dirs: readonly (readonly [number, number])[],
  out: Move[],
): void {
  const file = fileOf(from)
  const rank = rankOf(from)
  for (const [df, dr] of dirs) {
    let f = file + df
    let r = rank + dr
    while (onBoard(f, r)) {
      const to = makeSq(f, r)
      const occ = pos.board[to]
      if (!occ) out.push({ from, to })
      else {
        if (colorOf(occ) !== color && kindOf(occ) !== 'k') out.push({ from, to })
        break
      }
      f += df
      r += dr
    }
  }
}

function addLeaper(
  pos: Position,
  from: number,
  color: Color,
  deltas: readonly (readonly [number, number])[],
  out: Move[],
): void {
  const file = fileOf(from)
  const rank = rankOf(from)
  for (const [df, dr] of deltas) {
    if (!onBoard(file + df, rank + dr)) continue
    const to = makeSq(file + df, rank + dr)
    const occ = pos.board[to]
    if (!occ) out.push({ from, to })
    else if (colorOf(occ) !== color && kindOf(occ) !== 'k') out.push({ from, to })
  }
}

function spanEmpty(board: number[], a: number, b: number): boolean {
  const rank = rankOf(a)
  const lo = Math.min(fileOf(a), fileOf(b)) + 1
  const hi = Math.max(fileOf(a), fileOf(b)) - 1
  for (let file = lo; file <= hi; file++) {
    if (board[makeSq(file, rank)]) return false
  }
  return true
}

function kingPathSafe(pos: Position, from: number, to: number, color: Color): boolean {
  const step = fileOf(to) > fileOf(from) ? 1 : -1
  const rank = rankOf(from)
  for (let file = fileOf(from) + step; ; file += step) {
    if (isAttacked(pos.board, makeSq(file, rank), opposite(color))) return false
    if (file === fileOf(to)) break
  }
  return true
}

function landingFree(board: number[], kingSq: number, rookSq: number, kingTo: number, rookTo: number): boolean {
  const kingOcc = board[kingTo]
  if (kingOcc && kingTo !== rookSq) return false
  const rookOcc = board[rookTo]
  if (rookOcc && rookTo !== kingSq && rookTo !== rookSq) return false
  return true
}

function addCastles(pos: Position, rules: Rules, out: Move[]): void {
  if (rules.castling === 'none') return
  const color = pos.turn
  if (inCheck(pos, color)) return
  const home = color === 'w' ? 0 : 7
  const kingSq = pos.board.indexOf(color === 'w' ? 6 : 14)
  if (kingSq < 0 || rankOf(kingSq) !== home) return

  const sides = [
    {
      right: color === 'w' ? pos.castle.wk : pos.castle.bk,
      rookFile: 7,
    },
    {
      right: color === 'w' ? pos.castle.wq : pos.castle.bq,
      rookFile: 0,
    },
  ] as const

  for (const side of sides) {
    if (!side.right) continue
    const rookSq = makeSq(side.rookFile, home)
    const rook = pos.board[rookSq]
    if (kindOf(rook) !== 'r' || colorOf(rook) !== color) continue
    if (!spanEmpty(pos.board, kingSq, rookSq)) continue
    const kingFile = fileOf(kingSq)

    if (rules.castling === 'ordinary') {
      if (kingFile !== 4) continue
      const kingToFile = side.rookFile === 7 ? 6 : 2
      const rookToFile = side.rookFile === 7 ? 5 : 3
      const kingTo = makeSq(kingToFile, home)
      if (!kingPathSafe(pos, kingSq, kingTo, color)) continue
      out.push({
        from: kingSq,
        to: kingTo,
        castle: { rookFrom: rookSq, rookTo: makeSq(rookToFile, home) },
      })
      continue
    }

    const lo = Math.min(kingFile, side.rookFile)
    const hi = Math.max(kingFile, side.rookFile)
    const kingside = side.rookFile > kingFile
    for (let kf = lo; kf <= hi; kf++) {
      if (Math.abs(kf - kingFile) < 2) continue
      const kingTo = makeSq(kf, home)
      if (!kingPathSafe(pos, kingSq, kingTo, color)) continue
      for (let rf = lo; rf <= hi; rf++) {
        if (rf === kf) continue
        if (kingside ? kf <= rf : kf >= rf) continue
        const rookTo = makeSq(rf, home)
        if (!landingFree(pos.board, kingSq, rookSq, kingTo, rookTo)) continue
        out.push({ from: kingSq, to: kingTo, castle: { rookFrom: rookSq, rookTo } })
      }
    }
  }
}

/** Moves that obey piece rules. King safety is applied in `legalMoves`. */
export function pseudoMoves(pos: Position, rules: Rules): Move[] {
  const out: Move[] = []
  const color = pos.turn
  for (let sq = 0; sq < 64; sq++) {
    const code = pos.board[sq]
    if (!code || colorOf(code) !== color) continue
    const kind = kindOf(code)
    if (kind === 'p') addPawnMoves(pos, rules, sq, color, out)
    else if (kind === 'n') addLeaper(pos, sq, color, KNIGHT, out)
    else if (kind === 'k') addLeaper(pos, sq, color, KING, out)
    else if (kind === 'r') addSlider(pos, sq, color, ROOK_DIRS, out)
    else if (kind === 'b' || kind === 'q') {
      addSlider(pos, sq, color, BISHOP_DIRS, out)
      if (kind === 'q') addSlider(pos, sq, color, ROOK_DIRS, out)
    } else if (kind === 'f') addLeaper(pos, sq, color, BISHOP_DIRS, out)
    else if (kind === 'a') {
      const file = fileOf(sq)
      const rank = rankOf(sq)
      for (const [df, dr] of BISHOP_DIRS) {
        if (!onBoard(file + 2 * df, rank + 2 * dr)) continue
        const to = makeSq(file + 2 * df, rank + 2 * dr)
        const occ = pos.board[to]
        if (!occ) out.push({ from: sq, to })
        else if (colorOf(occ) !== color && kindOf(occ) !== 'k') out.push({ from: sq, to })
      }
    }
  }
  // Queen added rook slides inside the b/q branch only when kind === 'q'. Rook already handled.
  // Fix: bishop should NOT get rook slides. The condition above does that. Good.
  // But queen gets bishop slides AND rook slides. Good.
  // Wait, I wrote `if (kind === 'q' || kind === 'r')` inside `kind === 'b' || kind === 'q'`, so rook is not double-added. Good.
  addCastles(pos, rules, out)
  return out
}

export function makeMove(pos: Position, rules: Rules, move: Move): Position {
  const board = pos.board.slice()
  const piece = board[move.from]
  const color = colorOf(piece) ?? pos.turn
  const capturedBefore = isCapture(pos, move)
  board[move.from] = 0
  if (move.enPassant) {
    const capSq = move.to + (color === 'w' ? -8 : 8)
    board[capSq] = 0
  }
  if (move.castle) {
    const rook = board[move.castle.rookFrom]
    board[move.castle.rookFrom] = 0
    board[move.to] = piece
    board[move.castle.rookTo] = rook
  } else if (move.promotion) {
    board[move.to] = codeOf(move.promotion, color)
  } else {
    board[move.to] = piece
  }

  let ep = -1
  if (kindOf(piece) === 'p' && Math.abs(move.to - move.from) === 16 && rules.enPassant) {
    const passed = (move.from + move.to) >> 1
    const rank = rankOf(move.to)
    const file = fileOf(move.to)
    for (const df of [-1, 1]) {
      if (!onBoard(file + df, rank)) continue
      const neighbor = board[makeSq(file + df, rank)]
      if (neighbor && kindOf(neighbor) === 'p' && colorOf(neighbor) !== color) {
        ep = passed
        break
      }
    }
  }

  const castle = { ...pos.castle }
  if (piece === codeOf('k', 'w')) {
    castle.wk = false
    castle.wq = false
  }
  if (piece === codeOf('k', 'b')) {
    castle.bk = false
    castle.bq = false
  }
  const touched = [move.from, move.to]
  if (move.castle) touched.push(move.castle.rookFrom, move.castle.rookTo)
  if (touched.includes(0) || move.to === 0) castle.wq = false
  if (touched.includes(7) || move.to === 7) castle.wk = false
  if (touched.includes(56) || move.to === 56) castle.bq = false
  if (touched.includes(63) || move.to === 63) castle.bk = false
  if (move.from === 0 || move.to === 0) castle.wq = false
  if (move.from === 7 || move.to === 7) castle.wk = false
  if (move.from === 56 || move.to === 56) castle.bq = false
  if (move.from === 63 || move.to === 63) castle.bk = false

  return {
    board,
    turn: opposite(color),
    ep,
    halfmove: kindOf(piece) === 'p' || capturedBefore ? 0 : pos.halfmove + 1,
    fullmove: pos.fullmove + (color === 'b' ? 1 : 0),
    castle,
  }
}

export function safeMoves(pos: Position, rules: Rules): Move[] {
  const color = pos.turn
  const moves: Move[] = []
  for (const move of pseudoMoves(pos, rules)) {
    const next = makeMove(pos, rules, move)
    if (inCheck(next, color)) continue
    if (move.castle && rules.castling === 'free' && inCheck(next, opposite(color))) continue
    moves.push(move)
  }
  return moves
}

export function legalMoves(pos: Position, rules: Rules): Move[] {
  const safe = safeMoves(pos, rules)
  if (!rules.bareKing) return safe
  const me = countColor(pos, pos.turn)
  const them = countColor(pos, opposite(pos.turn))
  if (me === 1 && them >= 2) {
    const opp = opposite(pos.turn)
    const baring = safe.filter((move) => countColor(makeMove(pos, rules, move), opp) === 1)
    return baring.length ? baring : []
  }
  return safe
}

export function perft(pos: Position, rules: Rules, depth: number): number {
  if (depth === 0) return 1
  const moves = legalMoves(pos, rules)
  if (depth === 1) return moves.length
  let total = 0
  for (const move of moves) total += perft(makeMove(pos, rules, move), rules, depth - 1)
  return total
}

export function promotionKinds(rules: Rules): PieceKind[] {
  return rules.promotion
}
