import {
  codeOf,
  colorOf,
  fileOf,
  kindOf,
  makeSq,
  onBoard,
  rankOf,
  type Color,
} from './squares'
import type { Position } from './types'

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

const ROOK = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

const BISHOP = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const

export function isAttacked(board: number[], target: number, by: Color): boolean {
  const tf = fileOf(target)
  const tr = rankOf(target)

  const pawnRank = by === 'w' ? tr - 1 : tr + 1
  for (const df of [-1, 1]) {
    if (!onBoard(tf + df, pawnRank)) continue
    const code = board[makeSq(tf + df, pawnRank)]
    if (code && colorOf(code) === by && kindOf(code) === 'p') return true
  }

  for (const [df, dr] of KNIGHT) {
    if (!onBoard(tf + df, tr + dr)) continue
    const code = board[makeSq(tf + df, tr + dr)]
    if (code && colorOf(code) === by && kindOf(code) === 'n') return true
  }

  for (const [df, dr] of KING) {
    if (!onBoard(tf + df, tr + dr)) continue
    const code = board[makeSq(tf + df, tr + dr)]
    if (code && colorOf(code) === by && kindOf(code) === 'k') return true
  }

  for (const [df, dr] of BISHOP) {
    if (!onBoard(tf + df, tr + dr)) continue
    const code = board[makeSq(tf + df, tr + dr)]
    if (code && colorOf(code) === by && kindOf(code) === 'f') return true
  }

  for (const [df, dr] of BISHOP) {
    if (!onBoard(tf + 2 * df, tr + 2 * dr)) continue
    const code = board[makeSq(tf + 2 * df, tr + 2 * dr)]
    if (code && colorOf(code) === by && kindOf(code) === 'a') return true
  }

  for (const [df, dr] of ROOK) {
    let f = tf + df
    let r = tr + dr
    while (onBoard(f, r)) {
      const code = board[makeSq(f, r)]
      if (code) {
        if (colorOf(code) === by) {
          const kind = kindOf(code)
          if (kind === 'r' || kind === 'q') return true
        }
        break
      }
      f += df
      r += dr
    }
  }

  for (const [df, dr] of BISHOP) {
    let f = tf + df
    let r = tr + dr
    while (onBoard(f, r)) {
      const code = board[makeSq(f, r)]
      if (code) {
        if (colorOf(code) === by) {
          const kind = kindOf(code)
          if (kind === 'b' || kind === 'q') return true
        }
        break
      }
      f += df
      r += dr
    }
  }

  return false
}

export function inCheck(pos: Position, color: Color): boolean {
  const kingSq = pos.board.indexOf(codeOf('k', color))
  if (kingSq < 0) return true
  return isAttacked(pos.board, kingSq, color === 'w' ? 'b' : 'w')
}
