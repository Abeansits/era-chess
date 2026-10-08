import { inCheck } from './attacks'
import { isCapture, positionKey } from './position'
import { legalMoves, makeMove } from './moves'
import { outcome } from './outcome'
import { fileOf, kindOf, rankOf, type PieceKind } from './squares'
import type { Move, Position, Rules } from './types'

const VALUE: Record<PieceKind, number> = {
  p: 100,
  n: 325,
  b: 335,
  r: 500,
  q: 900,
  f: 165,
  a: 145,
  k: 0,
}

const MATE = 100_000

export type SearchOptions = {
  budgetMs?: number
  maxDepth?: number
  seed?: number
  hashes?: string[]
  /** Centipawn window among root moves. 0 plays the single best. */
  jitter?: number
}

class SearchTimeout extends Error {}

type Flag = 'exact' | 'lower' | 'upper'
type TTEntry = { depth: number; score: number; flag: Flag; from: number; to: number }

function evaluate(pos: Position, rules: Rules): number {
  let score = 0
  let white = 0
  let black = 0
  for (let sq = 0; sq < 64; sq++) {
    const code = pos.board[sq]
    if (!code) continue
    const kind = kindOf(code)
    if (!kind) continue
    const whitePiece = code <= 8
    if (whitePiece) white += 1
    else black += 1
    let value = VALUE[kind]
    const rank = rankOf(sq)
    const file = fileOf(sq)
    const forward = whitePiece ? rank : 7 - rank
    if (kind === 'p') value += forward * 6
    if (kind === 'n' || kind === 'b') {
      const center = 4 - Math.abs(file - 3.5) - Math.abs(rank - 3.5)
      value += center * 6
    }
    // Ferz and alfil are short. A little center is enough; they are not a queen or a bishop.
    if (kind === 'f' || kind === 'a') {
      const center = 4 - Math.abs(file - 3.5) - Math.abs(rank - 3.5)
      value += center * (kind === 'f' ? 2 : 1)
    }
    score += whitePiece ? value : -value
  }
  const crowded = white + black >= 24
  score += kingPlace(pos, rules, 'w', crowded)
  score -= kingPlace(pos, rules, 'b', crowded)
  if (rules.bareKing) {
    if (black <= 3 && white >= 2) score += (4 - black) * 90
    if (white <= 3 && black >= 2) score -= (4 - white) * 90
  }
  return pos.turn === 'w' ? score : -score
}

function kingPlace(pos: Position, rules: Rules, color: 'w' | 'b', crowded: boolean): number {
  const kingSq = pos.board.indexOf(color === 'w' ? 6 : 14)
  if (kingSq < 0) return 0
  const rank = rankOf(kingSq)
  const file = fileOf(kingSq)
  const home = color === 'w' ? 0 : 7
  const rights = color === 'w' ? pos.castle.wk || pos.castle.wq : pos.castle.bk || pos.castle.bq
  let value = 0
  if (rank !== home && (crowded || rights)) value -= crowded ? 120 : 36
  if (rules.castling !== 'none' && rank === home && (file === 2 || file === 6)) value += 80
  if (rights && rank === home) value += 22
  return value
}

function victimValue(pos: Position, move: Move): number {
  if (move.enPassant) return VALUE.p
  const kind = kindOf(pos.board[move.to])
  return kind ? VALUE[kind] : 0
}

function attackerValue(pos: Position, move: Move): number {
  const kind = kindOf(pos.board[move.from])
  return kind ? VALUE[kind] : 0
}

function terminal(pos: Position, rules: Rules, repeats: number, ply: number): number | null {
  const end = outcome(pos, rules, repeats)
  if (!end) return null
  if (!end.winner) return 0
  const sign = end.winner === pos.turn ? 1 : -1
  return sign * (MATE - ply)
}

function sameMove(move: Move, from: number, to: number): boolean {
  return move.from === from && move.to === to
}

function orderMoves(
  pos: Position,
  moves: Move[],
  ply: number,
  hashFrom: number,
  hashTo: number,
  killers: Int32Array,
  history: Int32Array,
): Move[] {
  return moves
    .map((move) => {
      let score = history[move.from * 64 + move.to]
      if (hashFrom >= 0 && sameMove(move, hashFrom, hashTo)) score += 1_000_000
      else if (isCapture(pos, move) || move.promotion) {
        score += 100_000 + victimValue(pos, move) * 8 - attackerValue(pos, move) / 10
        if (move.promotion) score += 400 + VALUE[move.promotion]
      } else if (killers[ply * 2] === move.from * 64 + move.to || killers[ply * 2 + 1] === move.from * 64 + move.to) {
        score += 40_000
      }
      if (move.castle) score += 180
      if (move.enPassant) score += 80
      return { move, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.move)
}

function negamax(
  pos: Position,
  rules: Rules,
  depth: number,
  ply: number,
  alpha: number,
  beta: number,
  seen: Map<string, number>,
  deadline: number,
  tt: Map<string, TTEntry>,
  killers: Int32Array,
  history: Int32Array,
  qply = 0,
): number {
  if (Date.now() > deadline) throw new SearchTimeout()
  const key = positionKey(pos)
  const repeats = seen.get(key) ?? 0
  const ended = terminal(pos, rules, repeats, ply)
  if (ended !== null) return ended
  if (depth <= 0) return quiesce(pos, rules, ply, alpha, beta, seen, deadline, qply)

  const cached = tt.get(key)
  let hashFrom = -1
  let hashTo = -1
  if (cached) {
    hashFrom = cached.from
    hashTo = cached.to
    if (cached.depth >= depth && Math.abs(cached.score) < MATE - 400) {
      if (cached.flag === 'exact') return cached.score
      if (cached.flag === 'lower' && cached.score >= beta) return cached.score
      if (cached.flag === 'upper' && cached.score <= alpha) return cached.score
    }
  }

  const moves = orderMoves(pos, legalMoves(pos, rules), ply, hashFrom, hashTo, killers, history)
  if (!moves.length) return 0
  const alphaStart = alpha
  let best = -MATE
  let bestFrom = moves[0].from
  let bestTo = moves[0].to
  let first = true
  for (const move of moves) {
    const next = makeMove(pos, rules, move)
    const nextKey = positionKey(next)
    seen.set(nextKey, (seen.get(nextKey) ?? 0) + 1)
    let score: number
    if (first) {
      score = -negamax(next, rules, depth - 1, ply + 1, -beta, -alpha, seen, deadline, tt, killers, history)
      first = false
    } else {
      score = -negamax(next, rules, depth - 1, ply + 1, -alpha - 1, -alpha, seen, deadline, tt, killers, history)
      if (score > alpha && score < beta) {
        score = -negamax(next, rules, depth - 1, ply + 1, -beta, -alpha, seen, deadline, tt, killers, history)
      }
    }
    seen.set(nextKey, (seen.get(nextKey) ?? 1) - 1)
    if (score > best) {
      best = score
      bestFrom = move.from
      bestTo = move.to
    }
    if (score > alpha) alpha = score
      if (alpha >= beta) {
      if (!isCapture(pos, move) && !move.promotion) {
        const packed = move.from * 64 + move.to
        const slot = Math.min(ply, 127) * 2
        if (killers[slot] !== packed) {
          killers[slot + 1] = killers[slot]
          killers[slot] = packed
        }
        history[packed] += depth * depth
      }
      break
    }
  }
  const flag: Flag = best <= alphaStart ? 'upper' : best >= beta ? 'lower' : 'exact'
  if (Math.abs(best) < MATE - 400) tt.set(key, { depth, score: best, flag, from: bestFrom, to: bestTo })
  return best
}

function quiesce(
  pos: Position,
  rules: Rules,
  ply: number,
  alpha: number,
  beta: number,
  seen: Map<string, number>,
  deadline: number,
  qply: number,
): number {
  const repeats = seen.get(positionKey(pos)) ?? 0
  const ended = terminal(pos, rules, repeats, ply)
  if (ended !== null) return ended
  const stand = evaluate(pos, rules)
  const checked = inCheck(pos, pos.turn)
  if (!checked) {
    if (stand >= beta) return beta
    if (stand > alpha) alpha = stand
  }
  if (qply >= 4) return checked ? alpha : Math.max(stand, alpha)
  const moves = legalMoves(pos, rules)
    .filter((move) => checked || isCapture(pos, move) || move.promotion)
    .sort((a, b) => victimValue(pos, b) - victimValue(pos, a))
  for (const move of moves) {
    if (Date.now() > deadline) throw new SearchTimeout()
    const next = makeMove(pos, rules, move)
    const nextKey = positionKey(next)
    seen.set(nextKey, (seen.get(nextKey) ?? 0) + 1)
    const score = -quiesce(next, rules, ply + 1, -beta, -alpha, seen, deadline, qply + 1)
    seen.set(nextKey, (seen.get(nextKey) ?? 1) - 1)
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

/** One seed per game, mixed with the ply. Not a function of the ply alone. */
export function engineSeed(seed: number, ply: number): number {
  const mixed = Math.imul((seed || 1) ^ (ply + 1), 0x45d9f3b)
  return (mixed >>> 0) || 1
}

function rng(seed: number): () => number {
  let state = seed || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0
    return (state >>> 0) / 4294967296
  }
}

export function pickMove(pos: Position, rules: Rules, options: SearchOptions = {}): Move | null {
  const generated = legalMoves(pos, rules)
  if (!generated.length) return null
  if (generated.length === 1) return generated[0]
  const maxDepth = options.maxDepth ?? 4
  const budget = options.budgetMs ?? 500
  const started = Date.now()
  const deadline = started + budget
  const seen = new Map<string, number>()
  for (const hash of options.hashes ?? [positionKey(pos)]) {
    seen.set(hash, (seen.get(hash) ?? 0) + 1)
  }
  if (!seen.has(positionKey(pos))) seen.set(positionKey(pos), 1)

  const tt = new Map<string, TTEntry>()
  const killers = new Int32Array(128 * 2)
  const history = new Int32Array(64 * 64)
  let moves = orderMoves(pos, generated, 0, -1, -1, killers, history)
  let best = moves[0]
  let completed: { move: Move; score: number }[] = []

  try {
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (depth > 1 && Date.now() > started + budget * 0.55) break
      let localBest = moves[0]
      let localScore = -MATE
      const ranked: { move: Move; score: number }[] = []
      for (const move of moves) {
        if (Date.now() > deadline) throw new SearchTimeout()
        const next = makeMove(pos, rules, move)
        const nextKey = positionKey(next)
        seen.set(nextKey, (seen.get(nextKey) ?? 0) + 1)
        const score = -negamax(next, rules, depth - 1, 1, -MATE, MATE, seen, deadline, tt, killers, history)
        seen.set(nextKey, (seen.get(nextKey) ?? 1) - 1)
        ranked.push({ move, score })
        if (score > localScore) {
          localScore = score
          localBest = move
        }
      }
      ranked.sort((a, b) => b.score - a.score)
      moves = ranked.map((entry) => entry.move)
      best = localBest
      completed = ranked
      if (localScore > MATE - 80) break
    }
  } catch (error) {
    if (!(error instanceof SearchTimeout)) throw error
  }

  if (!completed.length) return best
  const window = options.jitter ?? 0
  const pool = completed.filter((entry) => entry.score >= completed[0].score - window)
  if (pool.length <= 1) return best
  const random = rng(options.seed ?? 1)
  return pool[Math.floor(random() * pool.length)].move
}
