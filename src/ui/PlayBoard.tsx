import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { inCheck } from '../engine/attacks'
import { legalMoves } from '../engine/moves'
import { fileEdgeLabel } from '../engine/notation'
import { fileOf, kindOf, colorOf, rankOf, sqName, type Color, type PieceKind } from '../engine/squares'
import type { Move, Position, Rules } from '../engine/types'
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
  onDrop: (from: number, to: number) => void
  onReason: (reason: string, square: number) => void
  reasonSquare: number | null
}

export function PlayBoard({ pos, rules, orientation, lastMove, disabled, onDrop, onReason, reasonSquare }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const box = useEvenSquare(slotRef)
  const [selected, setSelected] = useState<number | null>(null)
  const [locked, setLocked] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; ox: number; oy: number } | null>(
    null,
  )
  const [dragMoved, setDragMoved] = useState(false)
  const skipClick = useRef(false)
  const [anim, setAnim] = useState<{ move: Move; phase: 'from' | 'to' } | null>(null)

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
    if (disabled) return
    const code = pos.board[sq]
    if (!code || colorOf(code) !== pos.turn) return
    if (rules.touchMove && locked !== null && locked !== sq) return
    setDragMoved(false)
    if (rules.touchMove && moves.some((move) => move.from === sq)) setLocked(sq)
    setSelected(sq)
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ from: sq, x: event.clientX, y: event.clientY, ox: event.clientX, oy: event.clientY })
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return
    if (Math.hypot(event.clientX - drag.ox, event.clientY - drag.oy) > 6) setDragMoved(true)
    setDrag({ ...drag, x: event.clientX, y: event.clientY })
  }

  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return
    const from = drag.from
    const moved = dragMoved
    setDrag(null)
    setDragMoved(false)
    if (!moved) return
    skipClick.current = true
    const target = squareAt(event.clientX, event.clientY)
    if (target === null || target === from) {
      if (rules.touchMove && moves.some((move) => move.from === from)) onReason(REASONS.touchMove, from)
      return
    }
    if (rules.touchMove) setLocked(from)
    setSelected(from)
    onDrop(from, target)
  }

  const kingSq = pos.board.findIndex((code) => code && kindOf(code) === 'k' && colorOf(code) === pos.turn)
  const checked = inCheck(pos, pos.turn)

  return (
    <div className="play-board-wrap" data-testid="play-board" ref={slotRef}>
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
            return (
              <button
                key={sq}
                type="button"
                className="sq"
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
                onPointerUp={pointerUp}
              >
                {last ? <span className="mark-last" /> : null}
                {reasonSquare === sq ? <span className="mark-illegal" /> : null}
                {checked && sq === kingSq ? <span className="mark-check" /> : null}
                {selected === sq ? <span className="mark-selected" /> : null}
                {target ? <span className={pos.board[sq] || target.enPassant ? 'mark-capture' : 'mark-dot'} /> : null}
                {code && !hide ? <PieceGlyph kind={kindOf(code)!} color={colorOf(code)!} /> : null}
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
        {anim ? <AnimPiece pos={pos} move={anim.move} phase={anim.phase} place={place} /> : null}
      </div>
      {rules.notation !== 'algebraic' ? (
        <p className="coord-note" data-testid="coord-note">
          Sheet ranks count from the side who moved. Board numbers stay with White.
        </p>
      ) : null}
      {drag && dragMoved ? (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          <PieceGlyph kind={kindOf(pos.board[drag.from])!} color={colorOf(pos.board[drag.from])!} />
        </div>
      ) : null}
    </div>
  )
}

function AnimPiece({
  pos,
  move,
  phase,
  place,
}: {
  pos: Position
  move: Move
  phase: 'from' | 'to'
  place: (sq: number) => { col: number; row: number }
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
        return (
          <div
            key={spot.from}
            className="float-piece animating"
            style={{ left: `${at.col * 12.5}%`, top: `${at.row * 12.5}%`, width: '12.5%', height: '12.5%' }}
          >
            <PieceGlyph kind={kindOf(spot.code)!} color={colorOf(spot.code)!} />
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
