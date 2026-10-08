import { describe, expect, it } from 'vitest'
import { SETTLE_MS, blendSlot, easeOutCubic } from './blend'

describe('release ease', () => {
  it('settles in a quarter-second ease-out', () => {
    expect(SETTLE_MS).toBeGreaterThanOrEqual(200)
    expect(SETTLE_MS).toBeLessThanOrEqual(300)
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.8)
  })
})

describe('one block of text', () => {
  it('fades the outgoing copy out, then the incoming copy in', () => {
    expect(blendSlot(2)).toEqual({ at: 2, opacity: 1, entering: false })
    expect(blendSlot(2.25)).toEqual({ at: 2, opacity: 0.5, entering: false })
    expect(blendSlot(2.5).opacity).toBe(0)
    expect(blendSlot(2.5).at).toBe(2)
    expect(blendSlot(2.75)).toEqual({ at: 3, opacity: 0.5, entering: true })
    expect(blendSlot(6)).toEqual({ at: 6, opacity: 1, entering: false })
  })

  it('changes the copy only while it is blank', () => {
    let previous = blendSlot(0)
    for (let step = 1; step <= 600; step++) {
      const slot = blendSlot(step / 100)
      if (slot.at !== previous.at) {
        expect(previous.opacity).toBe(0)
        expect(slot.opacity).toBeLessThan(0.05)
      }
      expect(slot.opacity).toBeGreaterThanOrEqual(0)
      expect(slot.opacity).toBeLessThanOrEqual(1)
      previous = slot
    }
  })
})
