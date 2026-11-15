import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { estimateTravel, formatDuration } from './travelTime'

const MIN = 60_000
const NOW = new Date(2026, 10, 14, 6, 0, 0)

function at(hours: number, minutes = 0, dayOffset = 0): Date {
  return new Date(2026, 10, 14 + dayOffset, hours, minutes, 0)
}

type Request = { departureTime: Date; origin: unknown; destination: string; routingPreference: string; fields: string[] }

function stubRoutes(compute: (req: Request) => { durationMillis: number | null; staticDurationMillis?: number } | 'none') {
  const computeRoutes = vi.fn(async (req: Request) => {
    const result = compute(req)
    return { routes: result === 'none' ? [] : [result] }
  })
  vi.stubGlobal('google', { maps: { importLibrary: async () => ({ Route: { computeRoutes } }) } })
  return computeRoutes
}

// The module caches lookups, so every test uses its own destination to stay independent.
let destinationCounter = 0
const uniqueDestination = () => `Destination ${destinationCounter++}`

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('estimateTravel — depart-at', () => {
  it('looks up traffic at the departure time with a single request', async () => {
    const compute = stubRoutes(() => ({ durationMillis: 25 * MIN, staticDurationMillis: 18 * MIN }))
    const departAt = at(7, 30)

    const result = await estimateTravel({ lat: 1, lng: 2 }, uniqueDestination(), { kind: 'depart-at', at: departAt })

    expect(compute).toHaveBeenCalledTimes(1)
    expect(compute.mock.calls[0][0].departureTime).toEqual(departAt)
    expect(result).toEqual({ minutes: 25, staticMinutes: 18 })
  })

  it('requests traffic-aware routing and only the duration fields', async () => {
    const compute = stubRoutes(() => ({ durationMillis: MIN }))
    await estimateTravel('1 Main St', uniqueDestination(), { kind: 'depart-at', at: at(8) })
    const request = compute.mock.calls[0][0]
    expect(request.routingPreference).toBe('TRAFFIC_AWARE_OPTIMAL')
    expect(request.fields).toEqual(['durationMillis', 'staticDurationMillis'])
  })

  it('rounds partial minutes up so we never tell the user to leave too late', async () => {
    stubRoutes(() => ({ durationMillis: 20 * MIN + 1000, staticDurationMillis: 15 * MIN + 1000 }))
    const result = await estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })
    expect(result).toEqual({ minutes: 21, staticMinutes: 16 })
  })

  it('falls back to the traffic duration when no static duration is returned', async () => {
    stubRoutes(() => ({ durationMillis: 20 * MIN }))
    const result = await estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })
    expect(result.staticMinutes).toBe(20)
  })

  it('never sends a departure time in the past (the Routes API rejects it)', async () => {
    const compute = stubRoutes(() => ({ durationMillis: 10 * MIN }))
    await estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(5) }) // an hour ago
    expect(compute.mock.calls[0][0].departureTime.getTime()).toBeGreaterThan(NOW.getTime())
  })
})

describe('estimateTravel — arrive-by', () => {
  it('looks up traffic for when you would actually leave, not for the arrival time', async () => {
    // Heavy traffic (40 min) for anyone leaving after 8:10, light (20 min) before that.
    const compute = stubRoutes((req) => ({
      durationMillis: (req.departureTime.getTime() >= at(8, 10).getTime() ? 40 : 20) * MIN,
    }))

    const result = await estimateTravel('A', uniqueDestination(), { kind: 'arrive-by', at: at(9) })

    // Settles on leaving ~8:20 with a 40 min drive, and never queried "departing at 9:00".
    expect(result.minutes).toBe(40)
    const departures = compute.mock.calls.map(([req]) => req.departureTime.getTime())
    expect(departures).not.toContain(at(9).getTime())
    expect(departures.at(-1)).toBe(at(8, 20).getTime())
  })

  it('stops after one extra lookup once the drive time stops changing', async () => {
    const compute = stubRoutes(() => ({ durationMillis: 30 * MIN }))
    await estimateTravel('A', uniqueDestination(), { kind: 'arrive-by', at: at(9) })
    expect(compute).toHaveBeenCalledTimes(1) // initial 30 min guess was already right
  })

  it('always terminates, even if traffic oscillates between two values', async () => {
    let call = 0
    const compute = stubRoutes(() => ({ durationMillis: (call++ % 2 === 0 ? 20 : 50) * MIN }))
    const result = await estimateTravel('A', uniqueDestination(), { kind: 'arrive-by', at: at(9) })
    expect(compute.mock.calls.length).toBeLessThanOrEqual(4)
    expect(result.minutes).toBeGreaterThan(0)
  })

  it('works when the arrival is tomorrow morning and departure is still in the future', async () => {
    const compute = stubRoutes(() => ({ durationMillis: 30 * MIN }))
    await estimateTravel('A', uniqueDestination(), { kind: 'arrive-by', at: at(7, 0, 1) })
    expect(compute.mock.calls[0][0].departureTime).toEqual(at(6, 30, 1))
  })
})

describe('estimateTravel — failures and caching', () => {
  it('reports when there is no driving route', async () => {
    stubRoutes(() => 'none')
    await expect(estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })).rejects.toThrow(
      'No driving route found',
    )
  })

  it('reports a route with no duration as no route', async () => {
    stubRoutes(() => ({ durationMillis: null }))
    await expect(estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })).rejects.toThrow(
      'No driving route found',
    )
  })

  it('surfaces API errors (e.g. API not enabled) with their detail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('google', {
      maps: {
        importLibrary: async () => ({
          Route: {
            computeRoutes: async () => {
              throw new Error('Routes API has not been enabled')
            },
          },
        }),
      },
    })
    await expect(estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })).rejects.toThrow(
      /Could not look up travel time.*Routes API has not been enabled/,
    )
  })

  it('reuses a recent identical lookup instead of paying for another request', async () => {
    const compute = stubRoutes(() => ({ durationMillis: 10 * MIN }))
    const destination = uniqueDestination()
    await estimateTravel('A', destination, { kind: 'depart-at', at: at(8) })
    await estimateTravel('A', destination, { kind: 'depart-at', at: at(8) })
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('does not reuse a lookup for a different destination or origin', async () => {
    const compute = stubRoutes(() => ({ durationMillis: 10 * MIN }))
    await estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })
    await estimateTravel('A', uniqueDestination(), { kind: 'depart-at', at: at(8) })
    await estimateTravel('B', uniqueDestination(), { kind: 'depart-at', at: at(8) })
    expect(compute).toHaveBeenCalledTimes(3)
  })
})

describe('formatDuration', () => {
  it.each([
    [5, '5 min'],
    [59, '59 min'],
    [60, '1 hr'],
    [65, '1 hr 5 min'],
    [135, '2 hr 15 min'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})
