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
| En passant regions, 1500–1850 | Chip **Spain & England**: en passant. Chip **Italy & some German clubs** (id `italy`): passar battaglia. An 1822 translation carried the Italian rule into some German clubs. They did not share one code. No castling yet. López in 1561 still scored a bare king as a win; this board does not. |
| Castling split, 1500–1840 | Chip **Spain, France & England**: ordinary castling and en passant. Chip **Italy, 1700**: free castling and passar battaglia, one tap. |
| Tournament chess, 1850–1924 | En passant on, ordinary castling, promote to any piece, stalemate draw, fifty-move draw, king / king+knight / king+bishop draw. No clock, no repetition, no touch-move. Descriptive notation. |
| FIDE, 1924–now | The tournament game, plus a 10-minute clock, threefold repetition applied by the board, touch-move, and algebraic notation as the primary sheet. |

The filmstrip is a float from 0 to 6. Dragging previews. Releasing eases to the nearest stop in about a quarter of a second, and the board and the card finish that same blend. Between stops only one caption and one rule card are mounted: the outgoing text fades out, and the incoming text fades in after the midpoint. In shatranj and medieval the king stands on the d-file and the ferz on the e-file. Those icons scale away before anything replaces them. The king then steps to the e-file, the queen scales in on the d-file, and bishops scale in where the alfils stood. From queen’s chess on, the queen is on d1 and d8 and the king is on e1 and e8. The king’s leap is drawn only in the gaps between Queen’s chess, the en passant stop, and castling. It is absent while the strip rests on a stop. Every caption says it is not a legal move yet. On a phone the seven short stop names sit in a wrapping line under the strip. The address bar follows the nearest stop and, where the stop has one, the region chip. An unknown `stop` id stays in the bar until you move the strip, and a banner names it.

The rule card stays under the board until twenty plies (ten moves), then collapses to a Rules button.

## What the engine does, and what this code does

Fairy-Stockfish was read, not vendored. The `ffish` JavaScript binding exposes a board: legal moves, FEN, and a result. It does not expose search. The variant file documents that flexible castling is unsupported. Built-in shatranj matches the array used here (king on the d-file, ferz on the e-file, alfil on the bishop’s squares) and treats a bare king and stalemate as losses, which this core also does.

Because search is missing from that binding, and because Italian free castling cannot be written as a Stockfish variant, **every rule in the running app is this repository’s own code**: `src/engine` generates moves, detects the result, explains an illegal drop, and searches. The opponent is that same search, run in a Web Worker: iterative deepening, transposition table, capture and killer ordering, and quiescence. Easy, Medium, and Hard change the time budget and how willing it is to pick a close second. It is not Stockfish. A full Fairy-Stockfish WASM binary was not added; it still cannot play free castling, so one engine covers every stop.

Perft checks that are standard chess, where the rules coincide, are locked: queen’s chess (no castling, no en passant yet) is 20 and 400 at depths 1 and 2. FIDE is 20, 400, and 8902. Shatranj and medieval at the start are 16 (eight pawns, four knights, four alfil jumps).

## Notation

Shatranj and medieval use a descriptive sheet (`d2–d3` is `P-K3`). Algebraic is the secondary view. From queen’s chess through the tournament stop, the primary sheet is English descriptive (`e4` is `P-K4`). FIDE’s primary sheet is algebraic. Ordinary castling is `O-O` / `O-O-O`. A free-castling landing that is not those two squares is written as the king’s and the rook’s squares. En passant on the descriptive sheet is marked `e.p.`

## Historical simplifications

These are choices, stated on the cards, not silent ones.

- Medieval stalemate was not agreed. This board scores the unsettled case a draw, and says so.
- From queen’s chess through the castling split, stalemate is scored a win for the side that gives it, so the tournament stop has a real change. The card calls that a simplification. England and France had already moved toward a draw, and Staunton printed a draw in 1847, inside the castling stop’s dates.
- Queen’s chess has the double step and not yet en passant. The spec separates those stops.
- No castling until the castling stop. The medieval king’s leap is not legal.
- Promotion is immediate: ferz only, then queen only, then any piece at the tournament stop. The older delay (the new ferz must move once) is not implemented.
- Italian free castling is a reconstruction, and the geometry was left as it is. The king and rook are unmoved, the span between them is empty, the king is not in check, both pieces land on that span including the squares they leave, the king moves at least two files and finishes on the far side of the rook, and the king’s path is not attacked. The move itself may not give check. Ordinary castling may, and that contrast is the lesson the stop is for. The manuscripts disagree on the rest. The Modenese laws allow any square between the king and the rook, inclusive, so a one-square king move is possible in a plain reading, and they also forbid the king or the rook from landing on a square where it attacks an enemy man. This board does not apply that stricter landing rule. Changing the generator would blur the check contrast the card is teaching, and the sources already named do not settle one diagram. The card says both of those things.
- The fifty-move rule on the tournament stop is the modern automatic draw: one hundred half-moves, no claim. López in 1561 already required a mate inside fifty moves in some endgames. London 1883 is the usual marker for the automatic draw, not London 1851. Checkmate and stalemate are decided before that draw, and before threefold repetition, so a mate on the hundredth half-move is still a win.
- Threefold repetition is applied by the board on the FIDE stop, not by a claim. The triple-occurrence draw, like the double clock, is London 1883 tournament practice. Touch-move is older still, in the eighteenth-century Italian laws. Paris 1924 is when FIDE was founded, not the year those three customs began. The board turns them on together at that stop.
- Insufficient material is king, king and knight, or king and bishop, and only from the tournament stop.
- Shatranj does not use a 70-move limit.
- Clocks exist only on the FIDE stop (ten minutes, no increment). Touch-move is a procedure on that stop: the first piece you take hold of, if it has a legal move, must move.
- The shatranj array is king on d, ferz on e. From queen’s chess on, the queen is on d and the king is on e.
- Pass and play turns the board. It does not redraw the pieces upside down.

Names used in the cards: Murray’s *History of Chess*, Ruy López (1561), Staunton (a draw printed in 1847), the eighteenth-century Italian laws, the Modenese laws, an 1822 translation of the Italian rules, London 1883, the Milan tournament of 1881, and the founding of FIDE in Paris in 1924. Nothing else is cited.

## Tests

`npm test` checks, for each stop, the moves that distinguish it from its neighbors: ferz and alfil, the pawn double step present and absent, en passant against passar battaglia, ordinary against free castling (including a castle that would give check), stalemate and bare-king results, promotion sets, the fifty-move and repetition draws, and the exact refusal “That pawn cannot jump. The double step is still two centuries away.” The QA lines are locked the same way: mate on a fifty-move clock, each wrong castle sentence, a plain diagonal step that is not a capture in passing, a pinned double step, the ferz file slide, the kingside preview squares, and the leap hidden on a stop. A refusal is chosen in order: piece geometry, then the path, then a special-move precondition, then the king’s safety. The sentence is that rule’s sentence.

## Not in v1

Online play against a friend. Courier chess and the other 12×8 boards. Dice chaturanga. A clock before the FIDE stop. A continuous year scrubber. Five regional variants at every date. A stronger search.

## Next

A session is already a plain object with no React in it. The next piece of product is a server that relays that session to a second browser. After that, a closer look at the free-castling manuscripts that disagree with the geometry used here.
