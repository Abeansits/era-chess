import { describe, expect, it } from 'vitest'
import { parseFen } from '../engine/position'
import { REASONS } from './reasons'
import { eraById, resolveRules } from './eras'
import { boardLines } from './describe'
import { playArrow } from './stripPlay'
import { ARRIVAL } from '../ui/arrival'

const PASSING = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'
const CASTLES = '6k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'
const FERZ = '6k1/8/8/8/8/8/4P3/3FK3 w - - 0 1'
const BARE = '8/p7/8/4k3/8/8/R7/7K w - - 0 1'

describe('playable strips', () => {
  it('plays en passant and refuses passar battaglia with that sentence', () => {
    const spain = resolveRules(eraById('passant'), 'spain')
    const italy = resolveRules(eraById('passant'), 'italy')
    const taken = playArrow(spain, PASSING, 'e5', 'd6')
    expect(taken.legal).toBe(true)
    if (!taken.legal) return
    expect(parseFen(taken.fen).board.filter(Boolean)).toHaveLength(3)
    const refused = playArrow(italy, PASSING, 'e5', 'd6')
    expect(refused).toEqual({ legal: false, reason: REASONS.passar })
  })

  it('plays ordinary castling on the fixed squares and refuses the long king move', () => {
    const ordinary = resolveRules(eraById('castling'), 'ordinary')
    const italian = resolveRules(eraById('castling'), 'italy1700')
    const castle = playArrow(ordinary, CASTLES, 'e1', 'g1')
    expect(castle.legal).toBe(true)
    if (castle.legal) expect(castle.title).toBe('Legal. The game continues.')
    expect(playArrow(ordinary, CASTLES, 'e1', 'h1')).toEqual({ legal: false, reason: REASONS.ordinaryOnly })
    const free = playArrow(italian, CASTLES, 'e1', 'h1')
    expect(free.legal).toBe(true)
  })

  it('quotes the ferz when the long slide is still illegal, and bares the king when it is the win', () => {
    const medieval = resolveRules(eraById('medieval'))
    expect(playArrow(medieval, FERZ, 'd1', 'd8')).toEqual({ legal: false, reason: REASONS.ferzSlide })
    const shatranj = resolveRules(eraById('shatranj'))
    const bare = playArrow(shatranj, BARE, 'a2', 'a7')
    expect(bare.legal).toBe(true)
    if (bare.legal) expect(bare.title).toBe('Bare king. White wins.')
  })

  it('saves the name passar battaglia for the Italy chip', () => {
    const queen = boardLines(resolveRules(eraById('queen'))).join(' ')
    expect(queen).toContain('There is no capture in passing')
    expect(queen).not.toContain('Passar')
    expect(boardLines(resolveRules(eraById('passant'), 'italy')).join(' ')).toContain('Passar battaglia')
    expect(boardLines(resolveRules(eraById('castling'), 'italy1700')).join(' ')).toContain('Passar battaglia')
  })

  it('names the queen’s arrival in one line', () => {
    expect(ARRIVAL.queen).toBe('1475: the queen wakes up.')
  })
})
