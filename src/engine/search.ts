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
}

class SearchTimeout extends Error {}

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
    if (kind === 'p') value += forward * 8
    if (kind === 'n' || kind === 'b' || kind === 'f' || kind === 'a') {
      const center = 4 - Math.abs(file - 3.5) - Math.abs(rank - 3.5)
      value += center * 8
    }
    if (kind === 'k' && rules.counselor === 'queen') {
      const home = whitePiece ? rank <= 1 : rank >= 6
      if (home) value += 12
    }
    score += whitePiece ? value : -value
  }
  if (rules.bareKing) {
    if (black === 2) score += 50
    if (white === 2) score -= 50
  }
  return pos.turn === 'w' ? score : -score
}

function moveScore(pos: Position, move: Move): number {
  let score = 0
  if (move.promotion) score += 800 + VALUE[move.promotion]
  if (isCapture(pos, move)) {
    const victim = move.enPassant ? 'p' : kindOf(pos.board[move.to])
    const attacker = kindOf(pos.board[move.from])
    score += 400 + (victim ? VALUE[victim] : 0) - (attacker ? VALUE[attacker] / 10 : 0)
  }
  if (move.castle) score += 30
  return score
}

function terminal(pos: Position, rules: Rules, repeats: number, ply: number): number | null {
  const end = outcome(pos, rules, repeats)
  if (!end) return null
  if (!end.winner) return 0
  const sign = end.winner === pos.turn ? 1 : -1
  return sign * (MATE - ply)
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
  qply = 0,
): number {
  if (depth > 0 && ply > 0 && Date.now() > deadline) throw new SearchTimeout()
  const key = positionKey(pos)
  const repeats = seen.get(key) ?? 0
  const ended = terminal(pos, rules, repeats, ply)
  if (ended !== null) return ended
  if (depth <= 0) return quiesce(pos, rules, ply, alpha, beta, seen, deadline, qply)

  const moves = legalMoves(pos, rules).sort((a, b) => moveScore(pos, b) - moveScore(pos, a))
  let best = -MATE
  for (const move of moves) {
    const next = makeMove(pos, rules, move)
    const nextKey = positionKey(next)
    seen.set(nextKey, (seen.get(nextKey) ?? 0) + 1)
    const score = -negamax(next, rules, depth - 1, ply + 1, -beta, -alpha, seen, deadline)
    seen.set(nextKey, (seen.get(nextKey) ?? 1) - 1)
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
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
  if (qply >= 2) return checked ? alpha : Math.max(stand, alpha)
  const moves = legalMoves(pos, rules)
    .filter((move) => checked || isCapture(pos, move) || move.promotion)
    .sort((a, b) => moveScore(pos, b) - moveScore(pos, a))
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

function rng(seed: number): () => number {
  let state = seed || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0
    return (state >>> 0) / 4294967296
  }
}

export function pickMove(pos: Position, rules: Rules, options: SearchOptions = {}): Move | null {
  const moves = legalMoves(pos, rules).sort((a, b) => moveScore(pos, b) - moveScore(pos, a))
  if (!moves.length) return null
  if (moves.length === 1) return moves[0]
  const maxDepth = options.maxDepth ?? 3
  const deadline = Date.now() + (options.budgetMs ?? 700)
  const seen = new Map<string, number>()
  for (const hash of options.hashes ?? [positionKey(pos)]) {
    seen.set(hash, (seen.get(hash) ?? 0) + 1)
  }
  if (!seen.has(positionKey(pos))) seen.set(positionKey(pos), 1)

  let best = moves[0]
  let completed: { move: Move; score: number }[] = []
  try {
    for (let depth = 1; depth <= maxDepth; depth++) {
      let localBest = moves[0]
      let localScore = -MATE
      const ranked: { move: Move; score: number }[] = []
      for (const move of moves) {
        const next = makeMove(pos, rules, move)
        const nextKey = positionKey(next)
        seen.set(nextKey, (seen.get(nextKey) ?? 0) + 1)
        const score = -negamax(next, rules, depth - 1, 1, -MATE, MATE, seen, deadline)
        seen.set(nextKey, (seen.get(nextKey) ?? 1) - 1)
        ranked.push({ move, score })
        if (score > localScore) {
          localScore = score
          localBest = move
        }
      }
      ranked.sort((a, b) => b.score - a.score)
      moves.sort((a, b) => moveScore(pos, b) - moveScore(pos, a))
      const top = ranked[0]?.move
      if (top) {
        const index = moves.indexOf(top)
        if (index > 0) {
          moves.splice(index, 1)
          moves.unshift(top)
        }
      }
      best = localBest
      completed = ranked
      if (localScore > MATE - 50) break
    }
  } catch (error) {
    if (!(error instanceof SearchTimeout)) throw error
  }

  const pool = completed.filter((entry) => entry.score >= completed[0].score - 15)
  if (pool.length <= 1) return best
  const random = rng(options.seed ?? 1)
  return pool[Math.floor(random() * pool.length)].move
}
