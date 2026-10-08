import { useEffect, useRef, useState } from 'react'
import type { Difficulty } from './engine/levels'
import type { Color } from './engine/squares'
import { createSession, type PlayMode, type Session } from './game/session'
import { eras, type EraId } from './rules/eras'
import { SETTLE_MS, easeOutCubic } from './ui/blend'
import { Museum } from './ui/Museum'
import { PlayView } from './ui/PlayView'
import { useReducedMotion } from './ui/useReducedMotion'

function initialIndex(): number {
  const stop = new URLSearchParams(window.location.search).get('stop')
  const found = eras.findIndex((era) => era.id === stop)
  return found >= 0 ? found : 0
}

export function App() {
  const [index, setIndex] = useState(initialIndex)
  const [dragging, setDragging] = useState(false)
  const [chips, setChips] = useState<Partial<Record<EraId, string>>>({})
  const [human, setHuman] = useState<Color>('w')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [session, setSession] = useState<Session | null>(null)
  const reduced = useReducedMotion()
  const indexRef = useRef(index)
  const frame = useRef(0)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const era = eras[nearest]
  const chipId = chips[era.id] || era.defaultChip
  const screen = session ? 'play' : 'museum'

  function preview(value: number) {
    cancelAnimationFrame(frame.current)
    indexRef.current = value
    setDragging(true)
    setIndex(value)
  }

  function commit(value: number) {
    const target = Math.round(Math.min(6, Math.max(0, value)))
    cancelAnimationFrame(frame.current)
    setDragging(false)
    const from = indexRef.current
    if (reduced || Math.abs(target - from) < 0.01) {
      indexRef.current = target
      setIndex(target)
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / SETTLE_MS)
      const next = from + (target - from) * easeOutCubic(u)
      indexRef.current = next
      setIndex(next)
      if (u < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  return (
    <div className="app">
      <header className="mast">
        <div>
          <p className="kicker">A museum of the rules</p>
          <h1>Era Chess</h1>
        </div>
        <p className="mast-line">
          {screen === 'play'
            ? `${era.name}, ${era.years}. The rule card stays with the board for the first ten moves.`
            : 'Drag the century. Read the three lines that changed. Play that game.'}
        </p>
      </header>
      {session ? (
        <PlayView session={session} onSession={setSession} onLeave={() => setSession(null)} />
      ) : (
        <Museum
          index={index}
          dragging={dragging}
          chipId={chipId}
          human={human}
          difficulty={difficulty}
          reduced={reduced}
          onPreview={preview}
          onCommit={commit}
          onChip={(id) => setChips((current) => ({ ...current, [era.id]: id }))}
          onHuman={setHuman}
          onDifficulty={setDifficulty}
          onStart={(mode: PlayMode) => {
            setSession(
              createSession({
                eraId: era.id,
                chipId,
                mode,
                human,
                difficulty,
                now: Date.now(),
              }),
            )
          }}
        />
      )}
      <footer className="colophon">
        Seven stops, from shatranj to FIDE. Regional arguments live in the chips, not in extra ticks.
        Courier chess is a different board.
      </footer>
    </div>
  )
}
