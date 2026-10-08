import { describe, expect, it } from 'vitest'
import { agreeDraw, createSession, resign, resigningSide } from '../game/session'
import { boardLines } from '../rules/describe'
import { eraById, eras, resolveRules } from '../rules/eras'
import { museumSearch, readMuseumQuery } from '../ui/query'
import { REASONS } from '../rules/reasons'
import { explainDrop } from './explain'
import { legalMoves, makeMove } from './moves'
import { fileEdgeLabel, legendFor } from './notation'
import { outcome } from './outcome'
import { moveUci, parseFen, startFen } from './position'
import { parseSq } from './squares'
import type { Position, Rules } from './types'

function resolved(id: (typeof eras)[number]['id'], chip?: string): Rules {
  return resolveRules(eraById(id), chip)
}

function playLine(rules: Rules, moves: string[], fen = startFen(rules)): Position {
  let pos = parseFen(fen)
  for (const uci of moves) {
    const move = legalMoves(pos, rules).find((item) => moveUci(item) === uci)
    expect(move, uci).toBeTruthy()
    pos = makeMove(pos, rules, move!)
  }
  return pos
}

function refused(pos: Position, rules: Rules, from: string, to: string): string {
  const text = explainDrop(pos, rules, parseSq(from), parseSq(to))
  expect(legalMoves(pos, rules).some((move) => move.from === parseSq(from) && move.to === parseSq(to))).toBe(false)
  return text
}

describe('QA repros: a refusal names the rule that failed', () => {
  it('lets checkmate beat a fifty-move clock', () => {
    const rules = resolved('tournament')
    const before = parseFen('7k/5Q2/6K1/8/8/8/5N2/n7 w - - 99 1')
    expect(outcome(before, rules)).toBeNull()
    const mate = playLine(rules, ['f7h7'], '7k/5Q2/6K1/8/8/8/5N2/n7 w - - 99 1')
    expect(mate.halfmove).toBe(100)
    expect(outcome(mate, rules)).toEqual({ winner: 'w', reason: 'checkmate' })
    expect(outcome(mate, rules, 3)).toEqual({ winner: 'w', reason: 'checkmate' })
    const quiet = parseFen('4k3/8/8/8/8/4P3/8/4K3 w - - 100 70')
    expect(outcome(quiet, rules)?.reason).toBe('fifty-move')
  })

  it('says you cannot castle out of check', () => {
    const rules = resolved('castling', 'ordinary')
    const pos = playLine(rules, ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'd2d4', 'f8b4'])
    expect(refused(pos, rules, 'e1', 'g1')).toBe(REASONS.castleOutOfCheck)
  })

  it('says the king cannot cross an attacked square', () => {
    const rules = resolved('castling', 'ordinary')
    const pos = playLine(rules, ['e2e4', 'b7b6', 'g2g3', 'c8a6', 'g1f3', 'h7h6', 'f1h3', 'd7d6'])
    expect(refused(pos, rules, 'e1', 'g1')).toBe(REASONS.castleThrough)
  })

  it('says a piece stands in the way when the knight still occupies g1', () => {
    const rules = resolved('castling', 'ordinary')
    const pos = parseFen(startFen(rules))
    expect(refused(pos, rules, 'e1', 'g1')).toBe(REASONS.blocked)
  })

  it('names the landing square when only that square is attacked', () => {
    const rules = resolved('castling', 'ordinary')
    const pos = parseFen('4k3/8/8/2b5/8/8/8/4K2R w K - 0 1')
    expect(refused(pos, rules, 'e1', 'g1')).toBe(REASONS.castleLand)
  })

  it('does not talk about a passing pawn on a plain empty diagonal', () => {
    const shatranj = resolved('shatranj')
    const spain = resolved('passant', 'spain')
    const italy = resolved('passant', 'italy')
    const fide = resolved('fide')
    expect(refused(parseFen(startFen(shatranj)), shatranj, 'e2', 'd3')).toBe(REASONS.pawnDiagonal)
    expect(refused(parseFen(startFen(spain)), spain, 'e2', 'd3')).toBe(REASONS.pawnDiagonal)
    expect(refused(parseFen(startFen(italy)), italy, 'e2', 'd3')).toBe(REASONS.pawnDiagonal)
    const neverPassed = playLine(fide, ['e2e4', 'e7e6', 'e4e5', 'a7a6'])
    expect(refused(neverPassed, fide, 'e5', 'd6')).toBe(REASONS.pawnDiagonal)
    for (const text of [
      refused(parseFen(startFen(shatranj)), shatranj, 'e2', 'd3'),
      refused(parseFen(startFen(italy)), italy, 'e2', 'd3'),
      refused(neverPassed, fide, 'e5', 'd6'),
    ]) {
      expect(text.toLowerCase()).not.toContain('pass')
    }
  })

  it('keeps passar battaglia for a pawn that has just jumped', () => {
    const italy = resolved('passant', 'italy')
    const pos = playLine(italy, ['e2e4', 'e7e6', 'e4e5', 'd7d5'])
    expect(refused(pos, italy, 'e5', 'd6')).toBe(REASONS.passar)
  })

  it('calls a pinned double step a check, once the path is clear', () => {
    const rules = resolved('queen')
    const pos = playLine(rules, ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8b4'])
    expect(refused(pos, rules, 'd2', 'd4')).toBe(REASONS.exposed)
    expect(refused(pos, rules, 'd2', 'd3')).toBe(REASONS.exposed)
  })

  it('gives a ferz file slide the long-queen sentence', () => {
    const rules = resolved('shatranj')
    const pos = parseFen(startFen(rules))
    expect(refused(pos, rules, 'e1', 'e3')).toBe(REASONS.ferzSlide)
    expect(refused(pos, rules, 'e1', 'b4')).toBe(REASONS.ferzSlide)
  })
})

describe('QA repros: sheets, rematch, coordinates, links, cards', () => {
  it('uses the descriptive legend when that sheet is the one on screen', () => {
    expect(legendFor('algebraic', true)).toBe(
      'English descriptive, as Staunton printed it. Ranks count from the side to move.',
    )
    expect(legendFor('algebraic', false)).toBe('Modern algebraic. Files a–h, ranks 1–8 counted from White.')
    expect(legendFor('shatranj', true)).toBe('Modern algebraic. Files a–h, ranks 1–8 counted from White.')
    expect(legendFor('descriptive', false)).toContain('Staunton')
  })

  it('names the side that resigns, and can agree a draw or start the same game again', () => {
    const pass = createSession({ eraId: 'medieval', chipId: '', mode: 'pass', now: 0 })
    expect(resigningSide(pass)).toBe('w')
    expect(resign(pass, 'w').result).toEqual({ winner: 'b', reason: 'resign' })
    const blackToMove = { ...pass, pos: { ...pass.pos, turn: 'b' as const } }
    expect(resigningSide(blackToMove)).toBe('b')
    const engine = createSession({ eraId: 'medieval', mode: 'engine', human: 'b', now: 0 })
    expect(resigningSide(engine)).toBe('b')
    expect(agreeDraw(pass).result).toEqual({ winner: null, reason: 'agreement' })
    const again = createSession({
      eraId: pass.eraId,
      chipId: pass.chipId,
      mode: pass.mode,
      human: pass.human,
      difficulty: pass.difficulty,
      now: 1,
    })
    expect(again.history).toHaveLength(0)
    expect(again.eraId).toBe('medieval')
    expect(again.result).toBeNull()
  })

  it('prints the era’s file names on the board and keeps rank numbers with White', () => {
    expect(fileEdgeLabel(0, 'algebraic')).toBe('a')
    expect(fileEdgeLabel(3, 'shatranj')).toBe('K')
    expect(fileEdgeLabel(4, 'shatranj')).toBe('F')
    expect(fileEdgeLabel(1, 'descriptive')).toBe('QKt')
    expect(fileEdgeLabel(4, 'descriptive')).toBe('K')
  })

  it('keeps an unknown stop visible and puts the chip in the query', () => {
    expect(readMuseumQuery('?stop=nope')).toEqual({ index: 0, chipId: null, unknownStop: 'nope' })
    expect(readMuseumQuery('?stop=queen').index).toBe(2)
    expect(readMuseumQuery('?stop=passant&chip=italy')).toMatchObject({ index: 3, chipId: 'italy', unknownStop: null })
    expect(readMuseumQuery('?stop=passant&chip=nope').chipId).toBeNull()
    expect(museumSearch('passant', 'italy')).toBe('?stop=passant&chip=italy')
    expect(museumSearch('fide', '')).toBe('?stop=fide')
    expect(eras.map((era) => era.short)).toEqual([
      'Shatranj',
      'Medieval',
      'Queen',
      'Passant',
      'Castling',
      'Tourney',
      'FIDE',
    ])
  })

  it('dates the fifty-move rule, the clock, and the Italian chip without overstating them', () => {
    const tourney = eraById('tournament')
    const card = [...tourney.changed, tourney.why].join(' ')
    expect(card).toContain('1561')
    expect(card).toContain('1883')
    expect(card).not.toContain('fifty barren moves drew')
    const fide = eraById('fide')
    const fideCard = [...fide.changed, fide.why].join(' ')
    expect(fideCard).toContain('eighteenth-century')
    expect(fideCard).toContain('1883')
    expect(fideCard).not.toContain('house custom')
    const passant = eraById('passant')
    const italy = passant.chips.find((chip) => chip.id === 'italy')
    expect(italy?.label).not.toBe('Italy & Germany')
    expect(`${italy?.label} ${italy?.detail} ${passant.changed.join(' ')} ${passant.why}`).toContain('1822')
    expect(passant.why).toContain('did not share one code')
    expect(passant.why).toContain('bare king')
    const castling = eraById('castling')
    const castlingCard = [...castling.changed, castling.why, ...boardLines(resolved('castling', 'italy1700'))].join(' ')
    expect(castlingCard).toContain('reconstruction')
    expect(castlingCard).toContain('Modenese')
    expect(castlingCard).toContain('1847')
    const queenCard = [...eraById('queen').changed, ...boardLines(resolved('queen'))].join(' ')
    expect(queenCard).toContain('simplification')
  })
})
