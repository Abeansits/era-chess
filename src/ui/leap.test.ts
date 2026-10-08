import { describe, expect, it } from 'vitest'
import { leapCaption, leapOpacity } from './leap'

describe('king’s leap drawing', () => {
  it('is hidden on a stop, including queen’s chess, and shown only between stops', () => {
    for (const stop of [0, 1, 2, 3, 4, 5, 6]) {
      expect(leapOpacity(stop, false)).toBe(0)
    }
    expect(leapOpacity(2.5, false)).toBeGreaterThan(0)
    expect(leapOpacity(3.5, false)).toBeGreaterThan(0)
    expect(leapOpacity(1.5, false)).toBe(0)
    expect(leapOpacity(4.5, false)).toBe(0)
    expect(leapOpacity(2, true)).toBe(0)
    expect(leapOpacity(3.5, true)).toBe(0)
  })

  it('says the drawing is not a legal move yet', () => {
    expect(leapCaption(0)).toContain('Not a legal move yet')
    expect(leapCaption(0.5)).toContain('Not a legal move yet')
    expect(leapCaption(1)).toContain('Not a legal move yet')
  })
})
