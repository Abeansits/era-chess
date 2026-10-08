import { pickMove, type SearchOptions } from './search'
import type { Position, Rules } from './types'

export type SearchRequest = {
  id: number
  pos: Position
  rules: Rules
  options: SearchOptions
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SearchRequest>) => void) | null
  postMessage: (data: unknown) => void
}

scope.onmessage = (event: MessageEvent<SearchRequest>) => {
  const { id, pos, rules, options } = event.data
  try {
    const move = pickMove(pos, rules, options)
    scope.postMessage({ id, move })
  } catch (error) {
    scope.postMessage({ id, error: error instanceof Error ? error.message : 'search failed' })
  }
}
