import { explainDrop } from '../engine/explain'
import { legalMoves, makeMove } from '../engine/moves'
import { notationPair } from '../engine/notation'
import { outcome } from '../engine/outcome'
import { moveUci, parseFen, positionKey, toFen } from '../engine/position'
import { fileOf, parseSq, sqName } from '../engine/squares'
import type { Move, Position, Rules } from '../engine/types'
import { resultTitle } from './describe'
import { eraMoveSentence } from './eraMove'

export type ArrowPlay =
  | { legal: true; fen: string; title: string }
  | { legal: false; reason: string }

export type LineStep = {
  from: string
  to: string
  fen: string
  title: string
  done: boolean
}

/** The era’s notation, then check, mate, or the result. Never a blank “legal”. */
export function playedTitle(pos: Position, rules: Rules, move: Move, repeats = 1): string {
  const next = makeMove(pos, rules, move)
  const end = outcome(next, rules, repeats)
  const noted = notationPair(pos, rules, move).primary
  if (end) return `${noted}. ${resultTitle(end)}`
  const sentence = eraMoveSentence(rules, move, null)
  return sentence ? `${noted}. ${sentence}` : noted
}

/** Play a strip arrow from the diagram, or quote the rule that refuses it. */
export function playArrow(rules: Rules, fen: string, from: string, to: string): ArrowPlay {
  const pos = parseFen(fen)
  const matches = legalMoves(pos, rules).filter((move) => moveUci(move).startsWith(from + to))
  const move =
    matches.find((item) => item.castle && (fileOf(item.castle.rookTo) === 5 || fileOf(item.castle.rookTo) === 3)) ??
    matches[0]
  if (!move) {
    return {
      legal: false,
      reason: explainDrop(pos, rules, parseSq(from), parseSq(to)) || 'That move is not legal in this era.',
    }
  }
  const next = makeMove(pos, rules, move)
  return { legal: true, fen: toFen(next), title: playedTitle(pos, rules, move) }
}

export type GhostRefusal = { from: string; to: string; reason: string }

/** Each illegal arrow, in order, with the refusal it would give on a tap. */
export function ghostRefusals(
  rules: Rules,
  fen: string,
  arrows: { from: string; to: string }[],
): GhostRefusal[] {
  const out: GhostRefusal[] = []
  for (const arrow of arrows) {
    const played = playArrow(rules, fen, arrow.from, arrow.to)
    if (!played.legal) out.push({ from: arrow.from, to: arrow.to, reason: played.reason })
  }
  return out
}

export function ghostLine(ghost: GhostRefusal): string {
  return `${ghost.from}–${ghost.to}. ${ghost.reason}`
}

/** After the last step, a stop that does not draw keeps its “play on” sentence beside the move. */
export function sequenceCaption(title: string, done: boolean, atEnd: boolean, badge?: string): string {
  if (atEnd && !done && badge) return `${title}. ${badge}`
  return title
}

/** Step a scripted line. Repetition uses the positions actually visited. */
export function walkLine(rules: Rules, fen: string, ucis: string[]): LineStep[] {
  let pos = parseFen(fen)
  const hashes = [positionKey(pos)]
  const steps: LineStep[] = []
  for (const uci of ucis) {
    const move = legalMoves(pos, rules).find((item) => moveUci(item) === uci)
    if (!move) break
    const next = makeMove(pos, rules, move)
    const key = positionKey(next)
    const repeats = hashes.filter((hash) => hash === key).length + 1
    hashes.push(key)
    const end = outcome(next, rules, repeats)
    steps.push({
      from: sqName(move.from),
      to: sqName(move.to),
      fen: toFen(next),
      title: playedTitle(pos, rules, move, repeats),
      done: Boolean(end),
    })
    pos = next
    if (end) break
  }
  return steps
}
