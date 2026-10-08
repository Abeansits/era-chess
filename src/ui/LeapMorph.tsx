import { leapCaption } from './leap'

type Props = { t: number; opacity: number }

/** The king’s two-square leap tightening into a rook move. Visual only. */
export function LeapMorph({ t, opacity }: Props) {
  const kingX = 22 + t * 78
  const rookX = 138 - t * 40
  const arc = 1 - t
  return (
    <figure
      className="leap"
      data-testid="leap-morph"
      style={{ opacity, maxHeight: `${Math.round(opacity * 112)}px`, marginTop: opacity > 0.04 ? undefined : 0 }}
      aria-hidden={opacity < 0.05}
    >
      <svg viewBox="0 0 200 78" aria-hidden>
        <rect x="10" y="28" width="40" height="40" className="leap-sq" />
        <rect x="54" y="28" width="40" height="40" className="leap-sq alt" />
        <rect x="98" y="28" width="40" height="40" className="leap-sq" />
        <rect x="142" y="28" width="40" height="40" className="leap-sq alt" />
        <path
          d={`M32 48 C70 ${8 + arc * 6}, 110 ${8 + arc * 6}, 118 46`}
          fill="none"
          stroke="#e4c88a"
          strokeWidth="1.6"
          strokeDasharray="3 2.5"
          opacity={0.35 + arc * 0.65}
        />
        <g transform={`translate(${kingX} 34)`}>
          <circle cx="8" cy="14" r="8" fill="#fbf6ee" stroke="#2a2118" />
          <path d="M8 4 v5 M5.5 6.5 h5" stroke="#2a2118" strokeWidth="1.3" />
        </g>
        <g transform={`translate(${rookX} 36)`} opacity={0.25 + t * 0.75}>
          <rect x="1" y="4" width="16" height="18" rx="1" fill="#fbf6ee" stroke="#2a2118" />
          <path d="M1 4 h3.2 v3.2 h3.2 V4 h3.2 v3.2 H14 V4 h3" fill="none" stroke="#2a2118" />
        </g>
      </svg>
      <figcaption>{leapCaption(t)}</figcaption>
    </figure>
  )
}
