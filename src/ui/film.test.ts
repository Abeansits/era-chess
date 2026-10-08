import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { eras } from '../rules/eras'
import { FILM_STOPS, PHONE_FILM, filmIndex, filmLabelWidth, labelsCrowd, phoneAxisWidth, tickCenters, tickPercent } from './film'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

describe('the filmstrip rests on a stop', () => {
  it('has exactly the seven stops, each with its own year', () => {
    expect(eras).toHaveLength(FILM_STOPS)
    expect(eras.map((stop) => stop.mark)).toEqual(['c. 700', 'c. 1200', '1475', '1561', '1700', '1851', '1924'])
    expect(new Set(eras.map((stop) => stop.id)).size).toBe(FILM_STOPS)
  })

  it('puts the handle on that stop’s tick once the finger is up', () => {
    for (let stop = 0; stop < FILM_STOPS; stop++) {
      expect(filmIndex(stop, false)).toBe(stop)
      expect(filmIndex(stop + 0.49, false)).toBe(stop)
      expect(tickPercent(filmIndex(stop, false))).toBe(tickPercent(stop))
    }
    expect(filmIndex(3.7, false)).toBe(4)
    expect(tickPercent(filmIndex(3.7, false))).toBeCloseTo((4 / 6) * 100)
    expect(filmIndex(3.7, true)).toBeCloseTo(3.7)
  })

  it('keeps the seven names from crowding a 390px phone', () => {
    const axis = phoneAxisWidth(390)
    const centers = tickCenters(axis)
    const widths = eras.map((stop) => Math.max(filmLabelWidth(stop.mark), filmLabelWidth(stop.short)))
    expect(centers).toHaveLength(7)
    expect(labelsCrowd(centers, widths)).toBe(false)
    expect(centers[0]).toBe(0)
    expect(centers[6]).toBeCloseTo(axis)
    expect(centers[4] - centers[3]).toBeCloseTo(axis / 6)
    const widest = Math.max(...widths)
    expect(PHONE_FILM.bodyPad + PHONE_FILM.axisMargin).toBeGreaterThanOrEqual(widest / 2)
  })

  it('uses that phone inset in the stylesheet, and rests the handle with the snapped index', () => {
    const phone = css.slice(css.indexOf('@media (max-width: 860px)'))
    expect(phone).toContain('padding-left: 12px')
    expect(phone).toContain('padding-right: 12px')
    expect(phone).toContain('padding-left: 8px')
    expect(phone).toContain('padding-right: 8px')
    expect(phone).toContain('margin-left: 20px')
    expect(phone).toContain('margin-right: 20px')
    expect(phone).not.toContain('.film-legend { display: flex')
    expect(css).not.toContain('.film-stop.is-start')
    expect(css).toContain('touch-action: none')
  })
})
