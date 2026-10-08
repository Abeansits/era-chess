import { inCheck } from './attacks'
import { outcome } from './outcome'
import { isCapture } from './position'
import { legalMoves, makeMove } from './moves'
import { fileOf, kindOf, rankOf, sqName, type Color, type PieceKind } from './squares'
import type { Move, Position, Rules } from './types'

const DESC_LETTER: Record<PieceKind, string> = {
  k: 'K',
  q: 'Q',
  r: 'R',
  b: 'B',
  n: 'Kt',
  p: 'P',
  f: 'F',
  a: 'A',
}

const SAN_LETTER: Record<PieceKind, string> = {
  k: 'K',
  q: 'Q',
  r: 'R',
  b: 'B',
  n: 'N',
  p: '',
  f: 'F',
  a: 'A',
}

const MODERN_FILES = ['QR', 'QKt', 'QB', 'Q', 'K', 'KB', 'KKt', 'KR']
const SHATRANJ_FILES = ['QR', 'QKt', 'QA', 'K', 'F', 'FA', 'FKt', 'FR']

function descFile(file: number, style: Rules['notation']): string {
  return (style === 'shatranj' ? SHATRANJ_FILES : MODERN_FILES)[file]
}

function descRank(rank: number, mover: Color): number {
  return mover === 'w' ? rank + 1 : 8 - rank
}

function descSquare(sq: number, mover: Color, style: Rules['notation']): string {
  return descFile(fileOf(sq), style) + String(descRank(rankOf(sq), mover))
}

function isOrdinaryCastle(move: Move): 'K' | 'Q' | null {
  if (!move.castle) return null
  const delta = fileOf(move.to) - fileOf(move.from)
  if (fileOf(move.from) !== 4 || Math.abs(delta) !== 2) return null
  if (delta > 0 && fileOf(move.castle.rookTo) === 5) return 'K'
  if (delta < 0 && fileOf(move.castle.rookTo) === 3) return 'Q'
  return null
}

function suffix(pos: Position, rules: Rules, move: Move, descriptive: boolean): string {
  const next = makeMove(pos, rules, move)
  const end = outcome(next, rules, 1)
  if (end?.reason === 'checkmate') return descriptive ? ' mate' : '#'
  if (inCheck(next, next.turn)) return descriptive ? ' ch' : '+'
  return ''
}

export function toAlgebraic(pos: Position, rules: Rules, move: Move): string {
  const mark = suffix(pos, rules, move, false)
  const ordinary = isOrdinaryCastle(move)
  if (move.castle) {
    if (ordinary === 'K') return `O-O${mark}`
    if (ordinary === 'Q') return `O-O-O${mark}`
    return `K${sqName(move.to)}/R${sqName(move.castle.rookTo)}${mark}`
  }

  const kind = kindOf(pos.board[move.from])
  if (!kind) return sqName(move.to) + mark
  const capture = isCapture(pos, move)
  const dest = sqName(move.to)
  let core: string
  if (kind === 'p') {
    core = capture ? `${sqName(move.from)[0]}x${dest}` : dest
    if (move.promotion) core += `=${SAN_LETTER[move.promotion]}`
  } else {
    const peers = legalMoves(pos, rules).filter(
      (other) =>
        other.to === move.to &&
        other.from !== move.from &&
        !other.castle &&
        kindOf(pos.board[other.from]) === kind,
    )
    let disambiguation = ''
    if (peers.length) {
      const sameFile = peers.some((other) => fileOf(other.from) === fileOf(move.from))
      const sameRank = peers.some((other) => rankOf(other.from) === rankOf(move.from))
      const name = sqName(move.from)
      if (!sameFile) disambiguation = name[0]
      else if (!sameRank) disambiguation = name[1]
      else disambiguation = name
    }
    core = `${SAN_LETTER[kind]}${disambiguation}${capture ? 'x' : ''}${dest}`
  }
  return core + mark
}

function actorName(
  pos: Position,
  rules: Rules,
  move: Move,
  kind: PieceKind,
  mover: Color,
): string {
  const letter = DESC_LETTER[kind]
  const peers = legalMoves(pos, rules).filter(
    (other) =>
      other.to === move.to &&
      other.from !== move.from &&
      !other.castle &&
      kindOf(pos.board[other.from]) === kind,
  )
  if (!peers.length) return letter
  const side = fileOf(move.from) <= 3 ? 'Q' : 'K'
  if (peers.every((other) => (fileOf(other.from) <= 3 ? 'Q' : 'K') !== side)) return side + letter
  const file = descFile(fileOf(move.from), rules.notation)
  if (peers.every((other) => fileOf(other.from) !== fileOf(move.from))) return file + letter
  return file + String(descRank(rankOf(move.from), mover)) + letter
}

export function toDescriptive(pos: Position, rules: Rules, move: Move): string {
  const mark = suffix(pos, rules, move, true)
  const mover = pos.turn
  const ordinary = isOrdinaryCastle(move)
  if (move.castle) {
    if (ordinary === 'K') return `O-O${mark}`
    if (ordinary === 'Q') return `O-O-O${mark}`
    const king = descSquare(move.to, mover, rules.notation)
    const rook = descSquare(move.castle.rookTo, mover, rules.notation)
    return `K-${king}/R-${rook}${mark}`
  }
  const kind = kindOf(pos.board[move.from])
  if (!kind) return descSquare(move.to, mover, rules.notation) + mark
  const dest = descSquare(move.to, mover, rules.notation)
  const capture = isCapture(pos, move)
  const actor = actorName(pos, rules, move, kind, mover)
  let core = capture ? `${actor}x${dest}` : `${kind === 'p' ? 'P' : actor}-${dest}`
  if (kind === 'p' && capture) core = `${actor}x${dest}`
  if (move.promotion) core += `=${DESC_LETTER[move.promotion]}`
  if (move.enPassant) core += ' e.p.'
  return core + mark
}

export function notationPair(
  pos: Position,
  rules: Rules,
  move: Move,
): { primary: string; secondary: string } {
  const algebraic = toAlgebraic(pos, rules, move)
  const descriptive = toDescriptive(pos, rules, move)
  if (rules.notation === 'algebraic') return { primary: algebraic, secondary: descriptive }
  return { primary: descriptive, secondary: algebraic }
}

export const NOTATION_LEGEND: Record<Rules['notation'], string> = {
  shatranj: 'Files from the array: QR · QKt · QA · K · F · FA · FKt · FR. Ranks count from the side to move.',
  descriptive: 'English descriptive, as Staunton printed it. Ranks count from the side to move.',
  algebraic: 'Modern algebraic. Files a–h, ranks 1–8 counted from White.',
}

/** The legend for the sheet on screen. Algebraic is not always the secondary view. */
export function legendFor(notation: Rules['notation'], secondary: boolean): string {
  const shown: Rules['notation'] = secondary
    ? notation === 'algebraic'
      ? 'descriptive'
      : 'algebraic'
    : notation
  return NOTATION_LEGEND[shown]
}

/** File letters or names printed on the board edge. Ranks stay 1–8 from White. */
export function fileEdgeLabel(file: number, notation: Rules['notation']): string {
  if (notation === 'algebraic') return 'abcdefgh'[file] ?? ''
  return (notation === 'shatranj' ? SHATRANJ_FILES : MODERN_FILES)[file] ?? ''
}
