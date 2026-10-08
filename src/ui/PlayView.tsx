import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog'
import { countColor } from '../engine/position'
import { opposite, sqName, type Color, type PieceKind } from '../engine/squares'
import { requestMove } from '../engine/engineClient'
import { engineSeed } from '../engine/search'
import { levelById } from '../engine/levels'
import { agreeDraw, attemptDrop, commitMove, createSession, pauseClock, positionAt, resign, resigningSide, resumeClock, shareLink, tick, type Session } from '../game/session'
import { activeChip, eraById } from '../rules/eras'
import { resultTitle } from '../rules/describe'
import { PieceWords } from './PieceWords'
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
  const [reason, setReason] = useState<{ text: string; square: number } | null>(null)
  const [pending, setPending] = useState<
    | { kind: 'promotion'; from: number; to: number; pieces: PieceKind[] }
    | { kind: 'rook'; from: number; to: number; squares: number[] }
    | null
  >(null)
  const [thinking, setThinking] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmDraw, setConfirmDraw] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [viewPly, setViewPly] = useState<number | null>(null)
  const [lockedKind, setLockedKind] = useState<PieceKind | null>(null)
  const [hoverKind, setHoverKind] = useState<PieceKind | null>(null)
  const named = hoverKind ?? lockedKind
  const [trackedMoves, setTrackedMoves] = useState(session.history.length)
  if (trackedMoves !== session.history.length) {
    setTrackedMoves(session.history.length)
    setViewPly(null)
  }
  const [now, setNow] = useState(() => Date.now())
  const thinkId = useRef(0)
  const era = eraById(session.eraId)
  const pickKind = (kind: PieceKind) => setLockedKind((current) => (current === kind ? null : kind))
  const chip = activeChip(era, session.chipId)
  const collapsed = session.history.length >= 20 && !rulesOpen
  const browsing = viewPly !== null
  const shown = browsing ? positionAt(session, viewPly) : session.pos
  const orientation: Color =
    session.mode === 'engine' ? session.human : session.boardStill ? 'w' : shown.turn
  const lastMove = browsing
    ? viewPly > 0
      ? session.history[viewPly - 1].move
      : null
    : session.history.at(-1)?.move ?? null

  useEffect(() => {
    if (!reason) return
    const id = window.setTimeout(() => setReason(null), 7000)
    return () => window.clearTimeout(id)
  }, [reason])

  useEffect(() => {
    if (!session.clocks || session.result || browsing) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [session.clocks, session.result, session.clockStamp, browsing])

  useEffect(() => {
    if (browsing || !session.clocks || session.result || session.clockStamp === null) return
    const left = session.clocks[session.pos.turn] - (Date.now() - session.clockStamp)
    if (left <= 0) onSession(tick(session, Date.now()))
  }, [now, session, onSession, browsing])

  useEffect(() => {
    if (!browsing) return
    const paused = pauseClock(session, Date.now())
    if (paused !== session) onSession(paused)
  }, [browsing, session, onSession])

  useEffect(() => {
    if (browsing) return
    const resumed = resumeClock(session, Date.now())
    if (resumed !== session) onSession(resumed)
  }, [browsing, session, onSession])

  useEffect(() => {
    if (viewPly !== null || session.mode !== 'engine' || session.result || session.pos.turn === session.human) return
    const id = ++thinkId.current
    setThinking(true)
    setEngineError(null)
    const job = requestMove({
      pos: session.pos,
      rules: session.rules,
      difficulty: session.difficulty,
      seed: engineSeed(session.seed, session.history.length),
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
  }, [session, onSession, viewPly])

  function drop(from: number, to: number, choice?: { promotion?: PieceKind; rookTo?: number }) {
    if (pending?.kind === 'rook' && choice?.rookTo === undefined) {
      if (pending.squares.includes(to) && from === pending.from) {
        drop(pending.from, pending.to, { rookTo: to })
        return
      }
    }
    const attempt = attemptDrop(session, from, to, choice, Date.now())
    if (attempt.type === 'illegal') {
      setReason({ text: attempt.reason || 'That move is not legal in this era.', square: to })
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

  async function share() {
    const href = `${window.location.origin}${window.location.pathname}${shareLink(session)}`
    try {
      await navigator.clipboard.writeText(href)
      setShareNote('Link copied.')
    } catch {
      setShareNote(href)
    }
  }

  function remaining(side: Color): number {
    if (!session.clocks) return 0
    if (session.result || session.clockStamp === null || session.pos.turn !== side) return session.clocks[side]
    return Math.max(0, session.clocks[side] - (now - session.clockStamp))
  }

  function stepPly(delta: number) {
    const current = viewPly ?? session.history.length
    const next = Math.min(session.history.length, Math.max(0, current + delta))
    setViewPly(next >= session.history.length ? null : next)
  }

  const notedPly = browsing ? (viewPly && viewPly > 0 ? viewPly - 1 : -1) : session.history.length - 1
  const eraNote = notedPly >= 0 ? session.history[notedPly].note : null
  const bareHint =
    session.rules.bareKing && countColor(session.pos, opposite(session.pos.turn)) === 2
  const turnName = session.pos.turn === 'w' ? 'White' : 'Black'
  const resignSide = resigningSide(session)
  const resignLabel = `${resignSide === 'w' ? 'White' : 'Black'} resigns`
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
        <div className="play-actions">
          {session.result ? (
            <Button
              size="sm"
              data-testid="play-again"
              onClick={() =>
                onSession(
                  createSession({
                    eraId: session.eraId,
                    chipId: session.chipId,
                    mode: session.mode,
                    human: session.human,
                    difficulty: session.difficulty,
                    fen: session.startFen,
                    boardStill: session.boardStill,
                    now: Date.now(),
                    seed: Date.now() || 1,
                  }),
                )
              }
            >
              Play again
            </Button>
          ) : (
            <Button variant="quiet" size="sm" data-testid="agree-draw" onClick={() => setConfirmDraw(true)}>
              Agree a draw
            </Button>
          )}
          <Button variant="quiet" size="sm" data-testid="share" onClick={() => void share()}>
            Share
          </Button>
          <Button
            variant="quiet"
            size="sm"
            data-testid="resign"
            onClick={() => onSession(resign(session, resignSide))}
            disabled={Boolean(session.result)}
          >
            {resignLabel}
          </Button>
        </div>
      </header>

      <div className="play-grid">
        <div>
          {session.clocks ? (
            <div className="clocks">
              <Clock label="White" ms={remaining('w')} live={session.pos.turn === 'w' && !session.result && !browsing} />
              <Clock label="Black" ms={remaining('b')} live={session.pos.turn === 'b' && !session.result && !browsing} />
            </div>
          ) : null}
          {thinking && !session.result ? (
            <p className="thinking" data-testid="thinking" role="status">
              <span className="thinking-dot" />
              Thinking · {levelById(session.difficulty).label}
            </p>
          ) : (
            <p className="turn-line" data-testid="sheet-browse" aria-live="polite">
              {browsing
                ? `Looking at move ${viewPly} of ${session.history.length}. The game waits.`
                : session.result
                  ? resultTitle(session.result)
                  : yourTurn
                    ? `${turnName} to move`
                    : 'Waiting for the engine'}
            </p>
          )}
          {session.mode === 'pass' ? (
            <button
              type="button"
              className="text-link"
              data-testid="board-still"
              aria-pressed={session.boardStill}
              onClick={() => onSession({ ...session, boardStill: !session.boardStill })}
            >
              {session.boardStill ? 'White stays down' : 'Turn the board each ply'}
            </button>
          ) : null}
          {eraNote ? (
            <p className="era-note" data-testid="era-note">
              {eraNote}
            </p>
          ) : null}
          {shareNote ? (
            <p className="share-note" data-testid="share-status" role="status">
              {shareNote}
            </p>
          ) : null}
          {reason ? (
            <p className="reason reason-near" data-testid="illegal-reason" role="status">
              <PieceWords text={reason.text} active={named} onHover={setHoverKind} onPick={pickKind} />
            </p>
          ) : null}
          <PlayBoard
            pos={shown}
            rules={session.rules}
            orientation={orientation}
            lastMove={lastMove}
            disabled={browsing || Boolean(session.result) || thinking || !yourTurn}
            namedKind={named}
            onDrop={(from, to) => drop(from, to)}
            onReason={(text, square) => setReason({ text, square })}
            reasonSquare={reason?.square ?? null}
            onStep={stepPly}
            plyMark={browsing ? `Move ${viewPly} of ${session.history.length}` : null}
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
              named={named}
              onHover={setHoverKind}
              onPick={pickKind}
            />
            {!collapsed && session.history.length >= 20 ? (
              <button type="button" className="text-link" onClick={() => setRulesOpen(false)}>
                Hide the card
              </button>
            ) : null}
          </div>
        </div>
        <Scoresheet
          history={session.history}
          rules={session.rules}
          viewPly={viewPly}
          onView={setViewPly}
          named={named}
          onHover={setHoverKind}
          onPick={pickKind}
        />
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

      <Dialog open={confirmDraw} onOpenChange={setConfirmDraw}>
        <DialogContent>
          <DialogTitle>Agree a draw?</DialogTitle>
          <DialogDescription>Both sides end the game here. You can still play this stop again.</DialogDescription>
          <div className="start-row">
            <Button
              variant="ink"
              data-testid="confirm-draw"
              onClick={() => {
                setConfirmDraw(false)
                onSession(agreeDraw(session))
              }}
            >
              Agree
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDraw(false)}>
              Keep playing
            </Button>
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
