import type { Color, PieceKind } from './squares'

export type CastlingMode = 'none' | 'ordinary' | 'free'
export type StalemateRule = 'win' | 'draw' | 'unsettled'
export type NotationStyle = 'shatranj' | 'descriptive' | 'algebraic'

/** One era, after regional chips have been applied. The slider only selects a record. */
export type Rules = {
  id: string
  counselor: 'ferz' | 'queen'
  elephant: 'alfil' | 'bishop'
  doubleStep: boolean
  enPassant: boolean
  castling: CastlingMode
  promotion: PieceKind[]
  bareKing: boolean
  stalemate: StalemateRule
  fiftyMove: boolean
  repetition: boolean
  insufficient: boolean
  clock: boolean
  touchMove: boolean
  notation: NotationStyle
}

export type CastleRights = {
  wk: boolean
  wq: boolean
  bk: boolean
  bq: boolean
}

export type Position = {
  board: number[]
  turn: Color
  ep: number
  halfmove: number
  fullmove: number
  castle: CastleRights
}

export type Move = {
  from: number
  to: number
  promotion?: PieceKind
  enPassant?: boolean
  castle?: { rookFrom: number; rookTo: number }
}

export type ResultReason =
  | 'checkmate'
  | 'stalemate'
  | 'stalemate-unsettled'
  | 'bare-king'
  | 'mutual-bare'
  | 'fifty-move'
  | 'repetition'
  | 'insufficient'
  | 'resign'
  | 'time'
  | 'agreement'

export type GameResult = {
  winner: Color | null
  reason: ResultReason
}
