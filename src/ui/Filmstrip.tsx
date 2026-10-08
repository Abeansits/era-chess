import { useEffect, useRef } from 'react'
import { eras } from '../rules/eras'
import { blendSlot } from './blend'
import { filmIndex, tickPercent } from './film'

type Props = {
  index: number
  dragging: boolean
  onPreview: (index: number) => void
  onCommit: (index: number) => void
}

export function Filmstrip({ index, dragging, onPreview, onCommit }: Props) {
  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const axisRef = useRef<HTMLDivElement>(null)
  const filmRef = useRef<HTMLDivElement>(null)
  const pointing = useRef(false)
  const clamped = Math.min(6, Math.max(0, index))
  const shown = filmIndex(clamped, dragging)
  const slot = blendSlot(clamped)
  const caption = eras[slot.at]

  useEffect(() => {
    const el = filmRef.current
    if (!el) return
    const block = (event: TouchEvent) => event.preventDefault()
    el.addEventListener('touchstart', block, { passive: false })
    el.addEventListener('touchmove', block, { passive: false })
    return () => {
      el.removeEventListener('touchstart', block)
      el.removeEventListener('touchmove', block)
    }
  }, [])

  function read(clientX: number) {
    const rect = axisRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return clamped
    const t = (clientX - rect.left) / rect.width
    return Math.min(6, Math.max(0, t * 6))
  }

  function finish(clientX: number) {
    if (!pointing.current) return
    pointing.current = false
    onCommit(read(clientX))
  }

  return (
    <div className="film-wrap">
      <div
        ref={filmRef}
        className={dragging ? 'film is-dragging' : 'film'}
        data-testid="filmstrip"
        data-index={shown.toFixed(3)}
        data-settled={dragging ? '0' : '1'}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={6}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={`${eras[Math.round(shown)].name}, ${eras[Math.round(shown)].years}`}
        aria-label="Historical rules"
        onPointerDown={(event) => {
          event.preventDefault()
          pointing.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          onPreview(read(event.clientX))
        }}
        onPointerMove={(event) => {
          if (!pointing.current) return
          event.preventDefault()
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
          <div className="film-axis" ref={axisRef}>
            <div className="film-rail" />
            <div className="film-head" style={{ left: `${tickPercent(shown)}%` }} />
            {eras.map((stop, i) => {
              const weight = Math.max(0, 1 - Math.abs(shown - i))
              return (
                <div
                  key={stop.id}
                  className={i === Math.round(shown) ? 'film-stop is-on' : 'film-stop'}
                  style={{ left: `${tickPercent(i)}%` }}
                  data-testid={`stop-${stop.id}`}
                >
                  <span className="film-tick" />
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
      <p className="film-caption" data-blend-at={slot.at} data-blend-opacity={slot.opacity.toFixed(2)}>
        <span
          className="caption-slot"
          style={{
            opacity: slot.opacity,
            transform: `translateY(${slot.travel * 10}px)`,
          }}
        >
          {caption.name}
          <span className="dot"> · </span>
          {caption.years}
        </span>
      </p>
    </div>
  )
}
