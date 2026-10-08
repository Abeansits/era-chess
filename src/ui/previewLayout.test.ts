import { describe, expect, it } from 'vitest'
import { parseFen, startFen } from '../engine/position'
import { colorOf, fileOf, kindOf, rankOf, type PieceKind } from '../engine/squares'
import { eras } from '../rules/eras'
import { paletteAt } from './boardColors'
import { morphCaption, piecesOverlap, previewPieces, type PreviewPiece } from './previewLayout'

function channelDelta(a: string, b: string): number {
  const nums = (hex: string) => hex.match(/\d+/g)!.map(Number)
  const left = nums(a)
  const right = nums(b)
  return Math.max(...left.map((value, i) => Math.abs(value - right[i])))
}

function visible(pieces: PreviewPiece[], color: 'w' | 'b', kind: PieceKind): PreviewPiece[] {
  return pieces.filter((piece) => piece.color === color && piece.kind === kind && piece.opacity > 0.05)
}

function backRank(id: 'shatranj' | 'queen'): Array<{ file: number; kind: PieceKind }> {
  const rules = eras.find((era) => era.id === id)!.rules
  const pos = parseFen(startFen(rules))
  const out: Array<{ file: number; kind: PieceKind }> = []
  for (let sq = 0; sq < 64; sq++) {
    const code = pos.board[sq]
    if (!code || colorOf(code) !== 'w' || rankOf(sq) !== 0) continue
    out.push({ file: fileOf(sq), kind: kindOf(code)! })
  }
  return out
}

describe('preview morph', () => {
  it('starts on the shatranj array, king on d and ferz on e', () => {
    const pieces = previewPieces(0).filter((piece) => piece.color === 'w' && piece.rank === 0 && piece.opacity > 0.9)
    const files = pieces.map((piece) => ({ file: piece.file, kind: piece.kind })).sort((a, b) => a.file - b.file)
    expect(files).toEqual(backRank('shatranj'))
    expect(visible(previewPieces(0), 'w', 'k')[0].file).toBe(3)
    expect(visible(previewPieces(0), 'w', 'f')[0].file).toBe(4)
    expect(morphCaption(0)).toBe('King on the d-file, ferz on the e-file.')
  })

  it('lets the old icon finish leaving before the new one appears', () => {
    const midLeave = previewPieces(0.2)
    expect(visible(midLeave, 'w', 'f')[0]).toMatchObject({ file: 4 })
    expect(visible(midLeave, 'w', 'f')[0].opacity).toBeLessThan(1)
    expect(visible(midLeave, 'w', 'q')).toHaveLength(0)
    expect(visible(midLeave, 'w', 'b')).toHaveLength(0)
    expect(visible(midLeave, 'w', 'k')[0].file).toBe(3)

    const between = previewPieces(0.5)
    expect(visible(between, 'w', 'f')).toHaveLength(0)
    expect(visible(between, 'w', 'q')).toHaveLength(0)
    expect(visible(between, 'w', 'a')).toHaveLength(0)
    expect(visible(between, 'w', 'b')).toHaveLength(0)
    const king = visible(between, 'w', 'k')[0]
    expect(king.file).toBeGreaterThan(3)
    expect(king.file).toBeLessThan(4)
  })

  it('keeps the kingside knight on g and the rook on h', () => {
    for (const id of ['shatranj', 'queen'] as const) {
      const files = backRank(id)
      expect(files.find((piece) => piece.file === 6)?.kind).toBe('n')
      expect(files.find((piece) => piece.file === 7)?.kind).toBe('r')
      expect(files.find((piece) => piece.file === 0)?.kind).toBe('r')
      expect(files.find((piece) => piece.file === 1)?.kind).toBe('n')
    }
    const shown = previewPieces(2).filter((piece) => piece.color === 'w' && piece.rank === 0 && piece.opacity > 0.9)
    expect(shown.find((piece) => piece.file === 6)?.kind).toBe('n')
    expect(shown.find((piece) => piece.file === 7)?.kind).toBe('r')
  })

  it('ends on the queen’s-chess array, queen on d and king on e', () => {
    const done = previewPieces(1)
    const files = done
      .filter((piece) => piece.color === 'w' && piece.rank === 0 && piece.opacity > 0.9)
      .map((piece) => ({ file: piece.file, kind: piece.kind }))
      .sort((a, b) => a.file - b.file)
    expect(files).toEqual(backRank('queen'))
    expect(visible(done, 'w', 'q')[0]).toMatchObject({ file: 3, opacity: 1, scale: 1 })
    expect(visible(done, 'w', 'k')[0]).toMatchObject({ file: 4, opacity: 1 })
    expect(visible(done, 'w', 'f')).toHaveLength(0)
    expect(morphCaption(1)).toBe('Queen on the d-file, king on the e-file.')
  })

  it('never stacks two icons, including the ferz with the queen', () => {
    for (let step = 0; step <= 100; step++) {
      const pieces = previewPieces(step / 100)
      expect(piecesOverlap(pieces)).toBe(false)
      for (const color of ['w', 'b'] as const) {
        const counselor = [...visible(pieces, color, 'f'), ...visible(pieces, color, 'q')]
        expect(counselor.length).toBeLessThanOrEqual(1)
        for (const file of [2, 5]) {
          const elephant = visible(pieces, color, 'a')
            .concat(visible(pieces, color, 'b'))
            .filter((piece) => piece.file === file)
          expect(elephant.length).toBeLessThanOrEqual(1)
        }
      }
    }
  })
})

describe('board palette', () => {
  it('changes gradually along the axis', () => {
    for (let step = 0; step < 60; step++) {
      const from = paletteAt(step / 10)
      const to = paletteAt((step + 1) / 10)
      expect(channelDelta(from.light, to.light)).toBeLessThan(18)
      expect(channelDelta(from.dark, to.dark)).toBeLessThan(18)
    }
  })
})
