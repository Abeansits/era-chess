import { codeOf, colorOf, parseSq, sqName, type Color, type PieceKind } from './squares'
import type { Move, Position, Rules } from './types'

const FEN_CHAR: Record<string, number> = {
  P: codeOf('p', 'w'),
  N: codeOf('n', 'w'),
  R: codeOf('r', 'w'),
  A: codeOf('a', 'w'),
  F: codeOf('f', 'w'),
  K: codeOf('k', 'w'),
  Q: codeOf('q', 'w'),
  B: codeOf('b', 'w'),
  p: codeOf('p', 'b'),
  n: codeOf('n', 'b'),
  r: codeOf('r', 'b'),
  a: codeOf('a', 'b'),
  f: codeOf('f', 'b'),
  k: codeOf('k', 'b'),
  q: codeOf('q', 'b'),
  b: codeOf('b', 'b'),
}

const PIECE_CHAR = ' PNRAFKQBpnrafkqb'

/** Null when the text is not a position this board can read. */
export function tryParseFen(fen: string): Position | null {
  try {
    return parseFen(fen)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Bad FEN')) return null
    throw error
  }
}

export function parseFen(fen: string): Position {
  const [boardPart, turnPart = 'w', castlePart = '-', epPart = '-', halfPart = '0', fullPart = '1'] =
    fen.trim().split(/\s+/)
  const board = Array<number>(64).fill(0)
  const ranks = boardPart.split('/')
  if (ranks.length !== 8) throw new Error(`Bad FEN: ${fen}`)
  for (let r = 0; r < 8; r++) {
    let file = 0
    for (const ch of ranks[r]) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch)
        continue
      }
      const code = FEN_CHAR[ch]
      if (!code) throw new Error(`Bad FEN piece: ${ch}`)
      board[(7 - r) * 8 + file] = code
      file += 1
    }
    if (file !== 8) throw new Error(`Bad FEN rank: ${ranks[r]}`)
  }
  return {
    board,
    turn: turnPart === 'b' ? 'b' : 'w',
    ep: epPart === '-' ? -1 : parseSq(epPart),
    halfmove: Number(halfPart) || 0,
    fullmove: Number(fullPart) || 1,
    castle: {
      wk: castlePart.includes('K'),
      wq: castlePart.includes('Q'),
      bk: castlePart.includes('k'),
      bq: castlePart.includes('q'),
    },
  }
}

export function toFen(pos: Position): string {
  const ranks: string[] = []
  for (let r = 7; r >= 0; r--) {
    let empty = 0
    let row = ''
    for (let f = 0; f < 8; f++) {
      const code = pos.board[r * 8 + f]
      if (!code) {
        empty += 1
        continue
      }
      if (empty) {
        row += String(empty)
        empty = 0
      }
      row += PIECE_CHAR[code]
    }
    if (empty) row += String(empty)
    ranks.push(row)
  }
  let castle = ''
  if (pos.castle.wk) castle += 'K'
  if (pos.castle.wq) castle += 'Q'
  if (pos.castle.bk) castle += 'k'
  if (pos.castle.bq) castle += 'q'
  if (!castle) castle = '-'
  const ep = pos.ep < 0 ? '-' : sqName(pos.ep)
  return `${ranks.join('/')} ${pos.turn} ${castle} ${ep} ${pos.halfmove} ${pos.fullmove}`
}

export function startFen(rules: Rules): string {
  const board =
    rules.counselor === 'queen'
      ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
      : 'rnakfanr/pppppppp/8/8/8/8/PPPPPPPP/RNAKFANR'
  const castle = rules.castling === 'none' ? '-' : 'KQkq'
  return `${board} w ${castle} - 0 1`
}

export function positionKey(pos: Position): string {
  return `${pos.board.join('.')}|${pos.turn}|${pos.ep}|${pos.castle.wk ? 'K' : ''}${pos.castle.wq ? 'Q' : ''}${pos.castle.bk ? 'k' : ''}${pos.castle.bq ? 'q' : ''}`
}

export function countColor(pos: Position, color: Color): number {
  let n = 0
  for (const code of pos.board) {
    if (code && colorOf(code) === color) n += 1
  }
  return n
}

export function findKing(pos: Position, color: Color): number {
  const king = codeOf('k', color)
  return pos.board.indexOf(king)
}

export function isCapture(pos: Position, move: Move): boolean {
  if (move.enPassant) return true
  if (move.castle) return false
  const occ = pos.board[move.to]
  if (!occ) return false
  return colorOf(occ) !== colorOf(pos.board[move.from])
}

export function moveUci(move: Move): string {
  let uci = sqName(move.from) + sqName(move.to)
  if (move.promotion) uci += move.promotion
  if (move.castle) uci += sqName(move.castle.rookFrom) + sqName(move.castle.rookTo)
  return uci
}

export function pieceKindChar(kind: PieceKind): string {
  return kind
}
