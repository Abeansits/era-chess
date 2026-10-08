import { describe, expect, it } from 'vitest'
import { commitMove, createSession, openSharedLink, pauseClock, resumeClock, tick } from './session'
import { eraById, resolveRules } from '../rules/eras'
import { eraMoveSentence } from '../rules/eraMove'
import { legalMoves, makeMove } from '../engine/moves'
import { outcome } from '../engine/outcome'
import { moveUci, parseFen } from '../engine/position'

const BARE = '8/p7/8/4k3/8/8/R7/7K w - - 0 1'
const PASSING = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'
const CASTLES = '6k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'

describe('a share link that cannot be played', () => {
  it('keeps the museum up when the position cannot be read', () => {
    const short = openSharedLink('?stop=fide&mode=pass&fen=8/8/8/8/8/8/8', 1)
    expect(short.session).toBeNull()
    expect(short.notice).toBe('That position could not be read.')
    const piece = openSharedLink('?stop=fide&mode=pass&fen=8/8/8/8/8/8/8/? w - - 0 1', 1)
    expect(piece.session).toBeNull()
    expect(piece.notice).toBe('That position could not be read.')
    expect(() => openSharedLink('?stop=fide&mode=pass&fen=8/8/8/8/8/8/8', 1)).not.toThrow()
  })

  it('names an illegal move, junk, and an unknown chip instead of opening a quieter game', () => {
    const illegal = openSharedLink('?stop=shatranj&mode=pass&moves=e2e4', 1)
    expect(illegal.session).toBeNull()
    expect(illegal.notice).toContain('e2e4')
    expect(illegal.notice).toContain('not legal')

    const junk = openSharedLink('?stop=fide&mode=pass&moves=e2e5.zzzz', 1)
    expect(junk.session).toBeNull()
    expect(junk.notice).toContain('e2e5')

    const tail = openSharedLink('?stop=fide&mode=pass&moves=e2e4.zzzz', 1)
    expect(tail.session).toBeNull()
    expect(tail.notice).toContain('zzzz')
    expect(tail.notice).toContain('not a move')

    const chip = openSharedLink('?stop=castling&chip=not-a-chip&mode=pass', 1)
    expect(chip.session).toBeNull()
    expect(chip.notice).toContain('not-a-chip')
    expect(chip.notice).toContain('Spain, France & England')

    const played = openSharedLink('?stop=fide&mode=pass&moves=e2e4.e7e5', 1)
    expect(played.notice).toBeNull()
    expect(played.session?.history).toHaveLength(2)
  })
})

describe('the clock waits with the sheet', () => {
  it('does not spend the side to move while a ply is paused', () => {
    const opened = createSession({ eraId: 'fide', mode: 'pass', now: 1_000 })
    const moved = commitMove(
      opened,
      legalMoves(opened.pos, opened.rules).find((move) => moveUci(move) === 'e2e4')!,
      1_000,
    )
    const before = moved.clocks!.b
    const paused = pauseClock(moved, 4_000)
    expect(paused.result).toBeNull()
    expect(paused.clockStamp).toBeNull()
    expect(paused.clocks!.b).toBe(before - 3_000)
    expect(paused.clocks!.w).toBe(moved.clocks!.w)
    const resumed = resumeClock(paused, 9_000)
    expect(resumed.clocks!.b).toBe(paused.clocks!.b)
    expect(resumed.clockStamp).toBe(9_000)
    const later = tick(resumed, 10_000)
    expect(later.clocks!.b).toBe(resumed.clocks!.b - 1_000)
  })
})

describe('an era move under the engine’s play', () => {
  it('uses one sentence for en passant, castling, free castling, and a bare king', () => {
    const spain = resolveRules(eraById('passant'), 'spain')
    const ep = legalMoves(parseFen(PASSING), spain).find((move) => move.enPassant)
    expect(eraMoveSentence(spain, ep!, null)).toBe(
      'A pawn that has just stepped two squares may be taken in passing.',
    )

    const ordinary = resolveRules(eraById('castling'), 'ordinary')
    const castle = legalMoves(parseFen(CASTLES), ordinary).find((move) => move.castle && moveUci(move).startsWith('e1g1'))
    expect(eraMoveSentence(ordinary, castle!, null)).toContain('Ordinary castling')

    const italian = resolveRules(eraById('castling'), 'italy1700')
    const free = legalMoves(parseFen(CASTLES), italian).find((move) => move.castle && moveUci(move).includes('h1'))
    expect(eraMoveSentence(italian, free!, null)).toContain('Italian free castling')

    const shatranj = resolveRules(eraById('shatranj'))
    const bareMove = legalMoves(parseFen(BARE), shatranj).find((move) => moveUci(move) === 'a2a7')!
    const result = outcome(makeMove(parseFen(BARE), shatranj, bareMove), shatranj)
    expect(eraMoveSentence(shatranj, bareMove, result)).toBe('Bare king. White wins.')

    const hunted = createSession({ eraId: 'shatranj', mode: 'engine', human: 'b', fen: BARE, now: 1, seed: 1 })
    const byEngine = commitMove(hunted, bareMove, 1)
    expect(byEngine.history[0].note).toBe('Bare king. White wins.')

    const taken = createSession({ eraId: 'shatranj', mode: 'engine', human: 'w', fen: BARE, now: 1, seed: 1 })
    const byHuman = commitMove(taken, bareMove, 1)
    expect(byHuman.history[0].note).toBeNull()
  })
})
