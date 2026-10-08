export const SETTLE_MS = 260

/** Ease-out cubic. Fast at the start, settled at the end. */
export function easeOutCubic(u: number): number {
  const t = Math.min(1, Math.max(0, u))
  return 1 - (1 - t) ** 3
}

export type BlendSlot = {
  /** The only stop whose copy is mounted. */
  at: number
  /** 1 is fully readable. 0 is blank, which is when the copy changes. */
  opacity: number
  /** True on the way in, after the midpoint. */
  entering: boolean
}

/**
 * First half of the gap between two stops fades the outgoing copy out.
 * Second half fades the incoming copy in. The two are never on screen together.
 */
export function blendSlot(index: number, count = 7): BlendSlot {
  const max = count - 1
  const x = Math.min(max, Math.max(0, index))
  if (x >= max - 1e-9) return { at: max, opacity: 1, entering: false }
  const left = Math.floor(x)
  const frac = x - left
  if (frac <= 0.5) return { at: left, opacity: 1 - frac * 2, entering: false }
  return { at: left + 1, opacity: (frac - 0.5) * 2, entering: true }
}
