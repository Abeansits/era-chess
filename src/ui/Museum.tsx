import { Button } from '../components/ui/button'
import { LEVELS, type Difficulty } from '../engine/levels'
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
  difficulty,
  reduced,
  onPreview,
  onCommit,
  onChip,
  onHuman,
  onDifficulty,
  onStart,
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
}) {
  const x = Math.min(6, Math.max(0, index))
  const nearest = Math.round(x)
  const era = eras[nearest]
  const strip = stripFor(era.id as EraId, chipId)
  const leap = Math.min(1, Math.max(0, (x - 2) / 2))
  const leapOpacity = reduced
    ? nearest === 3 || nearest === 4
      ? 1
      : 0
    : x <= 1.65 || x >= 4.35
      ? 0
      : x < 2.05
        ? (x - 1.65) / 0.4
        : x > 3.95
          ? (4.35 - x) / 0.4
          : 1

  return (
    <main className="museum">
      <Filmstrip index={x} dragging={dragging} onPreview={onPreview} onCommit={onCommit} />
      <LeapMorph t={reduced ? (nearest >= 4 ? 1 : 0) : leap} opacity={leapOpacity} />
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
  if (reduced || Math.abs(x - nearest) < 0.02) {
    const era = eras[nearest]
    return (
      <RuleCard era={era} index={nearest} rules={resolveRules(era, chipId)} chip={activeChip(era, chipId)} onChip={onChip} />
    )
  }
  const left = Math.min(5, Math.floor(x))
  const frac = x - left
  const right = left + 1
  return (
    <div className="card-stack" data-blend={frac.toFixed(2)}>
      {[left, right].map((at, i) => {
        const era = eras[at]
        const opacity = i === 0 ? 1 - frac : frac
        const live = opacity >= 0.5
        return (
          <div key={era.id} className="card-layer" style={{ opacity }} aria-hidden={!live}>
            <RuleCard
              era={era}
              index={at}
              rules={resolveRules(era, chipId)}
              chip={activeChip(era, chipId)}
              onChip={live ? onChip : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
