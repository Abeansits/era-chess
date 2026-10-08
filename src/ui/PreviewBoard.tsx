import { useRef } from 'react'
import { paletteAt } from './boardColors'
import { boardFrameStyle, boardTrackStyle, useEvenSquare } from './evenBoard'
import { PieceGlyph } from './pieces'
import { morphCaption, previewPieces } from './previewLayout'

export function PreviewBoard({ index, reduced }: { index: number; reduced: boolean }) {
  const slotRef = useRef<HTMLDivElement>(null)
  const box = useEvenSquare(slotRef)
  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const morph = reduced ? (nearest >= 2 ? 1 : 0) : Math.min(1, Math.max(0, index - 1))
  const colors = paletteAt(reduced ? nearest : index)
  const pieces = previewPieces(morph)
  return (
    <div className="preview-frame" data-testid="preview-board" data-morph={morph.toFixed(2)}>
      <div className="board-slot" ref={slotRef}>
        <div className="board-aspect is-preview" style={boardFrameStyle(box)}>
          <div className="board-grid" style={boardTrackStyle(box)}>
            {Array.from({ length: 64 }, (_, i) => {
              const file = i % 8
              const rank = 7 - Math.floor(i / 8)
              const light = (file + rank) % 2 === 1
              return (
                <div key={i} className="sq" style={{ background: light ? colors.light : colors.dark }} />
              )
            })}
          </div>
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className="float-piece"
              style={{
                left: `${(piece.file / 8) * 100}%`,
                top: `${((7 - piece.rank) / 8) * 100}%`,
                width: '12.5%',
                height: '12.5%',
                opacity: piece.opacity,
                transform: `scale(${piece.scale})`,
              }}
            >
              <PieceGlyph kind={piece.kind} color={piece.color} />
            </div>
          ))}
        </div>
      </div>
      <p className="preview-caption">{morphCaption(morph)}</p>
    </div>
  )
}
