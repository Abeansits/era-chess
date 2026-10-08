import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import { countColor } from '../engine/position'
import { opposite, sqName, type Color, type PieceKind } from '../engine/squares'
import { requestMove } from '../engine/engineClient'
import { levelById } from '../engine/levels'
import { attemptDrop, commitMove, resign, tick, type Session } from '../game/session'
import { activeChip, eraById } from '../rules/eras'
import { resultTitle } from '../rules/describe'
import { PieceGlyph } from './pieces'
import { PlayBoard } from './PlayBoard'
import { RuleCard } from './RuleCard'
import { Scoresheet } from './Scoresheet'

const NAMES: Record<PieceKind, string> = {
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  f: 'Ferz',
  a: 'Alfil',
  k: 'King',
  p: 'Pawn',
}

export function PlayView({
  session,
  onSession,
  onLeave,
}: {
  session: Session
  onSession: (session: Session) => void
  onLeave: () => void
}) {
  const [reason, setReason] = useState<string | null>(null)
  const [pending, setPending] = useState<
    | { kind: 'promotion'; from: number; to: number; pieces: PieceKind[] }
    | { kind: 'rook'; from: number; to: number; squares: number[] }
    | null
  >(null)
  const [thinking, setThinking] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const thinkId = useRef(0)
  const era = eraById(session.eraId)
  const chip = activeChip(era, session.chipId)
  const collapsed = session.history.length >= 20 && !rulesOpen
  const orientation: Color = session.mode === 'pass' ? session.pos.turn : session.human
  const lastMove = session.history.at(-1)?.move ?? null

  useEffect(() => {
    if (!reason) return
    const id = window.setTimeout(() => setReason(null), 7000)
    return () => window.clearTimeout(id)
  }, [reason])

  useEffect(() => {
    if (!session.clocks || session.result) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [session.clocks, session.result, session.clockStamp])

  useEffect(() => {
    if (!session.clocks || session.result || session.clockStamp === null) return
    const left = session.clocks[session.pos.turn] - (Date.now() - session.clockStamp)
    if (left <= 0) onSession(tick(session, Date.now()))
  }, [now, session, onSession])

  useEffect(() => {
    if (session.mode !== 'engine' || session.result || session.pos.turn === session.human) return
    const id = ++thinkId.current
    setThinking(true)
    setEngineError(null)
    const job = requestMove({
      pos: session.pos,
      rules: session.rules,
      difficulty: session.difficulty,
      seed: session.history.length * 97 + 11,
      hashes: session.hashes,
    })
    let cancelled = false
    job.done
      .then((move) => {
        if (cancelled || thinkId.current !== id) return
        if (!move) {
          setEngineError('The engine has no legal move.')
          setThinking(false)
          return
        }
        setThinking(false)
        onSession(commitMove(session, move, Date.now()))
      })
      .catch(() => {
        if (!cancelled && thinkId.current === id) {
          setEngineError('The engine stopped on this position.')
          setThinking(false)
        }
      })
    return () => {
      cancelled = true
      job.cancel()
      thinkId.current += 1
    }
  }, [session, onSession])

  function drop(from: number, to: number, choice?: { promotion?: PieceKind; rookTo?: number }) {
    if (pending?.kind === 'rook' && choice?.rookTo === undefined) {
      if (pending.squares.includes(to) && from === pending.from) {
        drop(pending.from, pending.to, { rookTo: to })
        return
      }
    }
    const attempt = attemptDrop(session, from, to, choice, Date.now())
    if (attempt.type === 'illegal') {
      setReason(attempt.reason || 'That move is not legal in this era.')
      return
    }
    if (attempt.type === 'promotion') {
      setPending({ kind: 'promotion', from, to, pieces: attempt.pieces })
      return
    }
    if (attempt.type === 'rook') {
      setPending({ kind: 'rook', from, to, squares: attempt.squares })
      setReason(null)
      return
    }
    setPending(null)
    setReason(null)
    onSession(attempt.session)
  }

  function remaining(side: Color): number {
    if (!session.clocks) return 0
    if (session.result || session.clockStamp === null || session.pos.turn !== side) return session.clocks[side]
    return Math.max(0, session.clocks[side] - (now - session.clockStamp))
  }

  const bareHint =
    session.rules.bareKing && countColor(session.pos, opposite(session.pos.turn)) === 2
  const turnName = session.pos.turn === 'w' ? 'White' : 'Black'
  const yourTurn =
    session.mode === 'pass' || session.pos.turn === session.human

  return (
    <main className="play">
      <header className="play-bar">
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            if (session.history.length) setConfirmLeave(true)
            else onLeave()
          }}
        >
          Back to the axis
        </Button>
        <div className="play-title">
          <strong>{era.name}</strong>
          {chip ? <span>{chip.label}</span> : null}
        </div>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => onSession(resign(session, session.mode === 'engine' ? session.human : session.pos.turn))}
          disabled={Boolean(session.result)}
        >
          Resign
        </Button>
      </header>

      <div className="play-grid">
        <div>
          {session.clocks ? (
            <div className="clocks">
              <Clock label="White" ms={remaining('w')} live={session.pos.turn === 'w' && !session.result} />
              <Clock label="Black" ms={remaining('b')} live={session.pos.turn === 'b' && !session.result} />
            </div>
          ) : null}
          {thinking && !session.result ? (
            <p className="thinking" data-testid="thinking" role="status">
              <span className="thinking-dot" />
              Thinking · {levelById(session.difficulty).label}
            </p>
          ) : (
            <p className="turn-line" aria-live="polite">
              {session.result
                ? resultTitle(session.result)
                : yourTurn
                  ? `${turnName} to move`
                  : 'Waiting for the engine'}
            </p>
          )}
          <PlayBoard
            pos={session.pos}
            rules={session.rules}
            orientation={orientation}
            lastMove={lastMove}
            disabled={Boolean(session.result) || thinking || !yourTurn}
            onDrop={(from, to) => drop(from, to)}
            onReason={setReason}
          />
          {pending?.kind === 'rook' ? (
            <div className="rook-choice" data-testid="rook-choice">
              <p>Place the rook. It finishes on the other side of the king.</p>
              <div>
                {pending.squares.map((sq) => (
                  <Button
                    key={sq}
                    size="sm"
                    variant="paper"
                    onClick={() => drop(pending.from, pending.to, { rookTo: sq })}
                  >
                    Rook to {sqName(sq)}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {reason ? (
            <p className="reason" data-testid="illegal-reason" role="status">
              {reason}
            </p>
          ) : null}
          {engineError ? <p className="reason">{engineError}</p> : null}
          {bareHint && !session.result ? (
            <p className="bare-hint">One piece beside the king. Capturing it can end the game.</p>
          ) : null}
          <div className={collapsed ? 'card-slot collapsed' : 'card-slot'}>
            <RuleCard
              era={era}
              index={erasIndex(session.eraId)}
              rules={session.rules}
              chip={chip}
              collapsed={collapsed}
              onExpand={() => setRulesOpen(true)}
            />
            {!collapsed && session.history.length >= 20 ? (
              <button type="button" className="text-link" onClick={() => setRulesOpen(false)}>
                Hide the card
              </button>
            ) : null}
          </div>
        </div>
        <Scoresheet history={session.history} rules={session.rules} />
      </div>

      <Dialog
        open={pending?.kind === 'promotion'}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
      >
        <DialogContent>
          <DialogTitle>Promotion</DialogTitle>
          <DialogDescription>Choose the piece this pawn becomes, under this era’s rule.</DialogDescription>
          <div className="promo-row">
            {pending?.kind === 'promotion'
              ? pending.pieces.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className="promo"
                    onClick={() => drop(pending.from, pending.to, { promotion: kind })}
                  >
                    <PieceGlyph kind={kind} color={session.pos.turn} />
                    <span>{NAMES[kind]}</span>
                  </button>
                ))
              : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogTitle>Leave this game?</DialogTitle>
          <DialogDescription>
            The position stays on this device only, and going back to the axis clears it.
          </DialogDescription>
          <div className="start-row">
            <Button variant="ink" onClick={onLeave}>
              Back to the axis
            </Button>
            <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
              Keep playing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function Clock({ label, ms, live }: { label: string; ms: number; live: boolean }) {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return (
    <div className={live ? 'clock is-live' : 'clock'}>
      <span>{label}</span>
      <strong>
        {m}:{String(s).padStart(2, '0')}
      </strong>
    </div>
  )
}

function erasIndex(id: Session['eraId']): number {
  return ['shatranj', 'medieval', 'queen', 'passant', 'castling', 'tournament', 'fide'].indexOf(id)
}
