import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

describe('board geometry', () => {
  it('keeps preview, play, and strip boards an even 8×8 of squares', () => {
    expect(css).toContain('aspect-ratio: 1 / 1')
    expect(css).toContain('grid-template-columns: repeat(8, minmax(0, 1fr))')
    expect(css).toContain('grid-template-rows: repeat(8, minmax(0, 1fr))')
    expect(css).toMatch(/\.board-grid\s*\{[^}]*position:\s*absolute/)
    expect(css).toMatch(/\.mini-board\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/)
  })

  it('keeps a finger on the board from scrolling the page', () => {
    expect(css).toMatch(/\.play-board-wrap,\s*\n\.board-aspect,\s*\n\.board-grid,\s*\n\.sq,\s*\n\.mini-board,\s*\n\.mini-sq\s*\{[^}]*touch-action:\s*none/)
  })
})
