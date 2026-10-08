import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { inCheck } from '../engine/attacks'
import { legalMoves } from '../engine/moves'
import { fileEdgeLabel } from '../engine/notation'
import { fileOf, kindOf, colorOf, rankOf, sqName, type Color, type PieceKind } from '../engine/squares'
import type { Move, Position, Rules } from '../engine/types'
import { guideForKind, pieceLabel } from '../rules/pieceNames'
import { REASONS } from '../rules/reasons'
import { squareColors } from './boardColors'
import { boardFrameStyle, boardTrackStyle, useEvenSquare } from './evenBoard'
import { PieceGlyph } from './pieces'

type Props = {
  pos: Position
  rules: Rules
  orientation: Color
  lastMove: Move | null
  disabled: boolean
  namedKind: PieceKind | null
  onDrop: (from: number, to: number) => void
  onReason: (reason: string, square: number) => void
  reasonSquare: number | null
  onStep?: (delta: number) => void
  plyMark?: string | null
}

type Gesture = {
  id: number
  sq: number
  ox: number
  oy: number
  moved: boolean
  mode: 'select' | 'toggle' | 'aim'
}

export function PlayBoard({
  pos,
  rules,
  orientation,
  lastMove,
  disabled,
  namedKind,
  onDrop,
  onReason,
  reasonSquare,
  onStep,
  plyMark,
}: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const box = useEvenSquare(slotRef)
  const [selected, setSelected] = useState<number | null>(null)
  const [locked, setLocked] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ from: number; x: number; y: number } | null>(null)
  const [dragMoved, setDragMoved] = useState(false)
  const skipClick = useRef(false)
  const gesture = useRef<Gesture | null>(null)
  const [anim, setAnim] = useState<{ move: Move; phase: 'from' | 'to' } | null>(null)

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const block = (event: TouchEvent) => event.preventDefault()
    el.addEventListener('touchstart', block, { passive: false })
    el.addEventListener('touchmove', block, { passive: false })
    return () => {
      el.removeEventListener('touchstart', block)
      el.removeEventListener('touchmove', block)
    }
  }, [])

  useEffect(() => {
    setSelected(null)
    setLocked(null)
  }, [pos])

  useEffect(() => {
    if (!lastMove) return
    setAnim({ move: lastMove, phase: 'from' })
    let frame = 0
    const first = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setAnim({ move: lastMove, phase: 'to' }))
    })
    const done = window.setTimeout(() => setAnim(null), 240)
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(frame)
      window.clearTimeout(done)
    }
  }, [lastMove])

  const colors = squareColors(rules.counselor === 'queen' ? 1 : 0)
  const moves = disabled ? [] : legalMoves(pos, rules)
  const targets = selected === null ? [] : moves.filter((move) => move.from === selected)
  const selectedCode = selected === null ? 0 : pos.board[selected]
  const selectedKind = selectedCode ? kindOf(selectedCode) : null
  const guide = selectedKind ? guideForKind(rules, selectedKind) : undefined

  function squareAt(clientX: number, clientY: number): number | null {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return null
    const col = Math.floor(((clientX - rect.left) / rect.width) * 8)
    const row = Math.floor(((clientY - rect.top) / rect.height) * 8)
    if (col < 0 || col > 7 || row < 0 || row > 7) return null
    const file = orientation === 'w' ? col : 7 - col
    const rank = orientation === 'w' ? 7 - row : row
    return rank * 8 + file
  }

  function place(sq: number): { col: number; row: number } {
    const file = fileOf(sq)
    const rank = rankOf(sq)
    return {
      col: orientation === 'w' ? file : 7 - file,
      row: orientation === 'w' ? 7 - rank : rank,
    }
  }

  function localPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function choose(sq: number) {
    if (disabled) return
    const code = pos.board[sq]
    if (selected !== null && targets.some((move) => move.to === sq)) {
      onDrop(selected, sq)
      if (!rules.touchMove) setLocked(null)
      return
    }
    if (selected !== null && (!code || colorOf(code) !== pos.turn)) {
      onDrop(selected, sq)
      return
    }
    if (!code || colorOf(code) !== pos.turn) return
    if (rules.touchMove && locked !== null && locked !== sq) {
      onReason(REASONS.touchMove, sq)
      return
    }
    const can = moves.some((move) => move.from === sq)
    if (rules.touchMove && can) setLocked(sq)
    if (selected === sq && !rules.touchMove) setSelected(null)
    else setSelected(sq)
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, sq: number) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    if (disabled) return
    const code = pos.board[sq]
    const own = Boolean(code && colorOf(code) === pos.turn)
    const blocked = rules.touchMove && locked !== null && locked !== sq
    if (own && !blocked) {
      const was = selected === sq && !rules.touchMove
      if (rules.touchMove && moves.some((move) => move.from === sq)) setLocked(sq)
      setSelected(sq)
      setDragMoved(false)
      setDrag({ from: sq, x: event.clientX, y: event.clientY })
      gesture.current = {
        id: event.pointerId,
        sq,
        ox: event.clientX,
        oy: event.clientY,
        moved: false,
        mode: was ? 'toggle' : 'select',
      }
      return
    }
    gesture.current = {
      id: event.pointerId,
      sq,
      ox: event.clientX,
      oy: event.clientY,
      moved: false,
      mode: 'aim',
    }
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    event.preventDefault()
    if (Math.hypot(event.clientX - current.ox, event.clientY - current.oy) > 8) {
      current.moved = true
      setDragMoved(true)
    }
    if (current.mode === 'aim') return
    setDrag((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev))
  }

  function finishPointer(event: PointerEvent<HTMLButtonElement>, cancel: boolean) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    event.preventDefault()
    gesture.current = null
    skipClick.current = true
    const moved = current.moved && !cancel
    setDrag(null)
    setDragMoved(false)
    if (current.mode !== 'aim' && moved) {
      const from = current.sq
      const target = squareAt(event.clientX, event.clientY)
      if (target === null || target === from) {
        if (rules.touchMove && moves.some((move) => move.from === from)) onReason(REASONS.touchMove, from)
        return
      }
      if (rules.touchMove) setLocked(from)
      setSelected(from)
      onDrop(from, target)
      return
    }
    if (moved) return
    if (current.mode === 'toggle') {
      setSelected(null)
      return
    }
    if (current.mode === 'select') return
    choose(current.sq)
  }

  const kingSq = pos.board.findIndex((code) => code && kindOf(code) === 'k' && colorOf(code) === pos.turn)
  const checked = inCheck(pos, pos.turn)
  const ghost = drag && dragMoved ? localPoint(drag.x, drag.y) : null

  return (
    <div
      className="play-board-wrap"
      data-testid="play-board"
      ref={slotRef}
      tabIndex={0}
      aria-label="Board. Left and right step through the moves."
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        event.stopPropagation()
        onStep?.(event.key === 'ArrowLeft' ? -1 : 1)
      }}
    >
      {plyMark ? (
        <p className="board-ply" data-testid="board-ply">
          {plyMark}
        </p>
      ) : null}
      <div className="board-aspect" ref={boardRef} style={boardFrameStyle(box)}>
        <div className="board-grid" style={boardTrackStyle(box)}>
          {Array.from({ length: 64 }, (_, i) => {
            const col = i % 8
            const row = Math.floor(i / 8)
            const file = orientation === 'w' ? col : 7 - col
            const rank = orientation === 'w' ? 7 - row : row
            const sq = rank * 8 + file
            const light = (file + rank) % 2 === 1
            const code = pos.board[sq]
            const kind = code ? kindOf(code) : null
            const hide =
              (drag?.from === sq && dragMoved) ||
              (anim !== null && (anim.move.to === sq || anim.move.castle?.rookTo === sq))
            const target = targets.find((move) => move.to === sq)
            const last =
              lastMove &&
              (lastMove.from === sq ||
                lastMove.to === sq ||
                lastMove.castle?.rookFrom === sq ||
                lastMove.castle?.rookTo === sq)
            const named = Boolean(kind && namedKind === kind)
            return (
              <button
                key={sq}
                type="button"
                className={named ? 'sq is-named' : 'sq'}
                data-kind={kind ?? undefined}
                style={{ background: light ? colors.light : colors.dark }}
                aria-label={labelFor(sq, code)}
                onClick={() => {
                  if (skipClick.current) {
                    skipClick.current = false
                    return
                  }
                  choose(sq)
                }}
                onPointerDown={(event) => pointerDown(event, sq)}
                onPointerMove={pointerMove}
                onPointerUp={(event) => finishPointer(event, false)}
                onPointerCancel={(event) => finishPointer(event, true)}
              >
                {last ? <span className="mark-last" /> : null}
                {reasonSquare === sq ? <span className="mark-illegal" /> : null}
                {checked && sq === kingSq ? <span className="mark-check" /> : null}
                {selected === sq ? <span className="mark-selected" /> : null}
                {target ? <span className={pos.board[sq] || target.enPassant ? 'mark-capture' : 'mark-dot'} /> : null}
                {code && !hide ? <PieceGlyph kind={kind!} color={colorOf(code)!} /> : null}
                {file === (orientation === 'w' ? 0 : 7) ? (
                  <span className="coord rank">{rank + 1}</span>
                ) : null}
                {rank === (orientation === 'w' ? 0 : 7) ? (
                  <span className={fileEdgeLabel(file, rules.notation).length > 1 ? 'coord file long' : 'coord file'}>
                    {fileEdgeLabel(file, rules.notation)}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        {anim ? <AnimPiece pos={pos} move={anim.move} phase={anim.phase} place={place} namedKind={namedKind} /> : null}
        {ghost && drag ? (
          <div className="drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
            <PieceGlyph kind={kindOf(pos.board[drag.from])!} color={colorOf(pos.board[drag.from])!} />
          </div>
        ) : null}
      </div>
      {guide ? (
        <p className="piece-label" data-testid="piece-label">
          {pieceLabel(guide)}
        </p>
      ) : null}
      {rules.notation !== 'algebraic' ? (
        <p className="coord-note" data-testid="coord-note">
          Sheet ranks count from the side who moved. Board numbers stay with White.
        </p>
      ) : null}
    </div>
  )
}

function AnimPiece({
  pos,
  move,
  phase,
  place,
  namedKind,
}: {
  pos: Position
  move: Move
  phase: 'from' | 'to'
  place: (sq: number) => { col: number; row: number }
  namedKind: PieceKind | null
}) {
  const spots = [
    { from: move.from, to: move.to, code: pos.board[move.to] },
    move.castle
      ? { from: move.castle.rookFrom, to: move.castle.rookTo, code: pos.board[move.castle.rookTo] }
      : null,
  ].filter((spot): spot is { from: number; to: number; code: number } => Boolean(spot && spot.code))
  return (
    <>
      {spots.map((spot) => {
        const at = place(phase === 'from' ? spot.from : spot.to)
        const kind = kindOf(spot.code)
        const named = kind && namedKind === kind
        return (
          <div
            key={spot.from}
            className={named ? 'float-piece animating is-named' : 'float-piece animating'}
            style={{ left: `${at.col * 12.5}%`, top: `${at.row * 12.5}%`, width: '12.5%', height: '12.5%' }}
          >
            <PieceGlyph kind={kind!} color={colorOf(spot.code)!} />
          </div>
        )
      })}
    </>
  )
}

function labelFor(sq: number, code: number): string {
  const where = sqName(sq)
  if (!code) return `Empty ${where}`
  const side = colorOf(code) === 'w' ? 'White' : 'Black'
  const names: Record<PieceKind, string> = {
    p: 'pawn',
    n: 'knight',
    r: 'rook',
    b: 'bishop',
    q: 'queen',
    k: 'king',
    f: 'ferz',
    a: 'alfil',
  }
  return `${side} ${names[kindOf(code)!]} on ${where}`
}
