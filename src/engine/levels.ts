export type Difficulty = 'easy' | 'medium' | 'hard'

export type LevelSpec = {
  id: Difficulty
  label: string
  detail: string
  budgetMs: number
  maxDepth: number
  /** Centipawn window. Easy may choose among close moves. Hard plays the best. */
  jitter: number
}

export const LEVELS: LevelSpec[] = [
  {
    id: 'easy',
    label: 'Easy',
    detail: 'A short look, and it will take a lesser move.',
    budgetMs: 140,
    maxDepth: 2,
    jitter: 160,
  },
  {
    id: 'medium',
    label: 'Medium',
    detail: 'A few plies, with the captures examined first.',
    budgetMs: 550,
    maxDepth: 4,
    jitter: 16,
  },
  {
    id: 'hard',
    label: 'Hard',
    detail: 'Keeps searching until the clock for the move runs out.',
    budgetMs: 1300,
    maxDepth: 6,
    jitter: 0,
  },
]

export function levelById(id: Difficulty): LevelSpec {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[1]
}
