export const SETTLE_MS = 260

/** Ease-out cubic. Fast at the start, settled at the end. */
export function easeOutCubic(u: number): number {
  const t = Math.min(1, Math.max(0, u))
  return 1 - (1 - t) ** 3
}

export type BlendSlot = {
  /** The only stop whose copy is mounted. */
  at: number
  /** Never blank. The handoff stays dim rather than empty. */
  opacity: number
  /** True on the way in, after the midpoint. */
  entering: boolean
  /** -1 is leaving upward, 1 is arriving from below, 0 is settled. */
  travel: number
}

const HANDOFF = 0.7
const RAMP = 0.16

/**
 * One block of copy. It holds, slides out, and the next block slides in.
 * Opacity stays high through the swap, so the card never blinks empty.
 * The two wordings are never mounted together.
 */
export function blendSlot(index: number, count = 7): BlendSlot {
  const max = count - 1
  const x = Math.min(max, Math.max(0, index))
  if (x >= max - 1e-9) return { at: max, opacity: 1, entering: false, travel: 0 }
  const left = Math.floor(x)
  const frac = x - left
  const fadeOutStart = 0.5 - RAMP
  if (frac <= 0.5) {
    if (frac <= fadeOutStart) return { at: left, opacity: 1, entering: false, travel: 0 }
    const u = (frac - fadeOutStart) / RAMP
    return { at: left, opacity: 1 - u * (1 - HANDOFF), entering: false, travel: -u }
  }
  const fadeInEnd = 0.5 + RAMP
  if (frac >= fadeInEnd) return { at: left + 1, opacity: 1, entering: true, travel: 0 }
  const u = (frac - 0.5) / RAMP
  return { at: left + 1, opacity: HANDOFF + u * (1 - HANDOFF), entering: true, travel: 1 - u }
}
