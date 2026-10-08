import { Button } from '../components/ui/button'
import type { Color } from '../engine/squares'
import { activeChip, eras, resolveRules, type EraId } from '../rules/eras'
import { stripFor } from '../rules/strips'
import { Filmstrip } from './Filmstrip'
import { LeapMorph } from './LeapMorph'
import { MiniBoard } from './MiniBoard'
import { PreviewBoard } from './PreviewBoard'
import { RuleCard } from './RuleCard'

export function Museum({
  index,
  dragging,
  chipId,
  human,
  onPreview,
  onCommit,
  onChip,
  onHuman,
  onStart,
}: {
  index: number
  dragging: boolean
  chipId: string
  human: Color
  onPreview: (index: number) => void
  onCommit: (index: number) => void
  onChip: (id: string) => void
  onHuman: (color: Color) => void
  onStart: (mode: 'pass' | 'engine') => void
}) {
  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const era = eras[nearest]
  const rules = resolveRules(era, chipId)
  const chip = activeChip(era, chipId)
  const strip = stripFor(era.id as EraId, chipId)
  const morph = Math.min(1, Math.max(0, index - 1))
  const leap = Math.min(1, Math.max(0, (index - 2) / 2))

  return (
    <main className="museum">
      <Filmstrip index={index} dragging={dragging} onPreview={onPreview} onCommit={onCommit} />
      {index >= 1.85 && index <= 4.15 ? <LeapMorph t={leap} /> : null}
      <div className="museum-grid">
        <PreviewBoard morph={morph} />
        <div className="museum-side">
          <RuleCard
            era={era}
            index={nearest}
            rules={rules}
            chip={chip}
            onChip={onChip}
          />
          <div className="start-row">
            <Button data-testid="start-pass" onClick={() => onStart('pass')}>
              Pass and play
            </Button>
            <Button data-testid="start-engine" variant="ink" onClick={() => onStart('engine')}>
              Play the engine
            </Button>
          </div>
          <div className="color-pick">
            <span>Against the engine</span>
            <button
              type="button"
              className={human === 'w' ? 'chip is-on' : 'chip'}
              onClick={() => onHuman('w')}
            >
              You play white
            </button>
            <button
              type="button"
              className={human === 'b' ? 'chip is-on' : 'chip'}
              onClick={() => onHuman('b')}
            >
              You play black
            </button>
          </div>
        </div>
      </div>
      <section className="strip" data-testid="board-strip">
        <header>
          <h2>{strip.heading}</h2>
          <p>{strip.note}</p>
        </header>
        <div className="strip-boards">
          <MiniBoard
            fen={strip.left.fen}
            rules={strip.left.rules}
            arrows={strip.arrows}
            label={strip.left.label}
            sub={strip.left.sub}
            active={strip.active === 'left'}
            positionResult={strip.positionResult}
            badge={strip.left.badge}
          />
          <MiniBoard
            fen={strip.right.fen}
            rules={strip.right.rules}
            arrows={strip.arrows}
            label={strip.right.label}
            sub={strip.right.sub}
            active={strip.active === 'right'}
            positionResult={strip.positionResult}
            badge={strip.right.badge}
          />
        </div>
      </section>
    </main>
  )
}
