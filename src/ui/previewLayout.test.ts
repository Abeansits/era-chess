import { describe, expect, it } from 'vitest'
import { paletteAt } from './boardColors'
import { piecesOverlap, previewPieces } from './previewLayout'

function channelDelta(a: string, b: string): number {
  const nums = (hex: string) => hex.match(/\d+/g)!.map(Number)
  const left = nums(a)
  const right = nums(b)
  return Math.max(...left.map((value, i) => Math.abs(value - right[i])))
}

describe('preview morph', () => {
  it('turns the ferz into the queen on the e-file before anyone changes squares', () => {
    const early = previewPieces(0.2)
    const queen = early.find((piece) => piece.id === 'wf')
    const king = early.find((piece) => piece.id === 'wk')
    expect(queen).toMatchObject({ file: 4, rank: 0, from: 'f', to: 'q' })
    expect(king).toMatchObject({ file: 3, rank: 0 })
    expect(queen!.glyph).toBeGreaterThan(0.4)
    expect(queen!.opacity).toBe(1)
  })

  it('ends with the queen on the d-file and the king on the e-file', () => {
    const done = previewPieces(1)
    expect(done.find((piece) => piece.id === 'wf')).toMatchObject({ file: 3, to: 'q', opacity: 1, glyph: 1 })
    expect(done.find((piece) => piece.id === 'wk')).toMatchObject({ file: 4, opacity: 1 })
  })

  it('never draws two pieces on top of each other', () => {
    for (let step = 0; step <= 40; step++) {
      const pieces = previewPieces(step / 40)
      expect(piecesOverlap(pieces)).toBe(false)
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
