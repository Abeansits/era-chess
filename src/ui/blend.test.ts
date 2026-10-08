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
  it('holds the card, then cross-slides without going blank', () => {
    expect(blendSlot(2)).toMatchObject({ at: 2, opacity: 1, entering: false, travel: 0 })
    expect(blendSlot(2.25)).toMatchObject({ at: 2, opacity: 1, travel: 0 })
    const mid = blendSlot(2.5)
    expect(mid.at).toBe(2)
    expect(mid.opacity).toBeGreaterThanOrEqual(0.7)
    expect(mid.travel).toBeLessThan(0)
    const incoming = blendSlot(2.51)
    expect(incoming.at).toBe(3)
    expect(incoming.entering).toBe(true)
    expect(incoming.opacity).toBeGreaterThanOrEqual(0.7)
    expect(incoming.travel).toBeGreaterThan(0)
    expect(blendSlot(2.75)).toMatchObject({ at: 3, opacity: 1, travel: 0 })
    expect(blendSlot(6)).toMatchObject({ at: 6, opacity: 1, entering: false })
  })

  it('keeps a single wording, and never an empty card', () => {
    let previous = blendSlot(0)
    for (let step = 1; step <= 600; step++) {
      const slot = blendSlot(step / 100)
      expect(slot.opacity).toBeGreaterThanOrEqual(0.7)
      expect(slot.opacity).toBeLessThanOrEqual(1)
      if (slot.at !== previous.at) {
        expect(slot.at).toBe(previous.at + 1)
        expect(previous.entering).toBe(false)
        expect(slot.entering).toBe(true)
        expect(previous.travel).toBeLessThan(0)
        expect(slot.travel).toBeGreaterThan(0)
      }
      previous = slot
    }
  })
})
