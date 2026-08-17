import type { FoodSpot } from '../types'

export function mapsUrlFor(spot: FoodSpot): string {
  const query = [spot.name, ...spot.location].join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
