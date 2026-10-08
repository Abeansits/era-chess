import { describe, expect, it } from 'vitest'
import { evenBoard } from './evenBoard'

describe('even board size', () => {
  it('snaps to a whole-pixel multiple of 8', () => {
    expect(evenBoard(640, 1)).toEqual({ size: 640, square: 80 })
    expect(evenBoard(641, 1)).toEqual({ size: 640, square: 80 })
    expect(evenBoard(100.4, 1)).toEqual({ size: 96, square: 12 })
    expect(evenBoard(7, 1)).toEqual({ size: 0, square: 0 })
  })

  it('keeps every square a whole device pixel when the ratio is not 1', () => {
    const box = evenBoard(333, 1.5)
    expect(box.square * 1.5).toBe(Math.round(box.square * 1.5))
    expect(box.size).toBeCloseTo(box.square * 8)
    expect(box.size).toBeLessThanOrEqual(333)
  })
})
