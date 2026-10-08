import { explainDrop } from '../engine/explain'
import { legalMoves, makeMove } from '../engine/moves'
import { outcome } from '../engine/outcome'
import { moveUci, parseFen, toFen } from '../engine/position'
import { fileOf, parseSq } from '../engine/squares'
import type { Rules } from '../engine/types'
import { resultTitle } from './describe'

export type ArrowPlay =
  | { legal: true; fen: string; title: string }
  | { legal: false; reason: string }

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
  const end = outcome(next, rules)
  return {
    legal: true,
    fen: toFen(next),
    title: end ? resultTitle(end) : 'Legal. The game continues.',
  }
}
