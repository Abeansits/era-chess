import type { PieceKind } from '../engine/squares'
import type { Rules } from '../engine/types'

export type EraId =
  | 'shatranj'
  | 'medieval'
  | 'queen'
  | 'passant'
  | 'castling'
  | 'tournament'
  | 'fide'

export type Chip = {
  id: string
  label: string
  detail: string
  patch: Partial<Pick<Rules, 'enPassant' | 'castling' | 'doubleStep'>>
}

export type Era = {
  id: EraId
  name: string
  short: string
  years: string
  /** Rough marker printed on the filmstrip. */
  mark: string
  rules: Rules
  chips: Chip[]
  defaultChip: string
  changed: string[]
  why: string
}

const ferz: PieceKind[] = ['f']
const queenOnly: PieceKind[] = ['q']
const anyPiece: PieceKind[] = ['q', 'r', 'b', 'n']

function rules(partial: Rules): Rules {
  return partial
}

export const eras: Era[] = [
  {
    id: 'shatranj',
    name: 'Shatranj',
    short: 'Shatranj',
    years: '700–1400',
    mark: 'c. 700',
    defaultChip: '',
    chips: [],
    changed: [
      'The ferz steps one square diagonally.',
      'The alfil jumps two squares diagonally, over anything in between.',
      'Pawns move one square. There is no castling.',
      'A pawn promotes to a ferz.',
      'Stalemate is a win, and a bare king loses.',
    ],
    why: 'Shatranj came west from Indian chaturanga and then held still for centuries. The ferz and the alfil were short-range pieces, so practical games were slow, and the composed problems — the mansubat — carried as much of the culture as the openings. H. J. R. Murray’s History of Chess is still the standard account of those openings and of the bare-king win.',
    rules: rules({
      id: 'shatranj',
      counselor: 'ferz',
      elephant: 'alfil',
      doubleStep: false,
      enPassant: false,
      castling: 'none',
      promotion: ferz,
      bareKing: true,
      stalemate: 'win',
      fiftyMove: false,
      repetition: false,
      insufficient: false,
      clock: false,
      touchMove: false,
      notation: 'shatranj',
    }),
  },
  {
    id: 'medieval',
    name: 'Medieval Europe',
    short: 'Medieval',
    years: '1200–1450',
    mark: 'c. 1200',
    defaultChip: '',
    chips: [],
    changed: [
      'The ferz and the alfil are unchanged.',
      'Baring the king is no longer a win.',
      'Stalemate is unsettled. This board scores it a draw.',
      'Promotion is still only to a ferz.',
    ],
    why: 'The same pieces crossed into Latin Europe, under names such as ferz and aufin. By the later Middle Ages the bare-king win had mostly been given up, while stalemate was still not agreed: some tables scored it a win, some a draw. Promotion remained the weak ferz, so an endgame could outlast the evening. The king’s leap was already being tried in places; it is not law in this package. Castling is the stop where that leap settles.',
    rules: rules({
      id: 'medieval',
      counselor: 'ferz',
      elephant: 'alfil',
      doubleStep: false,
      enPassant: false,
      castling: 'none',
      promotion: ferz,
      bareKing: false,
      stalemate: 'unsettled',
      fiftyMove: false,
      repetition: false,
      insufficient: false,
      clock: false,
      touchMove: false,
      notation: 'shatranj',
    }),
  },
  {
    id: 'queen',
    name: 'Queen’s chess',
    short: 'Queen',
    years: 'c. 1475',
    mark: '1475',
    defaultChip: '',
    chips: [],
    changed: [
      'The ferz becomes a queen and slides any distance.',
      'The alfil becomes a bishop and slides any distance.',
      'A pawn may step two squares on its first move.',
      'There is still no capture in passing, and no castling.',
      'A pawn promotes to a queen.',
    ],
    why: 'Around 1475, in Spain and Italy, the ferz became the queen and the alfil a sliding bishop, and the pawn gained an initial double step. Contemporaries called it queen’s chess, and in Italy scacchi alla rabiosa — mad chess — because the game had become so much faster. The older rules did not fade out. They were replaced in a bundle.',
    rules: rules({
      id: 'queen',
      counselor: 'queen',
      elephant: 'bishop',
      doubleStep: true,
      enPassant: false,
      castling: 'none',
      promotion: queenOnly,
      bareKing: false,
      stalemate: 'win',
      fiftyMove: false,
      repetition: false,
      insufficient: false,
      clock: false,
      touchMove: false,
      notation: 'descriptive',
    }),
  },
  {
    id: 'passant',
    name: 'En passant regions',
    short: 'Passant',
    years: '1500–1850',
    mark: '1561',
    defaultChip: 'spain',
    chips: [
      {
        id: 'spain',
        label: 'Spain & England',
        detail: 'A pawn that has just stepped two squares may be taken in passing.',
        patch: { enPassant: true },
      },
      {
        id: 'italy',
        label: 'Italy & Germany',
        detail: 'Passar battaglia: the double step stands, and there is no capture in passing.',
        patch: { enPassant: false },
      },
    ],
    changed: [
      'The double step can now slip a pawn past an enemy pawn.',
      'Spain and England answer with capture in passing, on the immediate reply only.',
      'Italy and Germany play passar battaglia: the jump is legal, and it cannot be taken.',
    ],
    why: 'The new double step let a pawn slip past an enemy pawn. Spain and England answered with capture in passing; Ruy López’s book of 1561 already discusses that capture. In Italy and parts of Germany the same jump was passar battaglia: legal, and not to be taken. Both habits lasted for centuries. Castling is still not in this package — it is the next argument.',
    rules: rules({
      id: 'passant',
      counselor: 'queen',
      elephant: 'bishop',
      doubleStep: true,
      enPassant: true,
      castling: 'none',
      promotion: queenOnly,
      bareKing: false,
      stalemate: 'win',
      fiftyMove: false,
      repetition: false,
      insufficient: false,
      clock: false,
      touchMove: false,
      notation: 'descriptive',
    }),
  },
  {
    id: 'castling',
    name: 'Castling split',
    short: 'Castling',
    years: '1500–1840',
    mark: '1700',
    defaultChip: 'ordinary',
    chips: [
      {
        id: 'ordinary',
        label: 'Spain, France & England',
        detail: 'Ordinary castling, fixed squares, and capture in passing.',
        patch: { castling: 'ordinary', enPassant: true },
      },
      {
        id: 'italy1700',
        label: 'Italy, 1700',
        detail: 'Free castling and passar battaglia. Queen’s chess, plus these two fields.',
        patch: { castling: 'free', enPassant: false },
      },
    ],
    changed: [
      'Ordinary castling: the king moves two squares, and the rook takes the square beside it.',
      'Italian free castling: on the home rank, between king and rook, each chooses a square. The king moves at least two, finishes on the far side of the rook, and the move may not give check.',
      'The Italian chip also turns en passant off. That is passar battaglia, in the same tap.',
    ],
    why: 'Castling grew out of the king’s leap, a one-time two-square step of the king that came to bring the rook along. Ordinary castling, with fixed squares, settled in Spain, France, and England. Italy kept free castling, and with it passar battaglia. The Milan tournament of 1881 is the usual marker for Italy taking up the international castling rule. Italy in 1700, on this board, is queen’s chess plus free castling and no en passant.',
    rules: rules({
      id: 'castling',
      counselor: 'queen',
      elephant: 'bishop',
      doubleStep: true,
      enPassant: true,
      castling: 'ordinary',
      promotion: queenOnly,
      bareKing: false,
      stalemate: 'win',
      fiftyMove: false,
      repetition: false,
      insufficient: false,
      clock: false,
      touchMove: false,
      notation: 'descriptive',
    }),
  },
  {
    id: 'tournament',
    name: 'Tournament chess',
    short: 'Tourney',
    years: '1850–1924',
    mark: '1851',
    defaultChip: '',
    chips: [],
    changed: [
      'En passant is universal, and free castling is dead.',
      'Stalemate is a draw.',
      'A pawn may promote to any piece.',
      'Fifty moves with no capture and no pawn move is a draw.',
      'King against king, or king and one knight or bishop, is a draw.',
    ],
    why: 'From London 1851 the large tournaments needed one code. En passant was universal, free castling was finished, and stalemate — already a draw in Staunton’s Handbook — became a draw at play. A pawn could promote to any piece, and fifty barren moves drew the game. The pieces were the queen’s-chess pieces. The arguments left were about clocks and claims.',
    rules: rules({
      id: 'tournament',
      counselor: 'queen',
      elephant: 'bishop',
      doubleStep: true,
      enPassant: true,
      castling: 'ordinary',
      promotion: anyPiece,
      bareKing: false,
      stalemate: 'draw',
      fiftyMove: true,
      repetition: false,
      insufficient: true,
      clock: false,
      touchMove: false,
      notation: 'descriptive',
    }),
  },
  {
    id: 'fide',
    name: 'FIDE',
    short: 'FIDE',
    years: '1924–now',
    mark: '1924',
    defaultChip: '',
    chips: [],
    changed: [
      'A clock runs for both sides.',
      'The same position three times is a draw, applied here with no spoken claim.',
      'Touch-move: a piece you choose, if it can move, has to move.',
      'The pieces and the mating rules are the tournament game.',
    ],
    why: 'The Fédération Internationale des Échecs was founded in Paris in 1924 and, over the decades after, gathered the laws into one book. Clocks, the threefold-repetition draw, and touch-move stopped being a house custom. On this board the fifty-move draw and the repetition draw are applied automatically, rather than by a claim to an arbiter. The pieces have not changed since the queen’s reform.',
    rules: rules({
      id: 'fide',
      counselor: 'queen',
      elephant: 'bishop',
      doubleStep: true,
      enPassant: true,
      castling: 'ordinary',
      promotion: anyPiece,
      bareKing: false,
      stalemate: 'draw',
      fiftyMove: true,
      repetition: true,
      insufficient: true,
      clock: true,
      touchMove: true,
      notation: 'algebraic',
    }),
  },
]

export function eraById(id: EraId): Era {
  const era = eras.find((item) => item.id === id)
  if (!era) throw new Error(`Unknown era ${id}`)
  return era
}

export function resolveRules(era: Era, chipId?: string): Rules {
  const id = chipId || era.defaultChip
  const chip = era.chips.find((item) => item.id === id)
  if (!chip) return era.rules
  return { ...era.rules, ...chip.patch, id: `${era.id}:${chip.id}` }
}

export function activeChip(era: Era, chipId?: string): Chip | null {
  const id = chipId || era.defaultChip
  return era.chips.find((item) => item.id === id) ?? null
}
