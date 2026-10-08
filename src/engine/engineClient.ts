import { levelById, type Difficulty } from './levels'
import type { SearchOptions } from './search'
import type { Move, Position, Rules } from './types'

type Reply = { id: number; move?: Move | null; error?: string }

let worker: Worker | null = null
let seq = 0

function engineWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

/** Search on a worker so the board stays responsive. Correctness is still `pickMove`. */
export function requestMove(input: {
  pos: Position
  rules: Rules
  difficulty: Difficulty
  seed: number
  hashes: string[]
}): { done: Promise<Move | null>; cancel: () => void } {
  const level = levelById(input.difficulty)
  const options: SearchOptions = {
    budgetMs: level.budgetMs,
    maxDepth: level.maxDepth,
    jitter: level.jitter,
    seed: input.seed,
    hashes: input.hashes,
  }
  const id = ++seq
  const thread = engineWorker()
  let settle: (move: Move | null) => void = () => {}
  let fail: (error: Error) => void = () => {}
  const done = new Promise<Move | null>((resolve, reject) => {
    settle = resolve
    fail = reject
  })
  const onMessage = (event: MessageEvent<Reply>) => {
    if (event.data.id !== id) return
    thread.removeEventListener('message', onMessage)
    if (event.data.error) fail(new Error(event.data.error))
    else settle(event.data.move ?? null)
  }
  thread.addEventListener('message', onMessage)
  thread.postMessage({ id, pos: input.pos, rules: input.rules, options })
  return {
    done,
    cancel: () => {
      thread.removeEventListener('message', onMessage)
    },
  }
}
