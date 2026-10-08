import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { LEVELS, type Difficulty } from '../engine/levels'
import { parseFen } from '../engine/position'
import type { Color, PieceKind } from '../engine/squares'
import { activeChip, eras, resolveRules, type EraId } from '../rules/eras'
import { stripFor } from '../rules/strips'
import { arrivalCue } from './arrival'
import { blendSlot } from './blend'
import { Filmstrip } from './Filmstrip'
import { leapOpacity } from './leap'
import { LeapMorph } from './LeapMorph'
import { MiniBoard } from './MiniBoard'
import { PieceWords } from './PieceWords'
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
  linkNotice,
  commitTarget,
  onPlayPosition,
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
  linkNotice: string | null
  commitTarget: number
  onPlayPosition: (fen: string, mode: 'pass' | 'engine', human: Color) => void
}) {
  const x = Math.min(6, Math.max(0, index))
  const nearest = Math.round(x)
  const era = eras[nearest]
  const strip = stripFor(era.id as EraId, chipId)
  const leap = Math.min(1, Math.max(0, (x - 2) / 2))
  const leapShown = leapOpacity(x, reduced)
  const [toast, setToast] = useState<string | null>(null)
  const [lockedKind, setLockedKind] = useState<PieceKind | null>(null)
  const [hoverKind, setHoverKind] = useState<PieceKind | null>(null)
  const [namedEra, setNamedEra] = useState(era.id)
  if (namedEra !== era.id) {
    setNamedEra(era.id)
    setLockedKind(null)
    setHoverKind(null)
  }
  const named = namedEra === era.id ? (hoverKind ?? lockedKind) : null
  const settled = useRef(nearest)
  useEffect(() => {
    const cue = arrivalCue(settled.current, x, dragging, dragging ? null : commitTarget)
    settled.current = cue.stop
    if (!cue.line) return
    setToast(cue.line)
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [dragging, x, commitTarget])

  return (
    <main className="museum">
      {unknownStop ? (
        <p className="unknown-stop" data-testid="unknown-stop" role="status">
          No stop named “{unknownStop}”. Showing Shatranj.
        </p>
      ) : linkNotice ? (
        <p className="unknown-stop" data-testid="link-notice" role="status">
          {linkNotice}
        </p>
      ) : null}
      <Filmstrip index={x} dragging={dragging} onPreview={onPreview} onCommit={onCommit} />
      {toast ? (
        <p className="arrival" data-testid="arrival-toast" role="status">
          {toast}
        </p>
      ) : null}
      <LeapMorph t={leap} opacity={leapShown} />
      <div className="museum-grid">
        <PreviewBoard index={x} reduced={reduced} namedKind={named} />
        <div className="museum-side">
          <FadingCard
            index={x}
            chipId={chipId}
            reduced={reduced}
            onChip={onChip}
            named={named}
            onHover={setHoverKind}
            onPick={(kind) => setLockedKind((current) => (current === kind ? null : kind))}
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
          <div className="strip-head">
            <h2>{strip.heading}</h2>
            {strip.play ? (
              <div className="play-choices" data-testid="play-position">
                <span className="already-result" data-testid="already-result">
                  {strip.play.settled ? 'This diagram is already the result.' : 'Play this position'}
                </span>
                <Button
                  size="sm"
                  variant="ink"
                  data-testid="play-side-w"
                  onClick={() => onPlayPosition(strip.play!.fen, 'engine', 'w')}
                >
                  You play white
                </Button>
                <Button size="sm" data-testid="play-side-b" onClick={() => onPlayPosition(strip.play!.fen, 'engine', 'b')}>
                  You play black
                </Button>
                <Button
                  size="sm"
                  data-testid="play-side-pass"
                  onClick={() => onPlayPosition(strip.play!.fen, 'pass', parseFen(strip.play!.fen).turn)}
                >
                  Pass and play
                </Button>
              </div>
            ) : null}
          </div>
          <p>
            <PieceWords
              text={strip.note}
              active={named}
              onHover={setHoverKind}
              onPick={(kind) => setLockedKind((current) => (current === kind ? null : kind))}
            />
          </p>
        </header>
        <div className="strip-boards">
          <MiniBoard
            key={`${strip.left.rules.id}:${strip.left.fen}`}
            fen={strip.left.fen}
            rules={strip.left.rules}
            arrows={strip.arrows}
            label={strip.left.label}
            sub={strip.left.sub}
            active={strip.active === 'left'}
            positionResult={strip.positionResult}
            badge={strip.left.badge}
            line={strip.line}
            namedKind={named}
            onHover={setHoverKind}
            onPick={(kind) => setLockedKind((current) => (current === kind ? null : kind))}
          />
          <MiniBoard
            key={`${strip.right.rules.id}:${strip.right.fen}`}
            fen={strip.right.fen}
            rules={strip.right.rules}
            arrows={strip.arrows}
            label={strip.right.label}
            sub={strip.right.sub}
            active={strip.active === 'right'}
            positionResult={strip.positionResult}
            badge={strip.right.badge}
            line={strip.line}
            namedKind={named}
            onHover={setHoverKind}
            onPick={(kind) => setLockedKind((current) => (current === kind ? null : kind))}
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
  named,
  onHover,
  onPick,
}: {
  index: number
  chipId: string
  reduced: boolean
  onChip: (id: string) => void
  named: PieceKind | null
  onHover: (kind: PieceKind | null) => void
  onPick: (kind: PieceKind) => void
}) {
  const x = Math.min(6, Math.max(0, index))
  const nearest = Math.round(x)
  const slot = reduced ? { at: nearest, opacity: 1, entering: false, travel: 0 } : blendSlot(x)
  const era = eras[slot.at]
  const shift = slot.travel * 16
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
          named={named}
          onHover={onHover}
          onPick={onPick}
        />
      </div>
    </div>
  )
}
