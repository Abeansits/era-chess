import { describe, expect, it } from 'vitest'
import { boardLines } from './describe'
import { eraById, resolveRules } from './eras'
import { guideForKind, pieceGuide, pieceKindForWord, pieceLabel, splitPieceWords } from './pieceNames'
import { REASONS } from './reasons'

describe('period piece names', () => {
  it('hears ferz, alfil, shah, rukh, faras, and baidaq', () => {
    expect(pieceKindForWord('ferz')).toBe('f')
    expect(pieceKindForWord('Alfil')).toBe('a')
    expect(pieceKindForWord('aufin')).toBe('a')
    expect(pieceKindForWord('shah')).toBe('k')
    expect(pieceKindForWord('rukh')).toBe('r')
    expect(pieceKindForWord('faras')).toBe('n')
    expect(pieceKindForWord('baidaq')).toBe('p')
    const parts = splitPieceWords('The ferz steps one square. The alfil jumps.')
    expect(parts.filter((part) => part.kind).map((part) => part.kind)).toEqual(['f', 'a'])
  })

  it('labels a selected ferz with the modern piece, and lists every piece on the stop', () => {
    const shatranj = resolveRules(eraById('shatranj'))
    const ferz = guideForKind(shatranj, 'f')
    expect(ferz && pieceLabel(ferz)).toBe("Ferz (today's queen): one step diagonally")
    expect(pieceGuide(shatranj).map((guide) => guide.period)).toEqual([
      'Rukh',
      'Faras',
      'Alfil',
      'Ferz',
      'Shah',
      'Baidaq',
    ])
    const queen = resolveRules(eraById('queen'))
    const named = guideForKind(queen, 'q')
    expect(named && pieceLabel(named)).toBe('Queen: slides any distance')
    expect(pieceGuide(queen).some((guide) => guide.kind === 'f')).toBe(false)
  })

  it('finds the piece words on the shatranj card and in a refusal', () => {
    const lines = boardLines(resolveRules(eraById('shatranj')))
    const kinds = lines.flatMap((line) => splitPieceWords(line).map((part) => part.kind)).filter((kind) => kind !== null)
    expect(kinds).toContain('f')
    expect(kinds).toContain('a')
    expect(kinds).toContain('k')
    expect(kinds).toContain('p')
    const refusal = splitPieceWords(REASONS.ferzSlide)
      .map((part) => part.kind)
      .filter((kind) => kind !== null)
    expect(refusal).toEqual(['f', 'q'])
  })
})
