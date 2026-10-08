import { useRef } from 'react'
import { eras } from '../rules/eras'

type Props = {
  index: number
  dragging: boolean
  onPreview: (index: number) => void
  onCommit: (index: number) => void
}

export function Filmstrip({ index, dragging, onPreview, onCommit }: Props) {
  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const era = eras[nearest]
  const trackRef = useRef<HTMLDivElement>(null)

  function read(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return nearest
    const t = (clientX - rect.left) / rect.width
    return Math.min(6, Math.max(0, t * 6))
  }

  function place(value: number) {
    return `${(value / 6) * 100}%`
  }

  return (
    <div className="film-wrap">
      <div
        className={dragging ? 'film is-dragging' : 'film'}
        data-testid="filmstrip"
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={6}
        aria-valuenow={nearest}
        aria-valuetext={`${era.name}, ${era.years}`}
        aria-label="Historical rules"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          onPreview(read(event.clientX))
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          onPreview(read(event.clientX))
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          onCommit(Math.round(read(event.clientX)))
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') onCommit(Math.min(6, nearest + 1))
          if (event.key === 'ArrowLeft') onCommit(Math.max(0, nearest - 1))
          if (event.key === 'Home') onCommit(0)
          if (event.key === 'End') onCommit(6)
        }}
      >
        <div className="sprockets" />
        <div className="film-body">
          <div className="film-track" ref={trackRef}>
          <div className="film-rail" />
          <div className="film-head" style={{ left: place(index) }} />
          {eras.map((stop, i) => (
            <div
              key={stop.id}
              className={
                i === nearest
                  ? `film-stop is-on${i === 0 ? ' is-start' : ''}${i === eras.length - 1 ? ' is-end' : ''}`
                  : `film-stop${i === 0 ? ' is-start' : ''}${i === eras.length - 1 ? ' is-end' : ''}`
              }
              style={{ left: place(i) }}
              data-testid={`stop-${stop.id}`}
            >
              <span className="film-mark">{stop.mark}</span>
              <span className="film-name">{stop.short}</span>
            </div>
          ))}
          </div>
        </div>
        <div className="sprockets" />
      </div>
      <p className="film-caption">
        <span>{era.name}</span>
        <span className="dot">·</span>
        <span>{era.years}</span>
      </p>
    </div>
  )
}
