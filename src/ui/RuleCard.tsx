import type { Era } from '../rules/eras'
import type { Chip } from '../rules/eras'
import { boardLines } from '../rules/describe'
import type { Rules } from '../engine/types'

export function RuleCard({
  era,
  index,
  rules,
  chip,
  onChip,
  collapsed = false,
  onExpand,
}: {
  era: Era
  index: number
  rules: Rules
  chip: Chip | null
  onChip?: (id: string) => void
  collapsed?: boolean
  onExpand?: () => void
}) {
  if (collapsed) {
    return (
      <button type="button" className="rules-fab" onClick={onExpand} aria-label="Open the rule card">
        <span>Rules</span>
      </button>
    )
  }
  return (
    <article className="rule-card" data-testid="rule-card">
      <p className="rule-index">{String(index + 1).padStart(2, '0')}</p>
      <h2>{era.name}</h2>
      <p className="rule-years">{era.years}</p>
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
      {chip ? <p className="chip-detail">{chip.detail}</p> : null}
      <h3>What changed</h3>
      <ul>
        {era.changed.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <h3>On this board</h3>
      <ul className="quiet">
        {boardLines(rules).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="why">{era.why}</p>
    </article>
  )
}
