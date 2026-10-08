import { describe, expect, it } from 'vitest'
import { attemptDrop, createSession } from '../game/session'
import { explainDrop } from './explain'
import { legalMoves, makeMove, perft } from './moves'
import { toAlgebraic, toDescriptive } from './notation'
import { outcome } from './outcome'
import { moveUci, parseFen, startFen } from './position'
import { parseSq } from './squares'
import { pickMove } from './search'
import type { Rules } from './types'
import { eraById, eras, resolveRules } from '../rules/eras'
import { REASONS } from '../rules/reasons'

function rulesFor(id: (typeof eras)[number]['id'], chip?: string): Rules {
  return resolveRules(eraById(id), chip)
}

function ucis(fen: string, rules: Rules): string[] {
  return legalMoves(parseFen(fen), rules).map(moveUci)
}

function play(fen: string, rules: Rules, uci: string) {
  const pos = parseFen(fen)
  const move = legalMoves(pos, rules).find((item) => moveUci(item) === uci)
  expect(move, uci).toBeTruthy()
  return makeMove(pos, rules, move!)
}

const SHATRANJ_MATE = 'k7/1pF5/1K6/8/8/8/8/8 b - - 0 1'
const QUEEN_MATE = 'k7/8/1Q6/8/8/8/8/7K b - - 0 1'
const BARE_BEFORE = '8/p7/8/4k3/8/8/R7/7K w - - 0 1'
const REPLY_BARE = '8/8/8/8/8/8/R7/k1K5 b - - 0 1'
const CLEAR_CASTLE = '6k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'
const CHECK_CASTLE = '3k4/8/8/8/8/8/8/R3K3 w Q - 0 1'
const PATH_CASTLE = '4kr2/8/8/8/8/8/8/R3K2R w KQ - 0 1'
const PROMO = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1'
const FERZ = '6k1/8/8/8/8/8/8/3FK3 w - - 0 1'
const QUEEN_LONG = '6k1/8/8/8/8/8/4P3/3QK3 w - - 0 1'
const ALFIL = '4k3/8/8/8/8/8/1P6/2A1K3 w - - 0 1'
const BISHOP = '4k3/8/8/8/8/8/1P6/2B1K3 w - - 0 1'
const EP_BEFORE = '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1'

describe('shatranj', () => {
  const rules = rulesFor('shatranj')

  it('starts with ferz and alfil, and sixteen quiet moves', () => {
    expect(startFen(rules)).toBe('rnakfanr/pppppppp/8/8/8/8/PPPPPPPP/RNAKFANR w - - 0 1')
    expect(perft(parseFen(startFen(rules)), rules, 1)).toBe(16)
  })

  it('keeps the ferz to one diagonal and the alfil to a two-square jump', () => {
    const ferzMoves = ucis(FERZ, rules)
    expect(ferzMoves).toContain('d1c2')
    expect(ferzMoves).toContain('d1e2')
    expect(ferzMoves).not.toContain('d1d8')
    expect(ferzMoves).not.toContain('d1d2')
    const alfilMoves = ucis(ALFIL, rules)
    expect(alfilMoves).toContain('c1a3')
    expect(alfilMoves).toContain('c1e3')
    expect(alfilMoves).not.toContain('c1d2')
    expect(alfilMoves).not.toContain('c1b2')
  })

  it('has no pawn double step, no en passant, and no castling', () => {
    const opening = ucis(startFen(rules), rules)
    expect(opening).toContain('e2e3')
    expect(opening).not.toContain('e2e4')
    expect(opening.some((move) => move.startsWith('d1'))).toBe(false)
    expect(explainDrop(parseFen(startFen(rules)), rules, parseSq('e2'), parseSq('e4'))).toBe(
      REASONS.pawnDoubleEarly,
    )
  })

  it('promotes only to a ferz', () => {
    const moves = ucis(PROMO, rules).filter((move) => move.startsWith('e7e8'))
    expect(moves).toEqual(['e7e8f'])
  })

  it('scores stalemate as a win', () => {
    expect(outcome(parseFen(SHATRANJ_MATE), rules)).toEqual({ winner: 'w', reason: 'stalemate' })
  })

  it('wins by baring the king, and draws if the reply bares you back', () => {
    const bared = play(BARE_BEFORE, rules, 'a2a7')
    expect(outcome(bared, rules)).toEqual({ winner: 'w', reason: 'bare-king' })
    expect(ucis(REPLY_BARE, rules)).toEqual(['a1a2'])
    const drawn = play(REPLY_BARE, rules, 'a1a2')
    expect(outcome(drawn, rules)).toEqual({ winner: null, reason: 'mutual-bare' })
  })
})

describe('medieval Europe, against shatranj', () => {
  const rules = rulesFor('medieval')
  const previous = rulesFor('shatranj')

  it('keeps ferz, alfil, and the single pawn step', () => {
    expect(ucis(FERZ, rules)).not.toContain('d1d8')
    expect(ucis(ALFIL, rules)).toContain('c1a3')
    expect(ucis(startFen(rules), rules)).not.toContain('e2e4')
    expect(perft(parseFen(startFen(rules)), rules, 1)).toBe(16)
  })

  it('does not win by bare king', () => {
    const bared = play(BARE_BEFORE, rules, 'a2a7')
    expect(outcome(bared, rules)).toBeNull()
    expect(outcome(bared, previous)?.reason).toBe('bare-king')
  })

  it('scores unsettled stalemate as a draw', () => {
    expect(outcome(parseFen(SHATRANJ_MATE), rules)).toEqual({
      winner: null,
      reason: 'stalemate-unsettled',
    })
  })

  it('still promotes only to a ferz', () => {
    expect(ucis(PROMO, rules).filter((move) => move.startsWith('e7e8'))).toEqual(['e7e8f'])
  })
})

describe('queen’s chess, against medieval', () => {
  const rules = rulesFor('queen')

  it('lets the queen and the bishop run, and the pawn jump once', () => {
    expect(ucis(QUEEN_LONG, rules)).toContain('d1d8')
    expect(ucis(QUEEN_LONG, rules)).toContain('e2e4')
    expect(ucis(BISHOP, rules)).toContain('c1d2')
    expect(ucis(BISHOP, rules)).not.toContain('c1a3')
    expect(perft(parseFen(startFen(rules)), rules, 1)).toBe(20)
    expect(perft(parseFen(startFen(rules)), rules, 2)).toBe(400)
  })

  it('has the double step and still refuses en passant and castling', () => {
    const after = play(EP_BEFORE, rules, 'd7d5')
    expect(after.ep).toBe(-1)
    expect(legalMoves(after, rules).some((move) => move.enPassant)).toBe(false)
    expect(explainDrop(after, rules, parseSq('e5'), parseSq('d6'))).toBe(REASONS.passar)
    expect(ucis(CLEAR_CASTLE, rules).some((move) => move.startsWith('e1g1'))).toBe(false)
    expect(explainDrop(parseFen(CLEAR_CASTLE), rules, parseSq('e1'), parseSq('g1'))).toBe(
      REASONS.noCastling,
    )
  })

  it('promotes only to a queen, and stalemate still wins', () => {
    expect(ucis(PROMO, rules).filter((move) => move.startsWith('e7e8'))).toEqual(['e7e8q'])
    expect(outcome(parseFen(QUEEN_MATE), rules)).toEqual({ winner: 'w', reason: 'stalemate' })
  })
})

describe('en passant regions', () => {
  const spain = rulesFor('passant', 'spain')
  const italy = rulesFor('passant', 'italy')

  it('gives Spain the capture and Italy passar battaglia', () => {
    expect(spain.enPassant).toBe(true)
    expect(italy.enPassant).toBe(false)
    expect(italy.doubleStep).toBe(true)
    const spanish = play(EP_BEFORE, spain, 'd7d5')
    expect(spanish.ep).toBe(parseSq('d6'))
    const fromSpanish = legalMoves(spanish, spain).map(moveUci)
    expect(fromSpanish).toContain('e5d6')
    const italian = play(EP_BEFORE, italy, 'd7d5')
    expect(italian.ep).toBe(-1)
    expect(legalMoves(italian, italy).map(moveUci)).not.toContain('e5d6')
    expect(explainDrop(italian, italy, parseSq('e5'), parseSq('d6'))).toBe(REASONS.passar)
  })

  it('still has no castling, and promotes only to a queen', () => {
    expect(ucis(CLEAR_CASTLE, spain).some((move) => move.startsWith('e1g1'))).toBe(false)
    expect(ucis(PROMO, spain).filter((move) => move.startsWith('e7e8'))).toEqual(['e7e8q'])
  })
})

describe('castling split', () => {
  const ordinary = rulesFor('castling', 'ordinary')
  const italian = rulesFor('castling', 'italy1700')

  it('maps the chips onto castling and en passant together', () => {
    expect(ordinary.castling).toBe('ordinary')
    expect(ordinary.enPassant).toBe(true)
    expect(italian.castling).toBe('free')
    expect(italian.enPassant).toBe(false)
    expect(italian.doubleStep).toBe(true)
  })

  it('allows only the two ordinary castles, and several Italian placements', () => {
    const fixed = ucis(CLEAR_CASTLE, ordinary)
    expect(fixed).toContain('e1g1h1f1')
    expect(fixed).toContain('e1c1a1d1')
    expect(fixed.some((move) => move.startsWith('e1h1'))).toBe(false)
    expect(fixed.some((move) => move.startsWith('e1a1'))).toBe(false)
    expect(explainDrop(parseFen(CLEAR_CASTLE), ordinary, parseSq('e1'), parseSq('h1'))).toBe(
      REASONS.ordinaryOnly,
    )

    const free = ucis(CLEAR_CASTLE, italian)
    expect(free).toContain('e1g1h1f1')
    expect(free).toContain('e1c1a1d1')
    expect(free).toContain('e1h1h1e1')
    expect(free).toContain('e1a1a1b1')
    expect(free.filter((move) => move.startsWith('e1h1')).length).toBeGreaterThan(1)
  })

  it('lets ordinary castling give check, and forbids that in the Italian rule', () => {
    const fixed = ucis(CHECK_CASTLE, ordinary)
    expect(fixed).toContain('e1c1a1d1')
    const checking = legalMoves(parseFen(CHECK_CASTLE), ordinary).find((move) => moveUci(move) === 'e1c1a1d1')
    const after = makeMove(parseFen(CHECK_CASTLE), ordinary, checking!)
    expect(outcome(after, ordinary)).toBeNull()
    expect(ucis(CHECK_CASTLE, italian)).not.toContain('e1c1a1d1')
    expect(ucis(CHECK_CASTLE, italian)).toContain('e1c1a1e1')
  })

  it('refuses a king that would cross an attacked square', () => {
    expect(ucis(PATH_CASTLE, ordinary)).not.toContain('e1g1h1f1')
    expect(ucis(PATH_CASTLE, ordinary)).toContain('e1c1a1d1')
    expect(ucis(PATH_CASTLE, italian).some((move) => move.startsWith('e1h1'))).toBe(false)
  })

  it('plays passar battaglia on the Italian chip and en passant on the ordinary chip', () => {
    const spanish = play(EP_BEFORE, ordinary, 'd7d5')
    expect(legalMoves(spanish, ordinary).some((move) => move.enPassant)).toBe(true)
    const italy = play(EP_BEFORE, italian, 'd7d5')
    expect(legalMoves(italy, italian).some((move) => move.enPassant)).toBe(false)
  })
})

describe('tournament chess, against the castling split', () => {
  const rules = rulesFor('tournament')

  it('keeps ordinary castling, kills free castling, and keeps en passant', () => {
    const moves = ucis(CLEAR_CASTLE, rules)
    expect(moves).toContain('e1g1h1f1')
    expect(moves.some((move) => move.startsWith('e1h1'))).toBe(false)
    const after = play(EP_BEFORE, rules, 'd7d5')
    expect(legalMoves(after, rules).some((move) => move.enPassant)).toBe(true)
  })

  it('draws stalemate, allows every promotion, and draws the fifty-move game', () => {
    expect(outcome(parseFen(QUEEN_MATE), rules)).toEqual({ winner: null, reason: 'stalemate' })
    expect(outcome(parseFen(QUEEN_MATE), rulesFor('castling'))).toEqual({
      winner: 'w',
      reason: 'stalemate',
    })
    const promotions = ucis(PROMO, rules).filter((move) => move.startsWith('e7e8')).sort()
    expect(promotions).toEqual(['e7e8b', 'e7e8n', 'e7e8q', 'e7e8r'])
    const quiet = parseFen('4k3/8/8/8/8/4P3/8/4K3 w - - 100 70')
    expect(outcome(quiet, rules)?.reason).toBe('fifty-move')
    expect(outcome(quiet, rulesFor('queen'))).toBeNull()
  })

  it('does not yet draw by repetition, and has no clock or touch-move', () => {
    expect(rules.repetition).toBe(false)
    expect(rules.clock).toBe(false)
    expect(rules.touchMove).toBe(false)
    expect(outcome(parseFen(startFen(rules)), rules, 3)).toBeNull()
  })
})

describe('FIDE, against tournament chess', () => {
  const rules = rulesFor('fide')

  it('matches modern perft through three plies', () => {
    const start = parseFen(startFen(rules))
    expect(perft(start, rules, 1)).toBe(20)
    expect(perft(start, rules, 2)).toBe(400)
    expect(perft(start, rules, 3)).toBe(8902)
  })

  it('draws a thrice-repeated position and runs a clock with touch-move', () => {
    expect(rules.repetition).toBe(true)
    expect(rules.clock).toBe(true)
    expect(rules.touchMove).toBe(true)
    expect(outcome(parseFen(startFen(rules)), rules, 3)?.reason).toBe('repetition')
    expect(outcome(parseFen(QUEEN_MATE), rules)?.reason).toBe('stalemate')
  })

  it('prints algebraic as the primary sheet and descriptive as the secondary', () => {
    const session = createSession({ eraId: 'fide', mode: 'pass', now: 0 })
    const attempt = attemptDrop(session, parseSq('e2'), parseSq('e4'), undefined, 0)
    expect(attempt.type).toBe('moved')
    if (attempt.type !== 'moved') return
    expect(attempt.session.history[0].primary).toBe('e4')
    expect(attempt.session.history[0].secondary).toBe('P-K4')
  })
})

describe('notation follows the stop', () => {
  it('records shatranj in array notation, with algebraic beside it', () => {
    const rules = rulesFor('shatranj')
    const pos = parseFen(startFen(rules))
    const move = legalMoves(pos, rules).find((item) => moveUci(item) === 'd2d3')
    expect(toDescriptive(pos, rules, move!)).toBe('P-K3')
    expect(toAlgebraic(pos, rules, move!)).toBe('d3')
  })
})

describe('the engine opponent stays inside the active rules', () => {
  it('returns a legal move at every stop and chip', () => {
    for (const era of eras) {
      const chips = era.chips.length ? era.chips.map((chip) => chip.id) : ['']
      for (const chip of chips) {
        const rules = resolveRules(era, chip)
        const pos = parseFen(startFen(rules))
        const move = pickMove(pos, rules, {
          budgetMs: 40,
          maxDepth: 2,
          seed: 3,
          hashes: [pos.board.join('.')],
        })
        const legal = legalMoves(pos, rules).map(moveUci)
        expect(legal, era.id + chip).toContain(move ? moveUci(move) : '')
      }
    }
  })
})
