export type Color = 'w' | 'b'
export type Square = number

export const KIND_BY_INDEX = ['p', 'n', 'r', 'a', 'f', 'k', 'q', 'b'] as const
export type PieceKind = (typeof KIND_BY_INDEX)[number]

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}

export function fileOf(sq: Square): number {
  return sq & 7
}

export function rankOf(sq: Square): number {
  return sq >> 3
}

export function makeSq(file: number, rank: number): Square {
  return rank * 8 + file
}

export function sqName(sq: Square): string {
  return String.fromCharCode(97 + fileOf(sq)) + String(rankOf(sq) + 1)
}

export function parseSq(name: string): Square {
  return makeSq(name.charCodeAt(0) - 97, name.charCodeAt(1) - 49)
}

export function kindOf(code: number): PieceKind | null {
  if (code === 0) return null
  return KIND_BY_INDEX[(code - 1) % 8]
}

export function colorOf(code: number): Color | null {
  if (code === 0) return null
  return code <= 8 ? 'w' : 'b'
}

export function codeOf(kind: PieceKind, color: Color): number {
  const index = KIND_BY_INDEX.indexOf(kind) + 1
  return color === 'w' ? index : index + 8
}

export function onBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8
}
