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
