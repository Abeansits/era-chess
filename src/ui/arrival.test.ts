import { describe, expect, it } from 'vitest'
import { ARRIVAL, arrivalCue } from './arrival'

describe('arrival only when the slider settles', () => {
  it('announces the destination once, not the stops a long jump passes', () => {
    let stop = 0
    const heard: string[] = []
    for (const index of [0.4, 1, 2, 2.5, 3, 4.2, 5, 5.8]) {
      const cue = arrivalCue(stop, index, false, 6)
      stop = cue.stop
      if (cue.line) heard.push(cue.line)
    }
    expect(heard).toEqual([])
    expect(stop).toBe(0)
    const done = arrivalCue(stop, 6, false, 6)
    expect(done.line).toBe(ARRIVAL.fide)
    expect(done.line).not.toBe(ARRIVAL.queen)
    expect(arrivalCue(done.stop, 6, false, 6).line).toBeNull()
  })

  it('still announces a single step, and stays quiet while the hand is dragging', () => {
    expect(arrivalCue(1, 1.4, false, 2).line).toBeNull()
    expect(arrivalCue(1, 2, false, 2).line).toBe('1475: the queen wakes up.')
    const drag = arrivalCue(0, 2, true, null)
    expect(drag.line).toBeNull()
    expect(drag.stop).toBe(0)
  })
})
