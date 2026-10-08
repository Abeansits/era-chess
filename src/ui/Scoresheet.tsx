import { useState } from 'react'
import { legendFor } from '../engine/notation'
import type { PieceKind } from '../engine/squares'
import type { HistoryEntry } from '../game/session'
import type { Rules } from '../engine/types'
import { PieceWords } from './PieceWords'

type Cell = { text: string; ply: number; note: string | null }

export function Scoresheet({
  history,
  rules,
  viewPly,
  onView,
  named,
  onHover,
  onPick,
}: {
  history: HistoryEntry[]
  rules: Rules
  viewPly: number | null
  onView: (ply: number | null) => void
  named: PieceKind | null
  onHover: (kind: PieceKind | null) => void
  onPick: (kind: PieceKind) => void
}) {
  const [secondary, setSecondary] = useState(false)
  const rows: { n: number; w?: Cell; b?: Cell }[] = []
  history.forEach((entry, ply) => {
    const text = secondary ? entry.secondary : entry.primary
    const cell = { text, ply, note: entry.note }
    if (entry.turn === 'w') rows.push({ n: rows.length + 1, w: cell })
    else if (rows.length === 0) rows.push({ n: 1, b: cell })
    else rows[rows.length - 1].b = cell
  })
  const other = rules.notation === 'algebraic' ? 'Descriptive sheet' : 'Algebraic sheet'
  const current = viewPly ?? history.length

  function step(delta: number) {
    const next = Math.min(history.length, Math.max(0, current + delta))
    onView(next >= history.length ? null : next)
  }

  return (
    <section
      className="sheet"
      data-testid="scoresheet"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          step(-1)
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          step(1)
        }
      }}
    >
      <header>
        <h3>{secondary ? other : rules.notation === 'algebraic' ? 'Algebraic' : 'Scoresheet'}</h3>
        <button type="button" onClick={() => setSecondary((value) => !value)}>
          {secondary ? 'Back to the era’s sheet' : other}
        </button>
      </header>
      {rows.length === 0 ? (
        <p className="sheet-empty">No moves yet. The sheet will follow this stop, not a modern default.</p>
      ) : (
        <>
          <div className="sheet-nav">
            <button type="button" data-testid="sheet-back" onClick={() => step(-1)} disabled={current === 0}>
              Previous
            </button>
            <button type="button" data-testid="sheet-forward" onClick={() => step(1)} disabled={viewPly === null}>
              Next
            </button>
            <button type="button" data-testid="sheet-live" onClick={() => onView(null)} disabled={viewPly === null}>
              Back to the game
            </button>
          </div>
          <ol>
            {rows.map((row) => (
              <li key={row.n}>
                <span>{row.n}</span>
                <MoveCell cell={row.w} viewPly={viewPly} onView={onView} named={named} onHover={onHover} onPick={onPick} />
                <MoveCell cell={row.b} viewPly={viewPly} onView={onView} named={named} onHover={onHover} onPick={onPick} />
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="legend">
        <PieceWords text={legendFor(rules.notation, secondary)} active={named} onHover={onHover} onPick={onPick} />
      </p>
    </section>
  )
}

function MoveCell({
  cell,
  viewPly,
  onView,
  named,
  onHover,
  onPick,
}: {
  cell?: Cell
  viewPly: number | null
  onView: (ply: number | null) => void
  named: PieceKind | null
  onHover: (kind: PieceKind | null) => void
  onPick: (kind: PieceKind) => void
}) {
  if (!cell) return <span />
  const selected = viewPly === cell.ply + 1
  return (
    <div
      role="button"
      tabIndex={0}
      className={selected ? 'sheet-move is-on' : 'sheet-move'}
      data-testid={`sheet-ply-${cell.ply}`}
      onClick={() => onView(cell.ply + 1)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onView(cell.ply + 1)
      }}
    >
      {cell.text}
      {cell.note ? (
        <span className="sheet-note">
          <PieceWords text={cell.note} active={named} onHover={onHover} onPick={onPick} />
        </span>
      ) : null}
    </div>
  )
}
