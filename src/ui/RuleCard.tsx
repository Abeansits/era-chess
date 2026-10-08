import type { PieceKind } from '../engine/squares'
import type { Rules } from '../engine/types'
import type { Chip, Era } from '../rules/eras'
import { boardLines } from '../rules/describe'
import { pieceGuide } from '../rules/pieceNames'
import { PieceWords } from './PieceWords'
import { PieceGlyph } from './pieces'

export function RuleCard({
  era,
  index,
  rules,
  chip,
  onChip,
  collapsed = false,
  onExpand,
  named,
  onHover,
  onPick,
}: {
  era: Era
  index: number
  rules: Rules
  chip: Chip | null
  onChip?: (id: string) => void
  collapsed?: boolean
  onExpand?: () => void
  named: PieceKind | null
  onHover: (kind: PieceKind | null) => void
  onPick: (kind: PieceKind) => void
}) {
  if (collapsed) {
    return (
      <button type="button" className="rules-fab" onClick={onExpand} aria-label="Open the rule card">
        <span>Rules</span>
      </button>
    )
  }
  const guide = pieceGuide(rules)
  return (
    <article className="rule-card" data-testid="rule-card">
      <p className="rule-index">{String(index + 1).padStart(2, '0')}</p>
      <h2>{era.name}</h2>
      <p className="rule-years">{era.years}</p>
      <ul className="piece-legend" data-testid="piece-legend">
        {guide.map((item) => (
          <li key={item.kind}>
            <button
              type="button"
              className={named === item.kind ? 'piece-chip is-on' : 'piece-chip'}
              data-piece={item.kind}
              aria-pressed={named === item.kind}
              onPointerEnter={() => onHover(item.kind)}
              onPointerLeave={() => onHover(null)}
              onClick={(event) => {
                event.preventDefault()
                onPick(item.kind)
              }}
            >
              <PieceGlyph kind={item.kind} color="w" />
              <span>{item.period}</span>
            </button>
          </li>
        ))}
      </ul>
      {era.chips.length > 0 && onChip ? (
        <div className="chips" role="group" aria-label="Regional rules">
          {era.chips.map((item) => (
            <button
              key={item.id}
              type="button"
              className={chip?.id === item.id ? 'chip is-on' : 'chip'}
              onClick={() => onChip(item.id)}
              data-testid={`chip-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {chip ? (
        <p className="chip-detail">
          <PieceWords text={chip.detail} active={named} onHover={onHover} onPick={onPick} />
        </p>
      ) : null}
      <h3>What changed</h3>
      <ul>
        {era.changed.map((line) => (
          <li key={line}>
            <PieceWords text={line} active={named} onHover={onHover} onPick={onPick} />
          </li>
        ))}
      </ul>
      <h3>On this board</h3>
      <ul className="quiet">
        {boardLines(rules).map((line) => (
          <li key={line}>
            <PieceWords text={line} active={named} onHover={onHover} onPick={onPick} />
          </li>
        ))}
      </ul>
      <p className="why">
        <PieceWords text={era.why} active={named} onHover={onHover} onPick={onPick} />
      </p>
    </article>
  )
}
