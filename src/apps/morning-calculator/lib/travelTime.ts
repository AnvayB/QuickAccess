import type { Coordinates } from './geolocation'

export type Origin = Coordinates | string

export interface TravelEstimate {
  /** Drive time including predicted traffic, rounded up. */
  minutes: number
  /** Drive time with no traffic, rounded up. */
  staticMinutes: number
}

/** Which end of the trip the user's time refers to. */
export type TravelAnchor =
  | { kind: 'depart-at'; at: Date }
  | { kind: 'arrive-by'; at: Date }

const MIN_LEAD_MS = 60_000 // Routes API rejects departure times in the past
const CACHE_TTL_MS = 5 * 60_000
const CACHE_BUCKET_MS = 5 * 60_000
const MAX_ITERATIONS = 4

const cache = new Map<string, { value: TravelEstimate; at: number }>()

function originKey(origin: Origin): string {
  return typeof origin === 'string' ? origin : `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`
}

async function queryDuration(origin: Origin, destination: string, departAt: Date): Promise<TravelEstimate> {
  const departureTime = new Date(Math.max(departAt.getTime(), Date.now() + MIN_LEAD_MS))
  const key = [originKey(origin), destination, Math.round(departureTime.getTime() / CACHE_BUCKET_MS)].join('|')
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value

  let route
  try {
    const { Route } = await google.maps.importLibrary('routes')
    const { routes } = await Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
      departureTime,
      fields: ['durationMillis', 'staticDurationMillis'],
    })
    route = routes?.[0]
  } catch (err) {
    console.error('Routes API request failed', err)
    const detail = err instanceof Error && err.message ? ` (${err.message})` : ''
    throw new Error(`Could not look up travel time${detail}`)
  }

  if (!route || route.durationMillis == null) {
    throw new Error('No driving route found to that destination')
  }

  const value: TravelEstimate = {
    minutes: Math.ceil(route.durationMillis / 60_000),
    staticMinutes: Math.ceil((route.staticDurationMillis ?? route.durationMillis) / 60_000),
  }
  cache.set(key, { value, at: Date.now() })
  return value
}

/**
 * Traffic-aware drive time for the trip described by `anchor`.
 *
 * 'depart-at': we know when the drive starts, so one lookup at that time is exact.
 *
 * 'arrive-by': we know when we must arrive, but traffic depends on when we
 * *depart*, which depends on the drive time. Resolve that by iterating: guess
 * a duration, look up traffic for the implied departure, and repeat until the
 * duration stops changing (usually 2 lookups).
 */
export async function estimateTravel(
  origin: Origin,
  destination: string,
  anchor: TravelAnchor,
): Promise<TravelEstimate> {
  if (anchor.kind === 'depart-at') return queryDuration(origin, destination, anchor.at)

  let guessMs = 30 * 60_000
  let result: TravelEstimate
  let iterations = 0
  do {
    result = await queryDuration(origin, destination, new Date(anchor.at.getTime() - guessMs))
    const nextGuessMs = result.minutes * 60_000
    const converged = Math.abs(nextGuessMs - guessMs) <= 60_000
    guessMs = nextGuessMs
    if (converged) break
    iterations++
  } while (iterations < MAX_ITERATIONS)

  return result
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}
