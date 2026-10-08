import { Button } from '../components/ui/button'
import { LEVELS, type Difficulty } from '../engine/levels'
import type { Color } from '../engine/squares'
import { activeChip, eras, resolveRules, type EraId } from '../rules/eras'
import { stripFor } from '../rules/strips'
import { blendSlot } from './blend'
import { Filmstrip } from './Filmstrip'
import { leapOpacity } from './leap'
import { LeapMorph } from './LeapMorph'
import { MiniBoard } from './MiniBoard'
import { PreviewBoard } from './PreviewBoard'
import { RuleCard } from './RuleCard'

export function Museum({
  index,
  dragging,
  chipId,
  human,
  difficulty,
  reduced,
  onPreview,
  onCommit,
  onChip,
  onHuman,
  onDifficulty,
  onStart,
  unknownStop,
}: {
  index: number
  dragging: boolean
  chipId: string
  human: Color
  difficulty: Difficulty
  reduced: boolean
  onPreview: (index: number) => void
  onCommit: (index: number) => void
  onChip: (id: string) => void
  onHuman: (color: Color) => void
  onDifficulty: (level: Difficulty) => void
  onStart: (mode: 'pass' | 'engine') => void
  unknownStop: string | null
}) {
  const x = Math.min(6, Math.max(0, index))
  const nearest = Math.round(x)
  const era = eras[nearest]
  const strip = stripFor(era.id as EraId, chipId)
  const leap = Math.min(1, Math.max(0, (x - 2) / 2))
  const leapShown = leapOpacity(x, reduced)

  return (
    <main className="museum">
      {unknownStop ? (
        <p className="unknown-stop" data-testid="unknown-stop" role="status">
          No stop named “{unknownStop}”. Showing Shatranj.
        </p>
      ) : null}
      <Filmstrip index={x} dragging={dragging} onPreview={onPreview} onCommit={onCommit} />
      <LeapMorph t={leap} opacity={leapShown} />
      <div className="museum-grid">
        <PreviewBoard index={x} reduced={reduced} />
        <div className="museum-side">
          <FadingCard index={x} chipId={chipId} reduced={reduced} onChip={onChip} />
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
            <button type="button" className={human === 'w' ? 'chip is-on' : 'chip'} onClick={() => onHuman('w')}>
              You play white
            </button>
            <button type="button" className={human === 'b' ? 'chip is-on' : 'chip'} onClick={() => onHuman('b')}>
              You play black
            </button>
          </div>
          <div className="color-pick" data-testid="difficulty" role="group" aria-label="Engine difficulty">
            <span>Difficulty</span>
            {LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                className={difficulty === level.id ? 'chip is-on' : 'chip'}
                data-testid={`level-${level.id}`}
                aria-pressed={difficulty === level.id}
                onClick={() => onDifficulty(level.id)}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p className="level-detail">{LEVELS.find((level) => level.id === difficulty)?.detail}</p>
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

function FadingCard({
  index,
  chipId,
  reduced,
  onChip,
}: {
  index: number
  chipId: string
  reduced: boolean
  onChip: (id: string) => void
}) {
  const x = Math.min(6, Math.max(0, index))
  const nearest = Math.round(x)
  const slot = reduced ? { at: nearest, opacity: 1, entering: false } : blendSlot(x)
  const era = eras[slot.at]
  const shift = (slot.entering ? 1 - slot.opacity : slot.opacity - 1) * 10
  return (
    <div className="card-stage" data-blend-at={slot.at} data-blend-opacity={slot.opacity.toFixed(2)}>
      <div
        className="card-layer"
        style={{ opacity: slot.opacity, transform: `translateY(${shift}px)` }}
        aria-hidden={slot.opacity < 0.5}
      >
        <RuleCard
          era={era}
          index={slot.at}
          rules={resolveRules(era, chipId)}
          chip={activeChip(era, chipId)}
          onChip={slot.opacity >= 0.5 ? onChip : undefined}
        />
      </div>
    </div>
  )
}
