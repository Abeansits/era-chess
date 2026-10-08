# Era Chess, v1

A static site. Drag the filmstrip, read the three lines that changed, and play that stop. Pass and play on one device, or play the engine. Online friend play is not in this version.

## Stack

Vite, React, and TypeScript, with Tailwind for the page. The dev server and the preview both bind to `127.0.0.1:4179`. Vitest covers the rules. The build is a static `dist/` with no server and no accounts.

React is here because the filmstrip, the morph, and the two play modes are one piece of UI state. The rules core does not import React. `src/game/session.ts` is the boundary a later online game can take as-is.

shadcn-style primitives (button, dialog) sit on Radix. Piece drawings are original silhouettes, not a Staunton font.

## Stops and chips

One rules record per stop, in `src/rules/eras.ts`. `resolveRules` copies that record and applies the selected chip, which may override `enPassant`, `castling`, and `doubleStep`. Everything else — move generation, check, outcomes, notation, the refusal text — reads the resolved record.

| Stop | What the record turns on |
| --- | --- |
| Shatranj, 700–1400 | Ferz (one diagonal), alfil (jump of two), pawns one square, no castling, promote to ferz, bare king loses, stalemate wins. |
| Medieval Europe, 1200–1450 | Same pieces. Bare king is not a win. Stalemate is unsettled and scored a draw. |
| Queen’s chess, c. 1475 | Queen and bishop. Pawn double step. No en passant, no castling. Promote to queen. Stalemate still wins. |
| En passant regions, 1500–1850 | Chip **Spain & England**: en passant. Chip **Italy & Germany**: passar battaglia (double step stays, en passant off). No castling yet. |
| Castling split, 1500–1840 | Chip **Spain, France & England**: ordinary castling and en passant. Chip **Italy, 1700**: free castling and passar battaglia, one tap. |
| Tournament chess, 1850–1924 | En passant on, ordinary castling, promote to any piece, stalemate draw, fifty-move draw, king / king+knight / king+bishop draw. No clock, no repetition, no touch-move. Descriptive notation. |
| FIDE, 1924–now | The tournament game, plus a 10-minute clock, threefold repetition applied by the board, touch-move, and algebraic notation as the primary sheet. |

The filmstrip is a float from 0 to 6. Dragging previews. Releasing snaps to the nearest stop. The queen morph is the fraction between Medieval and Queen’s chess: the ferz slides toward the d-file and becomes a queen, the king slides toward the e-file, the alfils become bishops. The king’s leap drawn above the board, between Queen’s chess and the castling stop, is a picture only. It is not a legal move.

The rule card stays under the board until twenty plies (ten moves), then collapses to a Rules button.

## What the engine does, and what this code does

Fairy-Stockfish was read, not vendored. The `ffish` JavaScript binding exposes a board: legal moves, FEN, and a result. It does not expose search. The variant file documents that flexible castling is unsupported. Built-in shatranj matches the array used here (king on the d-file, ferz on the e-file, alfil on the bishop’s squares) and treats a bare king and stalemate as losses, which this core also does.

Because search is missing from that binding, and because Italian free castling cannot be written as a Stockfish variant, **every rule in the running app is this repository’s own code**: `src/engine` generates moves, detects the result, explains an illegal drop, and searches. The opponent is an alpha-beta search with a short time budget (iterative deepening, depth at most 3, about half a second on the main thread) and a little jitter among close moves. It is not Stockfish, and it will not play like Stockfish.

Perft checks that are standard chess, where the rules coincide, are locked: queen’s chess (no castling, no en passant yet) is 20 and 400 at depths 1 and 2. FIDE is 20, 400, and 8902. Shatranj and medieval at the start are 16 (eight pawns, four knights, four alfil jumps).

## Notation

Shatranj and medieval use a descriptive sheet (`d2–d3` is `P-K3`). Algebraic is the secondary view. From queen’s chess through the tournament stop, the primary sheet is English descriptive (`e4` is `P-K4`). FIDE’s primary sheet is algebraic. Ordinary castling is `O-O` / `O-O-O`. A free-castling landing that is not those two squares is written as the king’s and the rook’s squares. En passant on the descriptive sheet is marked `e.p.`

## Historical simplifications

These are choices, stated on the cards, not silent ones.

- Medieval stalemate was not agreed. This board scores the unsettled case a draw, and says so.
- From queen’s chess through the castling split, stalemate is a win for the side that gives it, so the tournament stop has a real change. Staunton already taught a draw. The regions were messier than one switch.
- Queen’s chess has the double step and not yet en passant. The spec separates those stops.
- No castling until the castling stop. The medieval king’s leap is not legal.
- Promotion is immediate: ferz only, then queen only, then any piece at the tournament stop. The older delay (the new ferz must move once) is not implemented.
- Italian free castling is a reconstruction, written on the card. The king and rook are unmoved, the span between them is empty, the king is not in check, both pieces land on that span including the squares they leave, the king moves at least two files and finishes on the far side of the rook, and the king’s path is not attacked. The move itself may not give check. Ordinary castling may. Not every Italian manuscript agrees with this geometry.
- The fifty-move rule and threefold repetition are applied by the board when the stop includes them, not by a claim to an arbiter.
- Insufficient material is king, king and knight, or king and bishop, and only from the tournament stop.
- Shatranj does not use a 70-move limit.
- Clocks exist only on the FIDE stop (ten minutes, no increment). Touch-move is a procedure on that stop: the first piece you take hold of, if it has a legal move, must move.
- The shatranj array is king on d, ferz on e.
- Pass and play turns the board. It does not redraw the pieces upside down.

Names used in the cards: Murray’s *History of Chess*, Ruy López (1561), Staunton, the Milan tournament of 1881, and the founding of FIDE in Paris in 1924. Nothing else is cited.

## Tests

`npm test` checks, for each stop, the moves that distinguish it from its neighbors: ferz and alfil, the pawn double step present and absent, en passant against passar battaglia, ordinary against free castling (including a castle that would give check), stalemate and bare-king results, promotion sets, the fifty-move and repetition draws, and the exact refusal “That pawn cannot jump. The double step is still two centuries away.”

## Not in v1

Online play against a friend. Courier chess and the other 12×8 boards. Dice chaturanga. A clock before the FIDE stop. A continuous year scrubber. Five regional variants at every date. A stronger search.

## Next

A session is already a plain object with no React in it. The next piece of product is a server that relays that session to a second browser. After that: a stronger opponent that does not run on the UI thread, and a closer look at the free-castling manuscripts that disagree with the geometry used here.
