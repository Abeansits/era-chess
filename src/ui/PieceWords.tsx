import type { PieceKind } from '../engine/squares'
import { splitPieceWords } from '../rules/pieceNames'

export function PieceWords({
  text,
  active,
  onHover,
  onPick,
}: {
  text: string
  active: PieceKind | null
  onHover: (kind: PieceKind | null) => void
  onPick: (kind: PieceKind) => void
}) {
  const parts = splitPieceWords(text)
  return (
    <>
      {parts.map((part, index) =>
        part.kind ? (
          <button
            key={`${part.text}-${index}`}
            type="button"
            className={active === part.kind ? 'piece-word is-on' : 'piece-word'}
            data-piece={part.kind}
            aria-pressed={active === part.kind}
            onPointerEnter={() => onHover(part.kind)}
            onPointerLeave={() => onHover(null)}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (part.kind) onPick(part.kind)
            }}
          >
            {part.text}
          </button>
        ) : (
          <span key={`t-${index}`}>{part.text}</span>
        ),
      )}
    </>
  )
}
