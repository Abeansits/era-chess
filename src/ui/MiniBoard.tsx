import { useRef, useState } from 'react'
import { legalMoves } from '../engine/moves'
import { outcome } from '../engine/outcome'
import { moveUci, parseFen } from '../engine/position'
import { colorOf, fileOf, kindOf, rankOf } from '../engine/squares'
import type { Rules } from '../engine/types'
import { ghostLine, ghostRefusals, playArrow, sequenceCaption, walkLine } from '../rules/stripPlay'
import { resultTitle } from '../rules/describe'
import { squareColors } from './boardColors'
import { boardFrameStyle, boardTrackStyle, useEvenSquare } from './evenBoard'
import { PieceGlyph } from './pieces'

type Arrow = { from: string; to: string }

function prefixLegal(fenRules: Rules, fen: string, from: string, to: string): boolean {
  return legalMoves(parseFen(fen), fenRules).some((move) => moveUci(move).startsWith(from + to))
}

function squareIndex(name: string): number {
  return name.charCodeAt(0) - 97 + (name.charCodeAt(1) - 49) * 8
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
  line,
}: {
  fen: string
  rules: Rules
  arrows: Arrow[]
  label: string
  sub: string
  active: boolean
  positionResult: boolean
  badge?: string
  line?: string[]
}) {
  const slotRef = useRef<HTMLDivElement>(null)
  const box = useEvenSquare(slotRef)
  const steps = line?.length ? walkLine(rules, fen, line) : null
  const [shown, setShown] = useState(fen)
  const [captionLine, setCaptionLine] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const marker = label.replace(/[^a-z0-9]+/gi, '') || 'board'
  const onSequence = Boolean(steps)
  const sequenceFen = !steps || step === 0 ? fen : steps[step - 1].fen
  const sequenceDone = Boolean(steps && step > 0 && steps[step - 1].done)
  const upcoming = steps && !sequenceDone && step < steps.length ? steps[step] : null
  const drawnArrows = onSequence ? (upcoming ? [{ from: upcoming.from, to: upcoming.to }] : []) : arrows
  const displayFen = onSequence ? sequenceFen : shown

  const pos = parseFen(displayFen)
  const colors = squareColors(rules.counselor === 'queen' ? 1 : 0)
  const diagram = parseFen(fen)
  const standing = positionResult ? outcome(diagram, rules) : null
  const sole = arrows.length === 1 ? playArrow(rules, fen, arrows[0].from, arrows[0].to) : null
  const ghosts = !onSequence && arrows.length > 1 ? ghostRefusals(rules, fen, arrows) : []
  const refusal = new Map(ghosts.map((ghost) => [`${ghost.from}${ghost.to}`, ghost.reason]))

  function tap(arrow: Arrow) {
    if (onSequence && upcoming && arrow.from === upcoming.from && arrow.to === upcoming.to) {
      setStep((current) => current + 1)
      return
    }
    const played = playArrow(rules, fen, arrow.from, arrow.to)
    if (played.legal) {
      setShown(played.fen)
      setCaptionLine(played.title)
      return
    }
    setShown(fen)
    setCaptionLine(played.reason)
  }

  const atEnd = Boolean(steps && step === steps.length)
  const caption = onSequence
    ? step > 0
      ? sequenceCaption(steps![step - 1].title, steps![step - 1].done, atEnd, badge)
      : (badge ?? 'Step the moves.')
    : (captionLine ??
      (badge
        ? badge
        : positionResult
          ? standing
            ? resultTitle(standing)
            : 'The game continues'
          : sole
            ? sole.legal
              ? sole.title
              : sole.reason
            : null))
  const ghostReadings =
    caption === null
      ? [
          ...ghosts.map((ghost) => ({ id: `${ghost.from}${ghost.to}`, text: ghostLine(ghost) })),
          ...(ghosts.length < arrows.length ? [{ id: 'lit', text: 'Tap a lit arrow to play it.' }] : []),
        ]
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
            {drawnArrows.map((arrow) => {
              const legal = onSequence || prefixLegal(rules, fen, arrow.from, arrow.to)
              const why = refusal.get(arrow.from + arrow.to)
              const from = squareIndex(arrow.from)
              const to = squareIndex(arrow.to)
              const x1 = fileOf(from) + 0.5
              const y1 = 7 - rankOf(from) + 0.5
              const x2 = fileOf(to) + 0.5
              const y2 = 7 - rankOf(to) + 0.5
              const shorten = 0.42
              const dx = x2 - x1
              const dy = y2 - y1
              const len = Math.hypot(dx, dy) || 1
              const tipX = x2 - (dx / len) * shorten
              const tipY = y2 - (dy / len) * shorten
              return (
                <g key={arrow.from + arrow.to}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={tipX}
                    y2={tipY}
                    className="arrow-hit"
                    role="button"
                    tabIndex={0}
                    aria-label={
                      legal
                        ? `Play ${arrow.from} to ${arrow.to}`
                        : why
                          ? `${arrow.from} to ${arrow.to}. ${why}`
                          : `Try ${arrow.from} to ${arrow.to}`
                    }
                    data-testid={`arrow-${marker}-${arrow.from}${arrow.to}`}
                    data-legal={legal ? 'yes' : 'no'}
                    onClick={() => tap(arrow)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        tap(arrow)
                      }
                    }}
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={tipX}
                    y2={tipY}
                    className={legal ? 'arrow-lit' : 'arrow-ghost'}
                    markerEnd={`url(#${marker}-${legal ? 'lit' : 'ghost'})`}
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <p className="mini-badge" data-testid={`strip-line-${marker}`} role="status">
        {ghostReadings && ghostReadings.length
          ? ghostReadings.map((reading) => (
              <span key={reading.id} className="ghost-reading" data-testid={`ghost-${marker}-${reading.id}`}>
                {reading.text}
              </span>
            ))
          : caption}
      </p>
      {(onSequence ? step > 0 : shown !== fen) ? (
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setShown(fen)
            setCaptionLine(null)
            setStep(0)
          }}
        >
          Back to the diagram
        </button>
      ) : null}
    </figure>
  )
}
