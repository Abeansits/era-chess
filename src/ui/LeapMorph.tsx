type Props = { t: number }

/** The king’s two-square leap tightening into a rook move. Visual only. */
export function LeapMorph({ t }: Props) {
  const kingX = 28 + (1 - t) * 8
  const rookOpacity = t
  return (
    <figure className="leap" data-testid="leap-morph">
      <svg viewBox="0 0 160 64" aria-hidden>
        <rect x="8" y="16" width="36" height="36" className="leap-sq" />
        <rect x="44" y="16" width="36" height="36" className="leap-sq alt" />
        <rect x="80" y="16" width="36" height="36" className="leap-sq" />
        <rect x="116" y="16" width="36" height="36" className="leap-sq alt" />
        <path
          d="M22 40 C40 8, 70 8, 96 34"
          fill="none"
          stroke="#b08d57"
          strokeWidth="1.4"
          strokeDasharray="3 3"
          opacity={1 - t}
        />
        <g transform={`translate(${kingX} 22)`} opacity={0.95}>
          <circle cx="8" cy="12" r="7" fill="#fbf6ee" stroke="#2a2118" />
          <path d="M8 3 v4 M6 5 h4" stroke="#2a2118" strokeWidth="1.2" />
        </g>
        <g transform="translate(96 24)" opacity={rookOpacity}>
          <rect x="2" y="2" width="14" height="16" rx="1" fill="#fbf6ee" stroke="#2a2118" />
          <path d="M2 2 h3 v3 h3 V2 h3 v3 h3 V2 h2" fill="none" stroke="#2a2118" />
        </g>
      </svg>
      <figcaption>
        {t < 0.5 ? 'The king’s leap, still loose' : 'The leap, tightened into castling'}
      </figcaption>
    </figure>
  )
}
