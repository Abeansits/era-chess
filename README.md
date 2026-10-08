# Era Chess

Drag a century, then play that century’s chess. Seven stops run from shatranj to FIDE. Regional arguments — en passant against passar battaglia, ordinary castling against Italian free castling — are chips inside a stop, not extra ticks on the axis.

The rules are one core and one config record per stop. A chip overrides a few fields. The move generator, the historical refusal, and the opponent are all in this repository. Fairy-Stockfish was checked and not shipped: its JavaScript build does not search, and it cannot express free castling. See [REPORT.md](REPORT.md).

## Run

```bash
npm install
npm test
npm run dev
```

The dev server is [http://127.0.0.1:4179/era-chess/](http://127.0.0.1:4179/era-chess/).

`npm run build` typechecks and writes a static site to `dist/`. The Vite base is `/era-chess/`, which is the path GitHub Pages uses for this repository. `npm run preview` serves the build on the same port, under that base.

The public site is [https://abeansits.github.io/era-chess/](https://abeansits.github.io/era-chess/). A push to `main` runs the tests, builds, and deploys `dist/` with the official GitHub Pages actions.

A stop can be opened directly: [https://abeansits.github.io/era-chess/?stop=shatranj](https://abeansits.github.io/era-chess/?stop=shatranj), and the same way for `queen`, `passant`, `castling`, `tournament`, `fide`, or `medieval`.

## Play

Pass and play uses one device and turns the board toward the side to move. Play the engine keeps your color. Online play is not in this version. Game state lives in `src/game/session.ts`, with no React imports, so a later server can take the same session.
