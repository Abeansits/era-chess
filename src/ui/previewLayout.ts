import type { Color, PieceKind } from '../engine/squares'

export type PreviewPiece = {
  id: string
  color: Color
  from: PieceKind
  to: PieceKind
  file: number
  rank: number
  /** 0 shows `from`, 1 shows `to`. The shape change finishes before anyone moves. */
  glyph: number
  opacity: number
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

/**
 * Ferz becomes the queen on the e-file, alfils become bishops where they stand,
 * then the king and queen trade files by fading out and fading in. They are
 * never drawn on top of each other.
 */
export function previewPieces(t: number): PreviewPiece[] {
  const u = clamp01(t)
  const glyph = clamp01(u / 0.4)
  const fading =
    u <= 0.4 ? 1 : u < 0.62 ? 1 - (u - 0.4) / 0.22 : u < 0.78 ? 0 : u >= 0.999 ? 1 : clamp01((u - 0.78) / 0.22)
  const swapped = u >= 0.7
  const kingFile = swapped ? 4 : 3
  const queenFile = swapped ? 3 : 4
  const out: PreviewPiece[] = []
  for (let file = 0; file < 8; file++) {
    out.push({ id: `wp${file}`, color: 'w', from: 'p', to: 'p', file, rank: 1, glyph: 0, opacity: 1 })
    out.push({ id: `bp${file}`, color: 'b', from: 'p', to: 'p', file, rank: 6, glyph: 0, opacity: 1 })
  }
  const stay: Array<[number, PieceKind]> = [
    [0, 'r'],
    [1, 'n'],
    [6, 'n'],
    [7, 'r'],
  ]
  for (const [file, kind] of stay) {
    out.push({ id: `w${file}`, color: 'w', from: kind, to: kind, file, rank: 0, glyph: 0, opacity: 1 })
    out.push({ id: `b${file}`, color: 'b', from: kind, to: kind, file, rank: 7, glyph: 0, opacity: 1 })
  }
  for (const file of [2, 5]) {
    out.push({ id: `wa${file}`, color: 'w', from: 'a', to: 'b', file, rank: 0, glyph, opacity: 1 })
    out.push({ id: `ba${file}`, color: 'b', from: 'a', to: 'b', file, rank: 7, glyph, opacity: 1 })
  }
  out.push({ id: 'wk', color: 'w', from: 'k', to: 'k', file: kingFile, rank: 0, glyph: 0, opacity: fading })
  out.push({ id: 'bk', color: 'b', from: 'k', to: 'k', file: kingFile, rank: 7, glyph: 0, opacity: fading })
  out.push({ id: 'wf', color: 'w', from: 'f', to: 'q', file: queenFile, rank: 0, glyph, opacity: fading })
  out.push({ id: 'bf', color: 'b', from: 'f', to: 'q', file: queenFile, rank: 7, glyph, opacity: fading })
  return out
}

export function piecesOverlap(pieces: PreviewPiece[], gap = 0.9): boolean {
  const drawn = pieces.filter((piece) => piece.opacity > 0.05)
  for (let i = 0; i < drawn.length; i++) {
    for (let j = i + 1; j < drawn.length; j++) {
      const dx = drawn[i].file - drawn[j].file
      const dy = drawn[i].rank - drawn[j].rank
      if (dx * dx + dy * dy < gap * gap) return true
    }
  }
  return false
}
