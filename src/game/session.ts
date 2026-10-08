import { explainDrop } from '../engine/explain'
import { legalMoves, makeMove } from '../engine/moves'
import { notationPair } from '../engine/notation'
import { outcome } from '../engine/outcome'
import { moveUci, parseFen, positionKey, startFen, toFen, tryParseFen } from '../engine/position'
import { opposite, sqName, type Color, type PieceKind } from '../engine/squares'
import type { GameResult, Move, Position, Rules } from '../engine/types'
import type { Difficulty } from '../engine/levels'
import { eraMoveSentence } from '../rules/eraMove'
import { eras, type EraId, resolveRules, eraById } from '../rules/eras'
import { gameSearch, readGameLink, type GameLink } from '../ui/query'

export type PlayMode = 'pass' | 'engine'

export type HistoryEntry = {
  move: Move
  primary: string
  secondary: string
  turn: Color
  /** Set when the engine plays a move this stop is about. */
  note: string | null
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
  /** Position the game started from. Rematch and the share link return here. */
  startFen: string
  /** Chosen once per game. The search mixes it with the ply. */
  seed: number
  /** Pass and play keeps White at the bottom instead of turning every ply. */
  boardStill: boolean
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
  fen?: string
  seed?: number
  boardStill?: boolean
}): Session {
  const era = eraById(input.eraId)
  const chipId = input.chipId || era.defaultChip
  const rules = resolveRules(era, chipId)
  const opening = input.fen ?? startFen(rules)
  const pos = parseFen(opening)
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
    startFen: toFen(pos),
    seed: input.seed ?? (now || 1),
    boardStill: input.boardStill ?? false,
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
  const sentence = eraMoveSentence(session.rules, move, result)
  const note = session.mode === 'engine' && turn !== session.human ? sentence : null
  let clocks = session.clocks
  if (clocks && session.clockStamp !== null) {
    const spent = Math.max(0, now - session.clockStamp)
    clocks = { ...clocks, [turn]: Math.max(0, clocks[turn] - spent) }
  }
  return {
    ...session,
    pos: next,
    history: [...session.history, { move, primary: noted.primary, secondary: noted.secondary, turn, note }],
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

/** The position after `ply` moves. Zero is the start of this game. */
export function positionAt(session: Session, ply: number): Position {
  let pos = parseFen(session.startFen)
  const end = Math.max(0, Math.min(ply, session.history.length))
  for (let i = 0; i < end; i++) pos = makeMove(pos, session.rules, session.history[i].move)
  return pos
}

/** Freeze the live clock. Studying a ply does not spend the side to move. */
export function pauseClock(session: Session, now: number): Session {
  if (!session.clocks || session.result || session.clockStamp === null) return session
  const frozen = tick(session, now)
  if (frozen.result) return frozen
  return { ...frozen, clockStamp: null }
}

/** Start the clock again from the time that was left when the sheet was opened. */
export function resumeClock(session: Session, now: number): Session {
  if (!session.clocks || session.result || session.clockStamp !== null) return session
  return { ...session, clockStamp: now }
}

export function replayUci(session: Session, ucis: string[], now = 0): Session {
  let current = session
  for (const uci of ucis) {
    const move = legalMoves(current.pos, current.rules).find((item) => moveUci(item) === uci)
    if (!move) break
    current = commitMove(current, move, now)
  }
  return current
}

function looksLikeMove(token: string): boolean {
  return /^[a-h][1-8][a-h][1-8][a-z]?([a-h][1-8]){0,2}$/.test(token)
}

/**
 * Open a share link, or stay on the museum and say what could not be used.
 * A bad position, a move this stop refuses, and an unknown chip do not open a quieter game.
 */
export function openSharedLink(search: string, now = 0): { session: Session | null; notice: string | null } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const stop = params.get('stop')
  const era = eras.find((item) => item.id === stop)
  if (!era) return { session: null, notice: null }

  const chipParam = params.get('chip')
  const chipKnown = !chipParam || era.chips.some((item) => item.id === chipParam)
  const fenParam = params.get('fen')
  const movesParam = params.get('moves')
  const modeParam = params.get('mode')
  const isGame = modeParam === 'pass' || modeParam === 'engine' || Boolean(fenParam) || Boolean(movesParam)

  if (isGame && fenParam && !tryParseFen(fenParam)) {
    return { session: null, notice: 'That position could not be read.' }
  }
  if (!chipKnown) {
    const shown = era.chips.find((item) => item.id === era.defaultChip)?.label ?? era.name
    return { session: null, notice: `No chip named “${chipParam}”. Showing ${shown}.` }
  }
  if (!isGame) return { session: null, notice: null }

  const link = readGameLink(search)
  if (!link) return { session: null, notice: null }
  let current = createSession({
    eraId: link.eraId,
    chipId: link.chipId,
    mode: link.mode,
    human: link.human,
    difficulty: link.difficulty,
    fen: link.fen ?? undefined,
    now,
    seed: now || 1,
    boardStill: link.boardStill,
  })
  for (let i = 0; i < link.moves.length; i++) {
    const uci = link.moves[i]
    const move = legalMoves(current.pos, current.rules).find((item) => moveUci(item) === uci)
    if (!move) {
      const ply = i + 1
      const notice = looksLikeMove(uci)
        ? `“${uci}” is not legal on this board. That was move ${ply}. Those moves were not played.`
        : `“${uci}” is not a move. That was move ${ply}. Those moves were not played.`
      return { session: null, notice }
    }
    current = commitMove(current, move, now)
  }
  return { session: current, notice: null }
}

export function sessionFromLink(link: GameLink, now = 0): Session {
  const opened = createSession({
    eraId: link.eraId,
    chipId: link.chipId,
    mode: link.mode,
    human: link.human,
    difficulty: link.difficulty,
    fen: link.fen ?? undefined,
    now,
    seed: now || 1,
    boardStill: link.boardStill,
  })
  return replayUci(opened, link.moves, now)
}

export function shareLink(session: Session): string {
  const custom = session.startFen !== startFen(session.rules)
  return gameSearch({
    eraId: session.eraId,
    chipId: session.chipId,
    mode: session.mode,
    human: session.human,
    difficulty: session.difficulty,
    fen: custom ? session.startFen : null,
    moves: session.history.map((entry) => moveUci(entry.move)),
    boardStill: session.boardStill,
  })
}
