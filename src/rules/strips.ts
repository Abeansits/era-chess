import type { Rules } from '../engine/types'
import { eraById, resolveRules, type EraId } from './eras'

export type StripPanel = {
  label: string
  sub: string
  fen: string
  rules: Rules
  badge?: string
}

export type StripModel = {
  heading: string
  note: string
  left: StripPanel
  right: StripPanel
  arrows: { from: string; to: string }[]
  /** When true, the badge is the position’s result, not the result of an arrow. */
  positionResult: boolean
  active: 'left' | 'right' | null
}

const BARE = '8/p7/8/4k3/8/8/R7/7K w - - 0 1'
const FERZ = '6k1/8/8/8/8/8/4P3/3FK3 w - - 0 1'
const QUEEN = '6k1/8/8/8/8/8/4P3/3QK3 w - - 0 1'
const PASSING = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'
const CASTLES = '6k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'
const STALE = 'k7/8/1Q6/8/8/8/8/7K b - - 0 1'

export function stripFor(eraId: EraId, chipId?: string): StripModel {
  const era = eraById(eraId)
  const current = resolveRules(era, chipId)
  if (eraId === 'shatranj') {
    return {
      heading: 'Bare the king',
      note: 'White takes the last pawn. In shatranj that is the game. Later, the same capture is only a capture.',
      left: { label: 'Shatranj', sub: 'The bare king loses', fen: BARE, rules: current },
      right: {
        label: 'Later Europe',
        sub: 'The game goes on',
        fen: BARE,
        rules: resolveRules(eraById('medieval')),
      },
      arrows: [{ from: 'a2', to: 'a7' }],
      positionResult: false,
      active: 'left',
    }
  }
  if (eraId === 'medieval') {
    return {
      heading: 'The bare king is retired',
      note: 'Same capture as the shatranj finish. The win is gone. Stalemate, on this stop, is left unsettled.',
      left: {
        label: 'Shatranj',
        sub: 'Bare king wins',
        fen: BARE,
        rules: resolveRules(eraById('shatranj')),
      },
      right: { label: 'Medieval Europe', sub: 'Play continues', fen: BARE, rules: current },
      arrows: [{ from: 'a2', to: 'a7' }],
      positionResult: false,
      active: 'right',
    }
  }
  if (eraId === 'queen') {
    return {
      heading: 'The queen arrives',
      note: 'The long slide was illegal for the ferz. The pawn’s first double step was illegal too. Both are the new game.',
      left: {
        label: 'Medieval',
        sub: 'Ferz and a single step',
        fen: FERZ,
        rules: resolveRules(eraById('medieval')),
      },
      right: { label: 'Queen’s chess', sub: 'Queen and the double step', fen: QUEEN, rules: current },
      arrows: [
        { from: 'd1', to: 'd8' },
        { from: 'e2', to: 'e4' },
      ],
      positionResult: false,
      active: 'right',
    }
  }
  if (eraId === 'passant') {
    const spain = resolveRules(era, 'spain')
    const italy = resolveRules(era, 'italy')
    return {
      heading: 'The pawn that slipped past',
      note: 'Black has just played d7–d5. Spain and England take it. Italy and Germany call that passar battaglia and will not.',
      left: { label: 'Spain & England', sub: 'Capture in passing', fen: PASSING, rules: spain },
      right: { label: 'Italy & Germany', sub: 'Passar battaglia', fen: PASSING, rules: italy },
      arrows: [{ from: 'e5', to: 'd6' }],
      positionResult: false,
      active: (chipId || 'spain') === 'italy' ? 'right' : 'left',
    }
  }
  if (eraId === 'castling') {
    const ordinary = resolveRules(era, 'ordinary')
    const italian = resolveRules(era, 'italy1700')
    return {
      heading: 'Where the king and the rook may land',
      note: 'Ordinary castling has two squares. Italian free castling lets the king travel at least that far, up to the rook, and the rook finishes on the far side. The Italian chip is also passar battaglia.',
      left: { label: 'Ordinary', sub: 'King two squares, rook beside it', fen: CASTLES, rules: ordinary },
      right: { label: 'Italy, 1700', sub: 'King and rook choose', fen: CASTLES, rules: italian },
      arrows: [
        { from: 'e1', to: 'c1' },
        { from: 'e1', to: 'g1' },
        { from: 'e1', to: 'a1' },
        { from: 'e1', to: 'b1' },
        { from: 'e1', to: 'h1' },
      ],
      positionResult: false,
      active: (chipId || 'ordinary') === 'italy1700' ? 'right' : 'left',
    }
  }
  if (eraId === 'tournament') {
    return {
      heading: 'Stalemate becomes a draw',
      note: 'Black is not in check and has no move. Before the tournament code, this board still scores that as a win.',
      left: {
        label: 'Before the code',
        sub: 'Stalemate wins',
        fen: STALE,
        rules: resolveRules(eraById('castling'), 'ordinary'),
      },
      right: { label: 'Tournament chess', sub: 'Stalemate is a draw', fen: STALE, rules: current },
      arrows: [],
      positionResult: true,
      active: 'right',
    }
  }
  return {
    heading: 'The third time, it is over',
    note: 'FIDE’s addition is not a new piece. It is the clock, touch-move, and a repetition draw that this board applies by itself.',
    left: {
      label: 'Tournament habit',
      sub: 'Repetition is not yet law',
      fen: '4k3/8/8/8/8/8/8/4K2N w - - 0 1',
      rules: resolveRules(eraById('tournament')),
      badge: 'The same position can return. Play on.',
    },
    right: {
      label: 'FIDE',
      sub: 'Three repetitions draw',
      fen: '4k3/8/8/8/8/8/8/4K2N w - - 0 1',
      rules: current,
      badge: 'The third time, the game is drawn. No claim to make.',
    },
    arrows: [],
    positionResult: false,
    active: 'right',
  }
}
