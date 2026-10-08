import { useRef } from 'react'
import { legalMoves, makeMove } from '../engine/moves'
import { outcome } from '../engine/outcome'
import { moveUci, parseFen } from '../engine/position'
import { colorOf, fileOf, kindOf, rankOf } from '../engine/squares'
import type { Rules } from '../engine/types'
import { resultTitle } from '../rules/describe'
import { squareColors } from './boardColors'
import { boardFrameStyle, boardTrackStyle, useEvenSquare } from './evenBoard'
import { PieceGlyph } from './pieces'

type Arrow = { from: string; to: string }

function prefixLegal(fenRules: Rules, fen: string, from: string, to: string): boolean {
  return legalMoves(parseFen(fen), fenRules).some((move) => moveUci(move).startsWith(from + to))
}

export function MiniBoard({
  fen,
  rules,
  arrows,
  label,
  sub,
  active,
  positionResult,
  badge,
}: {
  fen: string
  rules: Rules
  arrows: Arrow[]
  label: string
  sub: string
  active: boolean
  positionResult: boolean
  badge?: string
}) {
  const slotRef = useRef<HTMLDivElement>(null)
  const box = useEvenSquare(slotRef)
  const pos = parseFen(fen)
  const colors = squareColors(rules.counselor === 'queen' ? 1 : 0)
  const marker = label.replace(/[^a-z0-9]+/gi, '') || 'board'
  const played = positionResult
    ? outcome(pos, rules)
    : arrows.length === 1 && prefixLegal(rules, fen, arrows[0].from, arrows[0].to)
      ? outcome(
          makeMove(
            pos,
            rules,
            legalMoves(pos, rules).find((move) => moveUci(move).startsWith(arrows[0].from + arrows[0].to))!,
          ),
          rules,
        )
      : null

  return (
    <figure className={active ? 'mini is-active' : 'mini'}>
      <figcaption>
        <strong>{label}</strong>
        <span>{sub}</span>
      </figcaption>
      <div className="board-slot" ref={slotRef}>
      <div
        className="mini-board"
        style={{ background: colors.dark, ...boardFrameStyle(box), ...boardTrackStyle(box) }}
      >
        {Array.from({ length: 64 }, (_, i) => {
          const file = i % 8
          const rank = 7 - Math.floor(i / 8)
          const sq = rank * 8 + file
          const light = (file + rank) % 2 === 1
          const code = pos.board[sq]
          return (
            <div key={sq} className="mini-sq" style={{ background: light ? colors.light : colors.dark }}>
              {code ? <PieceGlyph kind={kindOf(code)!} color={colorOf(code)!} /> : null}
            </div>
          )
        })}
        <svg className="arrow-layer" viewBox="0 0 8 8">
          <defs>
            <marker
              id={`${marker}-lit`}
              markerUnits="userSpaceOnUse"
              markerWidth="0.55"
              markerHeight="0.4"
              refX="0.4"
              refY="0.2"
              orient="auto"
            >
              <path d="M0 0 L0.5 0.2 L0 0.4 Z" fill="#f2c14e" />
            </marker>
            <marker
              id={`${marker}-ghost`}
              markerUnits="userSpaceOnUse"
              markerWidth="0.55"
              markerHeight="0.4"
              refX="0.4"
              refY="0.2"
              orient="auto"
            >
              <path d="M0 0 L0.5 0.2 L0 0.4 Z" fill="#f0d0cc" />
            </marker>
          </defs>
          {arrows.map((arrow) => {
            const legal = prefixLegal(rules, fen, arrow.from, arrow.to)
            const from = arrow.from.charCodeAt(0) - 97 + (arrow.from.charCodeAt(1) - 49) * 8
            const to = arrow.to.charCodeAt(0) - 97 + (arrow.to.charCodeAt(1) - 49) * 8
            const x1 = fileOf(from) + 0.5
            const y1 = 7 - rankOf(from) + 0.5
            const x2 = fileOf(to) + 0.5
            const y2 = 7 - rankOf(to) + 0.5
            return (
              <line
                key={arrow.from + arrow.to}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={legal ? 'arrow-lit' : 'arrow-ghost'}
                markerEnd={`url(#${marker}-${legal ? 'lit' : 'ghost'})`}
              />
            )
          })}
        </svg>
      </div>
      </div>
      <p className="mini-badge">
        {badge
          ? badge
          : positionResult
          ? played
            ? resultTitle(played)
            : 'The game continues'
          : arrows.length === 1
            ? played
              ? resultTitle(played)
              : prefixLegal(rules, fen, arrows[0].from, arrows[0].to)
                ? 'Legal. The game continues.'
                : 'Illegal under this rule'
            : 'Lit where the move is legal. Ghosted where it is not.'}
      </p>
    </figure>
  )
}
