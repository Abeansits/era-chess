function channel(hex: string): [number, number, number] {
  const n = hex.replace('#', '')
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}

export function mixHex(from: string, to: string, t: number): string {
  const a = channel(from)
  const b = channel(to)
  const c = a.map((value, i) => Math.round(value + (b[i] - value) * t))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

export function squareColors(morph: number): { light: string; dark: string } {
  return {
    light: mixHex('#e6d2a4', '#f0d9b5', morph),
    dark: mixHex('#3c4d6e', '#b58863', morph),
  }
}

const STOPS: Array<{ light: string; dark: string }> = [
  { light: '#e4c896', dark: '#31405e' },
  { light: '#e6d2a4', dark: '#3c4d6e' },
  { light: '#ecd4ae', dark: '#6d5a48' },
  { light: '#f0d9b5', dark: '#b58863' },
  { light: '#f1dcc0', dark: '#c0956c' },
  { light: '#f3e2c8', dark: '#c9a078' },
  { light: '#f6e7d0', dark: '#d4b48a' },
]

/** Palette for a fractional stop index. Neighboring stops stay close, so a scrub cannot pop. */
export function paletteAt(index: number): { light: string; dark: string } {
  const x = Math.min(6, Math.max(0, index))
  const left = Math.min(5, Math.floor(x))
  const frac = x >= 6 ? 1 : x - left
  const right = Math.min(6, left + 1)
  return {
    light: mixHex(STOPS[left].light, STOPS[right].light, frac),
    dark: mixHex(STOPS[left].dark, STOPS[right].dark, frac),
  }
}
