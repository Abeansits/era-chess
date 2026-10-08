import type { Color, PieceKind } from '../engine/squares'

type Ink = { fill: string; stroke: string }

function ink(color: Color): Ink {
  return color === 'w'
    ? { fill: '#fbf6ee', stroke: '#2a2118' }
    : { fill: '#1c1814', stroke: '#f0e2c8' }
}

function Glyph({ kind, color }: { kind: PieceKind; color: Color }) {
  const { fill, stroke } = ink(color)
  const common = { fill, stroke, strokeWidth: 1.35, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'p':
      return (
        <g {...common}>
          <circle cx="22" cy="13" r="5.2" />
          <path d="M15.5 20h13l-1.2 12h-10.6z" />
          <path d="M12 33.5h20l-1.2 4H13.2z" />
        </g>
      )
    case 'r':
      return (
        <g {...common}>
          <path d="M11 8h5.2v4.2H18V8h8v4.2h1.8V8H33v6.5H11z" />
          <path d="M13.5 14.5h17v16h-17z" />
          <path d="M10.5 31.5h23l-1.4 6H12z" />
        </g>
      )
    case 'n':
      return (
        <g {...common}>
          <path d="M12 36.5 14 28c-2.2-2.4-2.4-8 .6-11.2 1.2-4.8 4.6-9.2 9.2-9.3 3.2 0 5.2 2.4 4.6 5.2 2.8-.2 6.4 1.6 7.2 5.4.6 2.8-1 5.4-3.2 6.6 1.6 1.2 3 3.6 2.2 6.2L33 36.5H12z" />
          <circle cx="24.2" cy="16.2" r="1.15" fill={stroke} stroke="none" />
          <path d="M11 33.2h22.5" fill="none" />
        </g>
      )
    case 'b':
      return (
        <g {...common}>
          <circle cx="22" cy="8.2" r="2.5" />
          <path d="M22 11.2c3.4 1.6 6.4 4.6 6.4 9.2 0 2.2-1 4.2-2.2 5.6 2.4.6 4.2 2.4 4.6 5.2H11.2c.4-2.8 2.2-4.6 4.6-5.2-1.2-1.4-2.2-3.4-2.2-5.6 0-4.6 3-7.6 6.4-9.2z" />
          <path d="M22 13.2v8.4" fill="none" strokeWidth="1.2" />
          <path d="M12 32.2h20l-1.3 5.6H13.4z" />
        </g>
      )
    case 'q':
      return (
        <g {...common}>
          <path d="M7.5 16.5 11.2 7.2l4.6 7.2L22 5.2l6.2 9.2 4.6-7.2 3.7 9.3-2.2 14.2H9.7z" />
          <circle cx="11.2" cy="7.4" r="1.35" />
          <circle cx="22" cy="5.4" r="1.45" />
          <circle cx="32.8" cy="7.4" r="1.35" />
          <path d="M11 32.4h22l-1.2 5.4H12.2z" />
        </g>
      )
    case 'k':
      return (
        <g {...common}>
          <path d="M20.2 4.2h3.6V8H28v3.4h-4.2V15h-3.6v-3.6H16V8h4.2z" />
          <path d="M14.2 16.2h15.6l2.2 14.4H12z" />
          <path d="M10.8 32h22.4l-1.3 5.6H12.1z" />
        </g>
      )
    case 'f':
      return (
        <g {...common}>
          <path d="M22 6.5 28.5 15H15.5z" />
          <path d="M15.2 17.2h13.6l1.6 13.2H13.6z" />
          <path d="M12 32.2h20l-1.2 5.2H13.2z" />
        </g>
      )
    case 'a':
      return (
        <g {...common}>
          <path d="M14 20c0-6 3.4-11 8-11s8 5 8 11c0 3.2-1.2 5.6-2.4 7.2 2.6.8 4.6 2.8 5 5.6H11.4c.4-2.8 2.4-4.8 5-5.6C15.2 25.6 14 23.2 14 20z" />
          <path d="M28.5 16.5c4.2-.4 7.2 2.2 6.4 6.2" fill="none" strokeWidth="1.6" />
          <path d="M13.5 18c-3.6-1.2-6.4 1.6-5.2 5.2 1 2.6 3.4 3.2 5.2 2.6" fill="none" />
          <path d="M12 32.4h20l-1.2 5.2H13.2z" />
        </g>
      )
  }
}

export function PieceGlyph({ kind, color }: { kind: PieceKind; color: Color }) {
  return (
    <svg viewBox="0 0 44 44" className="piece-svg" aria-hidden>
      <Glyph kind={kind} color={color} />
    </svg>
  )
}

export function MorphGlyph({
  from,
  to,
  t,
  color,
}: {
  from: PieceKind
  to: PieceKind
  t: number
  color: Color
}) {
  if (t <= 0.02 || from === to) return <PieceGlyph kind={from} color={color} />
  if (t >= 0.98) return <PieceGlyph kind={to} color={color} />
  return (
    <svg viewBox="0 0 44 44" className="piece-svg" aria-hidden>
      <g opacity={1 - t} transform={`translate(22 22) scale(${1 + t * 0.16}) translate(-22 -22)`}>
        <Glyph kind={from} color={color} />
      </g>
      <g opacity={t} transform={`translate(22 22) scale(${0.68 + t * 0.32}) translate(-22 -22)`}>
        <Glyph kind={to} color={color} />
      </g>
    </svg>
  )
}
