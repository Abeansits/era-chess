import { useState } from 'react'
import { legendFor } from '../engine/notation'
import type { HistoryEntry } from '../game/session'
import type { Rules } from '../engine/types'

export function Scoresheet({ history, rules }: { history: HistoryEntry[]; rules: Rules }) {
  const [secondary, setSecondary] = useState(false)
  const rows: { n: number; w?: string; b?: string }[] = []
  for (const entry of history) {
    const text = secondary ? entry.secondary : entry.primary
    if (entry.turn === 'w') rows.push({ n: rows.length + 1, w: text })
    else if (rows.length === 0) rows.push({ n: 1, b: text })
    else rows[rows.length - 1].b = text
  }
  const other = rules.notation === 'algebraic' ? 'Descriptive sheet' : 'Algebraic sheet'
  return (
    <section className="sheet" data-testid="scoresheet">
      <header>
        <h3>{secondary ? other : rules.notation === 'algebraic' ? 'Algebraic' : 'Scoresheet'}</h3>
        <button type="button" onClick={() => setSecondary((value) => !value)}>
          {secondary ? 'Back to the era’s sheet' : other}
        </button>
      </header>
      {rows.length === 0 ? (
        <p className="sheet-empty">No moves yet. The sheet will follow this stop, not a modern default.</p>
      ) : (
        <ol>
          {rows.map((row) => (
            <li key={row.n}>
              <span>{row.n}</span>
              <span>{row.w ?? ''}</span>
              <span>{row.b ?? ''}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="legend">{legendFor(rules.notation, secondary)}</p>
    </section>
  )
}
