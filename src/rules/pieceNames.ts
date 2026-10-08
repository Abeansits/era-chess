import type { PieceKind } from '../engine/squares'
import type { Rules } from '../engine/types'

const WORD_KIND: Record<string, PieceKind> = {
  ferz: 'f',
  ferzes: 'f',
  alfil: 'a',
  alfils: 'a',
  aufin: 'a',
  shah: 'k',
  rukh: 'r',
  faras: 'n',
  baidaq: 'p',
  baidaqs: 'p',
  queen: 'q',
  queens: 'q',
  bishop: 'b',
  bishops: 'b',
  knight: 'n',
  knights: 'n',
  rook: 'r',
  rooks: 'r',
  king: 'k',
  kings: 'k',
  pawn: 'p',
  pawns: 'p',
}

const WORD = /\b(ferzes|ferz|alfils|alfil|aufin|shah|rukh|faras|baidaqs|baidaq|queens|queen|bishops|bishop|knights|knight|rooks|rook|kings|king|pawns|pawn)\b/gi

export type PieceGuide = {
  kind: PieceKind
  period: string
  modern: string
  motion: string
}

export function pieceKindForWord(word: string): PieceKind | null {
  return WORD_KIND[word.toLowerCase()] ?? null
}

export function splitPieceWords(text: string): Array<{ text: string; kind: PieceKind | null }> {
  const out: Array<{ text: string; kind: PieceKind | null }> = []
  let last = 0
  for (const match of text.matchAll(WORD)) {
    const at = match.index ?? 0
    if (at > last) out.push({ text: text.slice(last, at), kind: null })
    const word = match[0]
    out.push({ text: word, kind: pieceKindForWord(word) })
    last = at + word.length
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: null })
  return out
}

export function pieceGuide(rules: Rules): PieceGuide[] {
  const antique = rules.counselor === 'ferz'
  const pawnMotion = rules.doubleStep ? 'one square forward, or two from its start' : 'one square forward'
  if (antique) {
    return [
      { kind: 'r', period: 'Rukh', modern: 'rook', motion: 'slides along a rank or a file' },
      { kind: 'n', period: 'Faras', modern: 'knight', motion: 'jumps in an L' },
      { kind: 'a', period: 'Alfil', modern: 'bishop', motion: 'jumps two squares diagonally' },
      { kind: 'f', period: 'Ferz', modern: 'queen', motion: 'one step diagonally' },
      { kind: 'k', period: 'Shah', modern: 'king', motion: 'one step in any direction' },
      { kind: 'p', period: 'Baidaq', modern: 'pawn', motion: pawnMotion },
    ]
  }
  return [
    { kind: 'r', period: 'Rook', modern: 'rook', motion: 'slides along a rank or a file' },
    { kind: 'n', period: 'Knight', modern: 'knight', motion: 'jumps in an L' },
    { kind: 'b', period: 'Bishop', modern: 'bishop', motion: 'slides any distance diagonally' },
    { kind: 'q', period: 'Queen', modern: 'queen', motion: 'slides any distance' },
    { kind: 'k', period: 'King', modern: 'king', motion: 'one step in any direction' },
    { kind: 'p', period: 'Pawn', modern: 'pawn', motion: pawnMotion },
  ]
}

export function guideForKind(rules: Rules, kind: PieceKind): PieceGuide | undefined {
  return pieceGuide(rules).find((guide) => guide.kind === kind)
}

export function pieceLabel(guide: PieceGuide): string {
  if (guide.period.toLowerCase() === guide.modern.toLowerCase()) return `${guide.period}: ${guide.motion}`
  return `${guide.period} (today's ${guide.modern}): ${guide.motion}`
}
