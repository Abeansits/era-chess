import { useMemo, useState } from 'react'
import type { Color } from './engine/squares'
import { createSession, type PlayMode, type Session } from './game/session'
import { eras, type EraId } from './rules/eras'
import { Museum } from './ui/Museum'
import { PlayView } from './ui/PlayView'

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
  const [session, setSession] = useState<Session | null>(null)

  const nearest = Math.round(Math.min(6, Math.max(0, index)))
  const era = eras[nearest]
  const chipId = chips[era.id] || era.defaultChip

  const screen = session ? 'play' : 'museum'
  const year = useMemo(() => era.years, [era])

  return (
    <div className="app">
      <header className="mast">
        <div>
          <p className="kicker">A museum of the rules</p>
          <h1>Era Chess</h1>
        </div>
        <p className="mast-line">
          {screen === 'play'
            ? `${era.name}, ${year}. The rule card stays with the board for the first ten moves.`
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
          onPreview={(value) => {
            setDragging(true)
            setIndex(value)
          }}
          onCommit={(value) => {
            setDragging(false)
            setIndex(value)
          }}
          onChip={(id) => setChips((current) => ({ ...current, [era.id]: id }))}
          onHuman={setHuman}
          onStart={(mode: PlayMode) => {
            setSession(
              createSession({
                eraId: era.id,
                chipId,
                mode,
                human,
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
