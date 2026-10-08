import { explainDrop } from '../engine/explain'
import { legalMoves, makeMove } from '../engine/moves'
import { notationPair } from '../engine/notation'
import { outcome } from '../engine/outcome'
import { parseFen, positionKey, startFen } from '../engine/position'
import { opposite, sqName, type Color, type PieceKind } from '../engine/squares'
import type { GameResult, Move, Position, Rules } from '../engine/types'
import type { Difficulty } from '../engine/levels'
import { type EraId, resolveRules, eraById } from '../rules/eras'

export type PlayMode = 'pass' | 'engine'

export type HistoryEntry = {
  move: Move
  primary: string
  secondary: string
  turn: Color
}

export type Session = {
  eraId: EraId
  chipId: string
  rules: Rules
  pos: Position
  history: HistoryEntry[]
  hashes: string[]
  result: GameResult | null
  mode: PlayMode
  human: Color
  difficulty: Difficulty
  clocks: { w: number; b: number } | null
  clockStamp: number | null
}

export type Attempt =
  | { type: 'moved'; session: Session }
  | { type: 'illegal'; reason: string }
  | { type: 'promotion'; pieces: PieceKind[] }
  | { type: 'rook'; squares: number[] }

const CLOCK_MS = 10 * 60 * 1000

export function createSession(input: {
  eraId: EraId
  chipId?: string
  mode: PlayMode
  human?: Color
  difficulty?: Difficulty
  now?: number
}): Session {
  const era = eraById(input.eraId)
  const chipId = input.chipId || era.defaultChip
  const rules = resolveRules(era, chipId)
  const pos = parseFen(startFen(rules))
  const now = input.now ?? 0
  const session: Session = {
    eraId: input.eraId,
    chipId,
    rules,
    pos,
    history: [],
    hashes: [positionKey(pos)],
    result: outcome(pos, rules, 1),
    mode: input.mode,
    human: input.human ?? 'w',
    difficulty: input.difficulty ?? 'medium',
    clocks: rules.clock ? { w: CLOCK_MS, b: CLOCK_MS } : null,
    clockStamp: rules.clock ? now : null,
  }
  return session
}

function repeatsOf(hashes: string[], key: string): number {
  let count = 0
  for (const hash of hashes) if (hash === key) count += 1
  return count
}

export function tick(session: Session, now: number): Session {
  if (!session.clocks || session.clockStamp === null || session.result) return session
  const elapsed = Math.max(0, now - session.clockStamp)
  const turn = session.pos.turn
  const left = session.clocks[turn] - elapsed
  if (left <= 0) {
    return {
      ...session,
      clocks: { ...session.clocks, [turn]: 0 },
      clockStamp: null,
      result: { winner: opposite(turn), reason: 'time' },
    }
  }
  return {
    ...session,
    clocks: { ...session.clocks, [turn]: left },
    clockStamp: now,
  }
}

export function attemptDrop(
  session: Session,
  from: number,
  to: number,
  choice?: { promotion?: PieceKind; rookTo?: number },
  now = 0,
): Attempt {
  if (session.result) return { type: 'illegal', reason: 'The game is already over.' }
  const live = session.clocks ? tick(session, now) : session
  if (live.result) return { type: 'illegal', reason: 'The clock has run out.' }

  const candidates = legalMoves(live.pos, live.rules).filter((move) => move.from === from && move.to === to)
  if (!candidates.length) {
    return { type: 'illegal', reason: explainDrop(live.pos, live.rules, from, to) }
  }

  const promotions = [...new Set(candidates.map((move) => move.promotion).filter(Boolean))] as PieceKind[]
  if (promotions.length > 1 && !choice?.promotion) return { type: 'promotion', pieces: promotions }

  const rookSquares = [
    ...new Set(
      candidates.filter((move) => move.castle).map((move) => move.castle?.rookTo),
    ),
  ].filter((sq): sq is number => sq !== undefined)
  if (rookSquares.length > 1 && choice?.rookTo === undefined) return { type: 'rook', squares: rookSquares }

  const move =
    candidates.find((item) => {
      if (choice?.promotion && item.promotion !== choice.promotion) return false
      if (choice?.rookTo !== undefined && item.castle?.rookTo !== choice.rookTo) return false
      return true
    }) ?? candidates[0]

  return { type: 'moved', session: commitMove(live, move, now) }
}

export function commitMove(session: Session, move: Move, now = 0): Session {
  const noted = notationPair(session.pos, session.rules, move)
  const turn = session.pos.turn
  const next = makeMove(session.pos, session.rules, move)
  const key = positionKey(next)
  const hashes = [...session.hashes, key]
  const result = outcome(next, session.rules, repeatsOf(hashes, key))
  let clocks = session.clocks
  if (clocks && session.clockStamp !== null) {
    const spent = Math.max(0, now - session.clockStamp)
    clocks = { ...clocks, [turn]: Math.max(0, clocks[turn] - spent) }
  }
  return {
    ...session,
    pos: next,
    history: [...session.history, { move, primary: noted.primary, secondary: noted.secondary, turn }],
    hashes,
    result,
    clocks,
    clockStamp: clocks && !result ? now : null,
  }
}

/** The side the Resign button gives up. Against the engine, that is the human. */
export function resigningSide(session: Session): Color {
  return session.mode === 'engine' ? session.human : session.pos.turn
}

export function resign(session: Session, color: Color): Session {
  if (session.result) return session
  return {
    ...session,
    result: { winner: opposite(color), reason: 'resign' },
    clockStamp: null,
  }
}

export function agreeDraw(session: Session): Session {
  if (session.result) return session
  return { ...session, result: { winner: null, reason: 'agreement' }, clockStamp: null }
}

export function squareLabel(sq: number): string {
  return sqName(sq)
}
