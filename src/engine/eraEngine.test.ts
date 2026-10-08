import { describe, expect, it } from 'vitest'
import { createSession, positionAt, replayUci, sessionFromLink, shareLink } from '../game/session'
import { readGameLink } from '../ui/query'
import { eraById, resolveRules } from '../rules/eras'
import { levelById } from './levels'
import { legalMoves, makeMove } from './moves'
import { outcome } from './outcome'
import { moveUci, parseFen, startFen, toFen } from './position'
import { kindOf } from './squares'
import { engineSeed, pickMove } from './search'

const BARE = '8/p7/8/4k3/8/8/R7/7K w - - 0 1'
const PASSING = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'

describe('an opponent that knows the era', () => {
  it('takes the last pawn and bares the king', () => {
    const rules = resolveRules(eraById('shatranj'))
    const pos = parseFen(BARE)
    const move = pickMove(pos, rules, { budgetMs: 200, maxDepth: 2, jitter: 0, seed: 3 })
    expect(moveUci(move!)).toBe('a2a7')
    expect(outcome(makeMove(pos, rules, move!), rules)).toEqual({ winner: 'w', reason: 'bare-king' })
  })

  it('takes in passing where that capture exists, and castles when it can', () => {
    const spain = resolveRules(eraById('passant'), 'spain')
    const ep = pickMove(parseFen(PASSING), spain, { budgetMs: 200, maxDepth: 2, jitter: 0, seed: 1 })
    expect(ep?.enPassant).toBe(true)
    const ready = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5'
    const ordinary = resolveRules(eraById('castling'), 'ordinary')
    const castle = pickMove(parseFen(ready), ordinary, { budgetMs: 400, maxDepth: 3, jitter: 0, seed: 1 })
    expect(castle?.castle, moveUci(castle!)).toBeTruthy()
    const italian = resolveRules(eraById('castling'), 'italy1700')
    const free = pickMove(parseFen(ready), italian, { budgetMs: 500, maxDepth: 3, jitter: 0, seed: 4 })
    expect(free?.castle, moveUci(free!)).toBeTruthy()
  })

  it('does not walk the king out on the first move of queen’s chess', () => {
    const rules = resolveRules(eraById('queen'))
    const pos = parseFen(startFen(rules))
    const move = pickMove(pos, rules, { budgetMs: 400, maxDepth: 3, jitter: 0, seed: 1 })
    expect(kindOf(pos.board[move!.from])).not.toBe('k')
  })

  it('varies the opening when the game seed changes', () => {
    const rules = resolveRules(eraById('queen'))
    const pos = parseFen(startFen(rules))
    const easy = levelById('easy')
    const played = new Set<string>()
    for (const seed of [1, 2, 5, 9, 14, 22, 30]) {
      const move = pickMove(pos, rules, {
        budgetMs: easy.budgetMs,
        maxDepth: easy.maxDepth,
        jitter: easy.jitter,
        seed: engineSeed(seed, 0),
      })
      expect(legalMoves(pos, rules).map(moveUci)).toContain(moveUci(move!))
      played.add(moveUci(move!))
    }
    expect(played.size).toBeGreaterThan(1)
    expect(engineSeed(1, 0)).not.toBe(engineSeed(2, 0))
    expect(engineSeed(4, 0)).not.toBe(11)
  })
})

describe('share and step through', () => {
  it('round-trips the stop, the chip, and the moves', () => {
    const opened = createSession({ eraId: 'passant', chipId: 'italy', mode: 'pass', now: 5, seed: 5, boardStill: true })
    const played = replayUci(opened, ['e2e4', 'e7e6'], 5)
    const link = readGameLink(shareLink(played))
    expect(link).toMatchObject({ eraId: 'passant', chipId: 'italy', mode: 'pass', boardStill: true })
    expect(link?.moves).toEqual(['e2e4', 'e7e6'])
    const again = sessionFromLink(link!, 5)
    expect(again.history.map((entry) => moveUci(entry.move))).toEqual(['e2e4', 'e7e6'])
    expect(toFen(positionAt(again, 0))).toBe(again.startFen)
    expect(toFen(positionAt(again, 1))).not.toBe(again.startFen)
    expect(toFen(positionAt(again, 2))).toBe(toFen(again.pos))
    const rematch = createSession({
      eraId: again.eraId,
      chipId: again.chipId,
      mode: again.mode,
      human: again.human,
      difficulty: again.difficulty,
      fen: again.startFen,
      boardStill: again.boardStill,
      seed: 99,
      now: 9,
    })
    expect(rematch.chipId).toBe('italy')
    expect(rematch.history).toHaveLength(0)
    expect(rematch.seed).not.toBe(again.seed)
  })

  it('keeps a composed position in the link', () => {
    const opened = createSession({ eraId: 'shatranj', mode: 'engine', human: 'w', fen: BARE, now: 3, seed: 3 })
    const link = readGameLink(shareLink(opened))
    expect(link?.fen).toContain('8/p7')
    const again = sessionFromLink(link!, 3)
    expect(again.result).toBeNull()
    expect(toFen(again.pos)).toBe(toFen(opened.pos))
  })
})
