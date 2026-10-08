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
      'Stalemate is scored a win on this board. That is a simplification: the regions did not switch together, and Staunton printed a draw in 1847.',
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
        label: 'Italy & some German clubs',
        detail:
          'Passar battaglia, as played in Italy. Some German clubs took it up from an 1822 translation. There was no shared code.',
        patch: { enPassant: false },
      },
    ],
    changed: [
      'The double step can now slip a pawn past an enemy pawn.',
      'Spain and England answer with capture in passing, on the immediate reply only.',
      'Italy plays passar battaglia: the jump is legal, and it cannot be taken. Some German clubs followed an 1822 translation. They did not share one code.',
      'Ruy López in 1561 still scores a win by taking every piece but the king. This board does not: the bare-king win stopped at the medieval stop.',
    ],
    why: 'The new double step let a pawn slip past an enemy pawn. Spain and England answered with capture in passing; Ruy López’s book of 1561 already discusses that capture. In Italy the same jump was passar battaglia: legal, and not to be taken. Some German clubs played that way after an 1822 translation of the Italian rules. Italy and Germany did not share one code. Both habits lasted for centuries. López’s same book still scores a bare king as a win. This board does not revive that win after the medieval stop. Castling is still not in this package — it is the next argument.',
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
      'Ordinary castling: the king moves two squares, and the rook takes the square beside it. That move may give check.',
      'Italian free castling on this board is a reconstruction. The king moves at least two squares and finishes on the far side of the rook. The ban on the move itself giving check is the attested part. The Modenese laws allow any square between the king and the rook, inclusive, which can be a single square.',
      'This board does not apply the stricter Modenese rule that the king or the rook may not land on a square where it attacks an enemy man.',
      'The Italian chip also turns en passant off. That is passar battaglia, in the same tap.',
      'Stalemate is scored a win here. That is a simplification: England and France had already moved toward a draw, and Staunton printed a draw in 1847.',
    ],
    why: 'Castling grew out of the king’s leap, a one-time two-square step of the king that came to bring the rook along. Ordinary castling, with fixed squares, settled in Spain, France, and England. Italy kept free castling, and with it passar battaglia. The check ban is attested. “At least two squares” is a reconstruction: the manuscripts disagree, and the Modenese laws allow the king any square between it and the rook, including one square. A plain reading of those laws also forbids the king or the rook from landing where it attacks an enemy man, which is stricter than “may not give check.” This board does not apply that landing rule, so the contrast with ordinary castling — which may give check — stays the lesson. The Milan tournament of 1881 is the usual marker for Italy taking up the international castling rule. Italy in 1700, on this board, is queen’s chess plus this reconstruction of free castling and no en passant. Stalemate-as-a-win on this stop is the same simplification as on queen’s chess: regional, and already a draw in Staunton’s 1847 Handbook.',
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
      'The modern fifty-move draw: one hundred half-moves with no capture and no pawn move, applied here with no claim. López in 1561 already required a mate inside fifty moves in some endgames. The automatic draw is later; London 1883 is the usual marker.',
      'King against king, or king and one knight or bishop, is a draw.',
    ],
    why: 'From London 1851 the large tournaments needed one code. En passant was universal, free castling was finished, and stalemate — already a draw in Staunton’s Handbook — became a draw at play. A pawn could promote to any piece. López’s book of 1561 already required a mate inside fifty moves in some endgames. The automatic fifty-move draw, counted in half-moves and applied with no claim, is late-nineteenth-century tournament law. London 1883 is the usual marker, not 1851. This board uses that modern rule. The pieces were the queen’s-chess pieces. The arguments left were about clocks and claims.',
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
      'A clock runs for both sides. Double clocks were already London 1883 tournament equipment. This stop is where the board starts one.',
      'The same position three times is a draw. That triple-occurrence draw is also London 1883 territory, applied here with no spoken claim.',
      'Touch-move: a piece you choose, if it can move, has to move. That rule is in the eighteenth-century Italian laws, not a 1924 invention.',
      'Paris 1924 founded FIDE. The pieces and the mating rules are the tournament game. One lawbook came later than these customs.',
    ],
    why: 'The Fédération Internationale des Échecs was founded in Paris in 1924 and, over the decades after, gathered the laws into one book. Touch-move is older: it is in the eighteenth-century Italian laws. Double clocks and the triple-occurrence draw were already London 1883 tournament practice. This stop is where the board turns those three on together, not the year each one was invented. On this board the fifty-move draw and the repetition draw are applied automatically, rather than by a claim to an arbiter. The pieces have not changed since the queen’s reform.',
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
