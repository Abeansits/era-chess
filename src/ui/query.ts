import type { Difficulty } from '../engine/levels'
import type { Color } from '../engine/squares'
import { eras, type EraId } from '../rules/eras'

export type GameLink = {
  eraId: EraId
  chipId: string
  mode: 'pass' | 'engine'
  human: Color
  difficulty: Difficulty
  fen: string | null
  moves: string[]
  boardStill: boolean
}

export function readMuseumQuery(search: string): {
  index: number
  chipId: string | null
  unknownStop: string | null
} {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const stop = params.get('stop')
  const found = eras.findIndex((era) => era.id === stop)
  const unknownStop = stop && found < 0 ? stop : null
  const index = found >= 0 ? found : 0
  const era = eras[index]
  const chip = params.get('chip')
  const chipId = chip && era.chips.some((item) => item.id === chip) ? chip : null
  return { index, chipId, unknownStop }
}

export function readGameLink(search: string): GameLink | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const modeParam = params.get('mode')
  const fen = params.get('fen')
  const moves = params.get('moves')
  if (modeParam !== 'pass' && modeParam !== 'engine' && !fen && !moves) return null
  const stop = params.get('stop')
  const era = eras.find((item) => item.id === stop)
  if (!era) return null
  const chip = params.get('chip')
  const chipId = chip && era.chips.some((item) => item.id === chip) ? chip : era.defaultChip
  const level = params.get('level')
  const difficulty: Difficulty = level === 'easy' || level === 'hard' || level === 'medium' ? level : 'medium'
  return {
    eraId: era.id,
    chipId,
    mode: modeParam === 'engine' ? 'engine' : 'pass',
    human: params.get('human') === 'b' ? 'b' : 'w',
    difficulty,
    fen: fen && fen.includes('/') ? fen : null,
    moves: moves ? moves.split('.').filter(Boolean) : [],
    boardStill: params.get('board') === 'still',
  }
}

export function gameSearch(link: GameLink): string {
  const params = new URLSearchParams()
  params.set('stop', link.eraId)
  if (link.chipId) params.set('chip', link.chipId)
  params.set('mode', link.mode)
  params.set('human', link.human)
  params.set('level', link.difficulty)
  if (link.boardStill) params.set('board', 'still')
  if (link.fen) params.set('fen', link.fen)
  if (link.moves.length) params.set('moves', link.moves.join('.'))
  return `?${params.toString()}`
}

export function museumSearch(eraId: EraId, chipId: string): string {
  const era = eras.find((item) => item.id === eraId)
  const params = new URLSearchParams()
  params.set('stop', eraId)
  if (era && era.chips.length > 0 && chipId) params.set('chip', chipId)
  return `?${params.toString()}`
}
