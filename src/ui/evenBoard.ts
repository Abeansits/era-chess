import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

export type EvenBoard = { size: number; square: number }

/**
 * Largest board that fits in `availableCss` whose squares are a whole number
 * of device pixels. Eight of those squares are identical, including the a-
 * and h-files.
 */
export function evenBoard(availableCss: number, dpr = 1): EvenBoard {
  const ratio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1
  if (!Number.isFinite(availableCss) || availableCss < 8) return { size: 0, square: 0 }
  const squareDevice = Math.floor((availableCss * ratio) / 8)
  if (squareDevice < 1) return { size: 0, square: 0 }
  const square = squareDevice / ratio
  return { size: square * 8, square }
}

export function boardFrameStyle(box: EvenBoard): CSSProperties | undefined {
  if (!box.size) return undefined
  return { width: box.size, height: box.size }
}

export function boardTrackStyle(box: EvenBoard): CSSProperties | undefined {
  if (!box.square) return undefined
  return {
    gridTemplateColumns: `repeat(8, ${box.square}px)`,
    gridTemplateRows: `repeat(8, ${box.square}px)`,
  }
}

export function useEvenSquare(ref: RefObject<HTMLElement | null>): EvenBoard {
  const [box, setBox] = useState<EvenBoard>({ size: 0, square: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      const next = evenBoard(el.clientWidth, window.devicePixelRatio || 1)
      setBox((prev) => (prev.size === next.size && prev.square === next.square ? prev : next))
    }
    apply()
    const obs = new ResizeObserver(apply)
    obs.observe(el)
    window.addEventListener('resize', apply)
    return () => {
      obs.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [ref])
  return box
}
