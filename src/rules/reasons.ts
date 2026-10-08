/** Historical refusals, stored as data so the board quotes a rule instead of inventing one. */
export const REASONS = {
  pawnDoubleEarly:
    'That pawn cannot jump. The double step is still two centuries away.',
  pawnTooFar: 'A pawn does not move that far.',
  pawnDoubleOnce: 'The double step is only from the pawn’s starting square.',
  pawnSideways: 'A pawn does not move sideways.',
  pawnBackward: 'A pawn does not retreat.',
  pawnQuietCapture: 'A pawn captures diagonally, not straight ahead.',
  passar:
    'Passar battaglia: that pawn may jump, and it cannot be taken in passing.',
  noEnPassant:
    'There is no capture in passing. A pawn does not yet step two squares to slip by.',
  epExpired: 'En passant is only the immediate reply. That pawn is no longer passing.',
  ferzSlide:
    'The ferz steps one square diagonally. The long queen is still centuries away.',
  ferzStep: 'The ferz moves one square diagonally, and no other way.',
  alfilStep: 'The alfil does not step one square. It jumps two, and it is not yet a bishop.',
  alfilJump: 'The alfil jumps exactly two squares diagonally.',
  noCastling: 'There is no castling here. The king steps one square.',
  ordinaryOnly:
    'Ordinary castling has fixed squares. The king moves two, and the rook comes to the square beside it.',
  castleMoved: 'The king or that rook has already moved, so castling is lost.',
  castlePath: 'The king cannot cross or land on an attacked square to castle.',
  castleGivesCheck: 'Italian free castling may not itself give check.',
  castleFree:
    'Free castling stays on the home rank, between the king and that rook, with the king moving at least two squares.',
  blocked: 'A piece stands in the way.',
  ownPiece: 'One of your own pieces already stands there.',
  exposed: 'That move leaves your king in check.',
  empty: 'There is no piece on that square.',
  turn: 'It is the other side’s move.',
  touchMove: 'Touch-move: that piece can move, so it has to.',
  generic: 'That move is not legal in this era.',
  pawn: 'A pawn moves one square forward, or one square diagonally to capture.',
  knight: 'The knight jumps in an L, two squares one way and one square the other.',
  rook: 'The rook slides along a rank or a file.',
  bishop: 'The bishop slides diagonally, and it cannot jump.',
  queen: 'The queen slides any number of squares, rank, file, or diagonal.',
  king: 'The king steps one square in any direction.',
} as const

export type ReasonKey = keyof typeof REASONS
