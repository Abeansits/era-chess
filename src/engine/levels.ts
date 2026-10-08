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
    jitter: 28,
  },
  {
    id: 'hard',
    label: 'Hard',
    detail: 'Looks ahead, and does not start a deeper search once about half the time for the move is gone.',
    budgetMs: 1300,
    maxDepth: 6,
    jitter: 0,
  },
]

export function levelById(id: Difficulty): LevelSpec {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[1]
}
