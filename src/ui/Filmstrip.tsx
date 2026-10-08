import { useRef } from 'react'
import { eras } from '../rules/eras'
import { blendSlot } from './blend'

type Props = {
  index: number
  dragging: boolean
  onPreview: (index: number) => void
  onCommit: (index: number) => void
}

export function Filmstrip({ index, dragging, onPreview, onCommit }: Props) {
  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const trackRef = useRef<HTMLDivElement>(null)
  const pointing = useRef(false)
  const clamped = Math.min(6, Math.max(0, index))
  const slot = blendSlot(clamped)
  const shown = eras[slot.at]

  function read(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return clamped
    const t = (clientX - rect.left) / rect.width
    return Math.min(6, Math.max(0, t * 6))
  }

  function place(value: number) {
    return `${(value / 6) * 100}%`
  }

  function finish(clientX: number) {
    if (!pointing.current) return
    pointing.current = false
    onCommit(read(clientX))
  }

  return (
    <div className="film-wrap">
      <div
        className={dragging ? 'film is-dragging' : 'film'}
        data-testid="filmstrip"
        data-index={clamped.toFixed(3)}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={6}
        aria-valuenow={nearest}
        aria-valuetext={`${eras[nearest].name}, ${eras[nearest].years}`}
        aria-label="Historical rules"
        onPointerDown={(event) => {
          pointing.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          onPreview(read(event.clientX))
        }}
        onPointerMove={(event) => {
          if (!pointing.current) return
          onPreview(read(event.clientX))
        }}
        onPointerUp={(event) => finish(event.clientX)}
        onPointerCancel={(event) => finish(event.clientX)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            onCommit(Math.min(6, nearest + 1))
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            onCommit(Math.max(0, nearest - 1))
          }
          if (event.key === 'Home') {
            event.preventDefault()
            onCommit(0)
          }
          if (event.key === 'End') {
            event.preventDefault()
            onCommit(6)
          }
        }}
      >
        <div className="sprockets" />
        <div className="film-body">
          <div className="film-track" ref={trackRef}>
            <div className="film-rail" />
            <div className="film-head" style={{ left: place(clamped) }} />
            {eras.map((stop, i) => {
              const weight = Math.max(0, 1 - Math.abs(clamped - i))
              return (
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
                  <span
                    className="film-name"
                    style={{
                      color: `color-mix(in srgb, var(--brass-2) ${Math.round(weight * 100)}%, #cbbba4)`,
                    }}
                  >
                    {stop.short}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="sprockets" />
      </div>
      <ol className="film-legend" data-testid="stop-legend">
        {eras.map((stop, i) => (
          <li key={stop.id} className={i === nearest ? 'is-on' : undefined}>
            {stop.short}
          </li>
        ))}
      </ol>
      <p className="film-caption" data-blend-at={slot.at} data-blend-opacity={slot.opacity.toFixed(2)}>
        <span
          className="caption-slot"
          style={{
            opacity: slot.opacity,
            transform: `translateY(${(slot.entering ? 1 - slot.opacity : slot.opacity - 1) * 8}px)`,
          }}
        >
          {shown.name}
          <span className="dot"> · </span>
          {shown.years}
        </span>
      </p>
    </div>
  )
}
