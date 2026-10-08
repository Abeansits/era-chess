import { paletteAt } from './boardColors'
import { MorphGlyph } from './pieces'
import { previewPieces } from './previewLayout'

export function PreviewBoard({ index, reduced }: { index: number; reduced: boolean }) {
  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const morph = reduced ? (nearest >= 2 ? 1 : 0) : Math.min(1, Math.max(0, index - 1))
  const colors = paletteAt(reduced ? nearest : index)
  const pieces = previewPieces(morph)
  return (
    <div className="preview-frame" data-testid="preview-board" data-morph={morph.toFixed(2)}>
      <div className="board-aspect is-preview">
        <div className="board-grid">
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
            }}
          >
            <MorphGlyph from={piece.from} to={piece.to} t={piece.glyph} color={piece.color} />
          </div>
        ))}
      </div>
      <p className="preview-caption">{caption(morph)}</p>
    </div>
  )
}

function caption(morph: number): string {
  if (morph < 0.08) return 'Ferz on the e-file, alfil on the bishop’s squares.'
  if (morph < 0.4) return 'The ferz becomes the queen where she stands. The alfil becomes the bishop.'
  if (morph < 0.92) return 'They trade files only once each has left the square.'
  return 'Queen on the d-file, king on the e-file.'
}
