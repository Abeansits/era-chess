import type { Color, PieceKind } from '../engine/squares'
import { squareColors } from './boardColors'
import { MorphGlyph } from './pieces'

type PreviewPiece = {
  id: string
  color: Color
  from: PieceKind
  to: PieceKind
  file: number
  rank: number
  lift: number
}

function pieces(t: number): PreviewPiece[] {
  const lift = Math.sin(Math.PI * t) * 0.42
  const out: PreviewPiece[] = []
  for (let file = 0; file < 8; file++) {
    out.push({ id: `wp${file}`, color: 'w', from: 'p', to: 'p', file, rank: 1, lift: 0 })
    out.push({ id: `bp${file}`, color: 'b', from: 'p', to: 'p', file, rank: 6, lift: 0 })
  }
  const stay: PieceKind[] = ['r', 'n', 'r', 'n']
  const files = [0, 1, 6, 7]
  stay.forEach((kind, i) => {
    const file = files[i]
    out.push({ id: `w${file}`, color: 'w', from: kind, to: kind, file, rank: 0, lift: 0 })
    out.push({ id: `b${file}`, color: 'b', from: kind, to: kind, file, rank: 7, lift: 0 })
  })
  for (const file of [2, 5]) {
    out.push({ id: `wa${file}`, color: 'w', from: 'a', to: 'b', file, rank: 0, lift: 0 })
    out.push({ id: `ba${file}`, color: 'b', from: 'a', to: 'b', file, rank: 7, lift: 0 })
  }
  out.push({ id: 'wk', color: 'w', from: 'k', to: 'k', file: 3 + t, rank: 0, lift })
  out.push({ id: 'bk', color: 'b', from: 'k', to: 'k', file: 3 + t, rank: 7, lift: -lift })
  out.push({ id: 'wf', color: 'w', from: 'f', to: 'q', file: 4 - t, rank: 0, lift: -lift })
  out.push({ id: 'bf', color: 'b', from: 'f', to: 'q', file: 4 - t, rank: 7, lift })
  return out
}

export function PreviewBoard({ morph }: { morph: number }) {
  const colors = squareColors(morph)
  return (
    <div className="preview-frame" data-testid="preview-board" data-morph={morph.toFixed(2)}>
      <div className="board-aspect">
        <div className="board-grid">
          {Array.from({ length: 64 }, (_, i) => {
            const file = i % 8
            const rank = 7 - Math.floor(i / 8)
            const light = (file + rank) % 2 === 1
            return (
              <div
                key={i}
                className="sq"
                style={{ background: light ? colors.light : colors.dark }}
              />
            )
          })}
        </div>
        {pieces(morph).map((piece) => (
          <div
            key={piece.id}
            className="float-piece"
            style={{
              left: `${(piece.file / 8) * 100}%`,
              top: `${((7 - piece.rank - piece.lift) / 8) * 100}%`,
              width: '12.5%',
              height: '12.5%',
            }}
          >
            <MorphGlyph from={piece.from} to={piece.to} t={morph} color={piece.color} />
          </div>
        ))}
      </div>
      <p className="preview-caption">
        {morph < 0.08
          ? 'Ferz on the e-file, alfil on the bishop’s squares.'
          : morph > 0.92
            ? 'The queen has taken the d-file. The alfil slides.'
            : 'Crossing 1475. The ferz becomes the queen.'}
      </p>
    </div>
  )
}
