import { describe, expect, it } from 'vitest'
import { legalMoves, makeMove } from './moves'
import { parseFen } from './position'
import { outcome } from './outcome'
import { pickMove } from './search'
import { LEVELS } from './levels'
import { eraById, resolveRules } from '../rules/eras'

describe('difficulty', () => {
  it('offers three levels, each allowed more time and depth than the last', () => {
    expect(LEVELS.map((level) => level.id)).toEqual(['easy', 'medium', 'hard'])
    expect(LEVELS[0].budgetMs).toBeLessThan(LEVELS[1].budgetMs)
    expect(LEVELS[1].budgetMs).toBeLessThan(LEVELS[2].budgetMs)
    expect(LEVELS[0].maxDepth).toBeLessThan(LEVELS[1].maxDepth)
    expect(LEVELS[1].maxDepth).toBeLessThan(LEVELS[2].maxDepth)
    expect(LEVELS[2].jitter).toBe(0)
  })
})

describe('search', () => {
  it('finds a mate in one', () => {
    const pos = parseFen('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1')
    const rules = resolveRules(eraById('fide'))
    const move = pickMove(pos, rules, { budgetMs: 200, maxDepth: 3, jitter: 0 })
    expect(move).toBeTruthy()
    expect(legalMoves(pos, rules).some((candidate) => candidate.from === move!.from && candidate.to === move!.to)).toBe(
      true,
    )
    expect(outcome(makeMove(pos, rules, move!), rules)?.reason).toBe('checkmate')
  })
})
