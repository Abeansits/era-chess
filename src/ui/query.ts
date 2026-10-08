import { eras, type EraId } from '../rules/eras'

export function readMuseumQuery(search: string): {
  index: number
  chipId: string | null
  unknownStop: string | null
} {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const stop = params.get('stop')
  const found = eras.findIndex((era) => era.id === stop)
  const unknownStop = stop && found < 0 ? stop : null
  const index = found >= 0 ? found : 0
  const era = eras[index]
  const chip = params.get('chip')
  const chipId = chip && era.chips.some((item) => item.id === chip) ? chip : null
  return { index, chipId, unknownStop }
}

export function museumSearch(eraId: EraId, chipId: string): string {
  const era = eras.find((item) => item.id === eraId)
  const params = new URLSearchParams()
  params.set('stop', eraId)
  if (era && era.chips.length > 0 && chipId) params.set('chip', chipId)
  return `?${params.toString()}`
}
