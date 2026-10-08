import type { Color, PieceKind } from '../engine/squares'

export type PreviewPiece = {
  id: string
  color: Color
  kind: PieceKind
  file: number
  rank: number
  opacity: number
  scale: number
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

function fadeOut(u: number, start: number, end: number): number {
  if (u <= start) return 1
  if (u >= end) return 0
  return 1 - (u - start) / (end - start)
}

function fadeIn(u: number, start: number, end: number): number {
  if (u <= start) return 0
  if (u >= end) return 1
  return (u - start) / (end - start)
}

/** Shrinks away, then grows in. The two icons are never drawn together. */
function outScale(opacity: number): number {
  return 0.72 + 0.28 * opacity
}

/**
 * Shatranj array: king on the d-file, ferz on the e-file, alfils on the
 * bishop's squares. Queen's chess: queen on the d-file, king on the e-file,
 * bishops where the alfils stood. Each old icon is gone before the new one
 * appears, and the king steps across only once the e-file is empty.
 */
export function previewPieces(t: number): PreviewPiece[] {
  const u = clamp01(t)
  const leaving = fadeOut(u, 0, 0.36)
  const arriving = fadeIn(u, 0.7, 1)
  const kingFile = u <= 0.42 ? 3 : u >= 0.68 ? 4 : 3 + (u - 0.42) / 0.26
  const out: PreviewPiece[] = []
  const push = (piece: PreviewPiece) => {
    if (piece.opacity > 0.004) out.push(piece)
  }
  for (let file = 0; file < 8; file++) {
    push({ id: `wp${file}`, color: 'w', kind: 'p', file, rank: 1, opacity: 1, scale: 1 })
    push({ id: `bp${file}`, color: 'b', kind: 'p', file, rank: 6, opacity: 1, scale: 1 })
  }
  const stay: Array<[number, PieceKind]> = [
    [0, 'r'],
    [1, 'n'],
    [6, 'n'],
    [7, 'r'],
  ]
  for (const [file, kind] of stay) {
    push({ id: `w${file}`, color: 'w', kind, file, rank: 0, opacity: 1, scale: 1 })
    push({ id: `b${file}`, color: 'b', kind, file, rank: 7, opacity: 1, scale: 1 })
  }
  for (const file of [2, 5]) {
    push({ id: `wa${file}`, color: 'w', kind: 'a', file, rank: 0, opacity: leaving, scale: outScale(leaving) })
    push({ id: `ba${file}`, color: 'b', kind: 'a', file, rank: 7, opacity: leaving, scale: outScale(leaving) })
    push({ id: `wb${file}`, color: 'w', kind: 'b', file, rank: 0, opacity: arriving, scale: outScale(arriving) })
    push({ id: `bb${file}`, color: 'b', kind: 'b', file, rank: 7, opacity: arriving, scale: outScale(arriving) })
  }
  push({ id: 'wk', color: 'w', kind: 'k', file: kingFile, rank: 0, opacity: 1, scale: 1 })
  push({ id: 'bk', color: 'b', kind: 'k', file: kingFile, rank: 7, opacity: 1, scale: 1 })
  push({ id: 'wf', color: 'w', kind: 'f', file: 4, rank: 0, opacity: leaving, scale: outScale(leaving) })
  push({ id: 'bf', color: 'b', kind: 'f', file: 4, rank: 7, opacity: leaving, scale: outScale(leaving) })
  push({ id: 'wq', color: 'w', kind: 'q', file: 3, rank: 0, opacity: arriving, scale: outScale(arriving) })
  push({ id: 'bq', color: 'b', kind: 'q', file: 3, rank: 7, opacity: arriving, scale: outScale(arriving) })
  return out
}

export function morphCaption(t: number): string {
  const u = clamp01(t)
  if (u < 0.36) return 'King on the d-file, ferz on the e-file.'
  if (u < 0.7) return 'The ferz leaves the e-file. The king steps across to it.'
  return 'Queen on the d-file, king on the e-file.'
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
