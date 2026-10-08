/** Phone layout numbers shared with the filmstrip CSS. A 390px screen must not crowd the seven names. */
export const PHONE_FILM = {
  viewport: 390,
  museumPad: 12,
  bodyPad: 8,
  axisMargin: 20,
} as const

export const FILM_STOPS = 7

/** Average character width at the phone label size. Conservative, so a pass is not a near miss. */
const PHONE_CHAR = 6.15

export function filmIndex(index: number, dragging: boolean, count = FILM_STOPS): number {
  const max = count - 1
  const x = Math.min(max, Math.max(0, index))
  return dragging ? x : Math.round(x)
}

export function tickPercent(stop: number, count = FILM_STOPS): number {
  const max = count - 1
  return (Math.min(max, Math.max(0, stop)) / max) * 100
}

export function phoneAxisWidth(viewport = PHONE_FILM.viewport): number {
  return viewport - PHONE_FILM.museumPad * 2 - PHONE_FILM.bodyPad * 2 - PHONE_FILM.axisMargin * 2
}

export function filmLabelWidth(text: string): number {
  return text.length * PHONE_CHAR
}

export function tickCenters(axisWidth: number, count = FILM_STOPS): number[] {
  const max = count - 1
  return Array.from({ length: count }, (_, i) => (i / max) * axisWidth)
}

/** True when two neighboring labels would paint on top of each other. */
export function labelsCrowd(centers: number[], widths: number[], gap = 2): boolean {
  for (let i = 0; i < centers.length - 1; i++) {
    const have = centers[i + 1] - centers[i]
    const need = widths[i] / 2 + widths[i + 1] / 2 + gap
    if (have + 0.01 < need) return true
  }
  return false
}
