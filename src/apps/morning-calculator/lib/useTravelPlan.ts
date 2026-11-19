import { useEffect, useMemo, useState } from 'react'
import { getCurrentPosition, type Coordinates } from './geolocation'
import { loadGoogleMaps } from './googleMaps'
import { readStored, writeStored } from './storage'
import { resolveTripDate, type DayChoice } from './time'
import { estimateTravel, formatDuration, type Origin, type TrafficModel, type TravelEstimate } from './travelTime'
import type { SavedLocation } from './useSavedLocations'

export type TravelStatus = 'idle' | 'loading' | 'error'
export type AnchorKind = 'arrive-by' | 'depart-at'

/** Where the shown drive time comes from: live conditions (leaving soon) or a forecast. */
export type TrafficSource = { kind: 'live'; updatedAt: Date } | { kind: 'forecast'; day: Date }

export const CURRENT_LOCATION = 'current'
/** Leaving within this long counts as "live"; further out is a forecast. */
export const LIVE_WINDOW_MS = 60 * 60_000
/** How often live traffic is re-checked while you're about to leave. */
export const LIVE_REFRESH_MS = 3 * 60_000

const ORIGIN_STORAGE_KEY = 'morning-calc:origin'
const TRAFFIC_MODEL_STORAGE_KEY = 'morning-calc:traffic-model'
const DEBOUNCE_MS = 600
const PAST_MESSAGE = 'That time has already passed today — pick a later day.'

interface TravelPlanOptions {
  enabled: boolean
  /**
   * Time of day that anchors the traffic lookup, interpreted per anchorKind: the required
   * arrival time ('arrive-by') or the (already computed) departure time ('depart-at').
   */
  anchorMinutes: number | null
  anchorKind: AnchorKind
  savedLocations: SavedLocation[]
}

interface EstimateResult {
  tripKey: string
  value: TravelEstimate
  /** The moment the lookup was anchored to. */
  anchorAt: Date
  fetchedAt: Date
}

export function useTravelPlan({ enabled, anchorMinutes, anchorKind, savedLocations }: TravelPlanOptions) {
  const [destination, setDestination] = useState('')
  const [day, setDay] = useState<DayChoice>('auto')
  const [storedOriginId, setStoredOriginId] = useState(() => readStored(ORIGIN_STORAGE_KEY) ?? CURRENT_LOCATION)
  const [trafficModel, setStoredTrafficModel] = useState<TrafficModel>(() =>
    readStored(TRAFFIC_MODEL_STORAGE_KEY) === 'pessimistic' ? 'pessimistic' : 'bestguess',
  )
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [coordsError, setCoordsError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [estimateResult, setEstimateResult] = useState<EstimateResult | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // A removed saved location silently falls back to the current location.
  const originId =
    storedOriginId === CURRENT_LOCATION || savedLocations.some((l) => l.id === storedOriginId)
      ? storedOriginId
      : CURRENT_LOCATION
  const usingCurrentLocation = originId === CURRENT_LOCATION

  const setOriginId = (id: string) => {
    setStoredOriginId(id)
    writeStored(ORIGIN_STORAGE_KEY, id)
  }

  const setTrafficModel = (model: TrafficModel) => {
    setStoredTrafficModel(model)
    writeStored(TRAFFIC_MODEL_STORAGE_KEY, model)
  }

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setMapsReady(true)
      })
      .catch((err: Error) => {
        if (!cancelled) setMapsError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  // Only ask for location permission when "Current location" is the chosen origin.
  useEffect(() => {
    if (!enabled || !usingCurrentLocation || coords) return
    let cancelled = false
    setCoordsError(null)
    getCurrentPosition()
      .then((c) => {
        if (!cancelled) setCoords(c)
      })
      .catch((err: Error) => {
        if (!cancelled) setCoordsError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, usingCurrentLocation, coords])

  const savedOriginAddress = savedLocations.find((l) => l.id === originId)?.address ?? null
  const origin: Origin | null = useMemo(
    () => (usingCurrentLocation ? coords : savedOriginAddress),
    [usingCurrentLocation, coords, savedOriginAddress],
  )

  // Identifies the trip an estimate was computed for. When anything that changes the answer
  // materially changes (place, day, traffic model) the old estimate is hidden immediately
  // rather than shown beside the wrong settings.
  const tripKey = origin
    ? [typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`, destination.trim(), day, trafficModel].join('|')
    : ''
  const current = estimateResult?.tripKey === tripKey ? estimateResult : null
  const estimate = current?.value ?? null

  useEffect(() => {
    if (!enabled || !mapsReady || !origin || !destination.trim() || anchorMinutes === null) {
      setEstimateResult(null)
      setRouteError(null)
      setLoading(false)
      return
    }

    // Google can only forecast the future, so a time that has already passed today is an error
    // rather than something to silently answer with "right now" traffic.
    const anchorAt = resolveTripDate(anchorMinutes, day)
    if (anchorAt.getTime() <= Date.now()) {
      setEstimateResult(null)
      setRouteError(PAST_MESSAGE)
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      setRouteError(null)
      estimateTravel(origin, destination, { kind: anchorKind, at: anchorAt }, { trafficModel, fresh: refreshTick > 0 })
        .then((value) => {
          if (cancelled) return
          setEstimateResult({ tripKey, value, anchorAt, fetchedAt: new Date() })
          setLoading(false)
        })
        .catch((err: Error) => {
          if (cancelled) return
          setEstimateResult(null)
          setRouteError(err.message)
          setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [enabled, mapsReady, origin, destination, anchorMinutes, anchorKind, day, trafficModel, tripKey, refreshTick])

  let trafficSource: TrafficSource | null = null
  if (current) {
    const departureAt =
      anchorKind === 'depart-at' ? current.anchorAt : new Date(current.anchorAt.getTime() - current.value.minutes * 60_000)
    trafficSource =
      departureAt.getTime() - Date.now() <= LIVE_WINDOW_MS
        ? { kind: 'live', updatedAt: current.fetchedAt }
        : { kind: 'forecast', day: departureAt }
  }

  // While you're about to leave, keep re-checking so a new accident or clearing shows up.
  const isLive = trafficSource?.kind === 'live'
  useEffect(() => {
    if (!isLive) return
    const id = setInterval(() => setRefreshTick((tick) => tick + 1), LIVE_REFRESH_MS)
    return () => clearInterval(id)
  }, [isLive])

  const error = mapsError ?? (usingCurrentLocation ? coordsError : null) ?? routeError
  const status: TravelStatus = error ? 'error' : loading ? 'loading' : 'idle'
  const trafficDelayMinutes = estimate ? estimate.minutes - estimate.staticMinutes : null

  return {
    destination,
    setDestination,
    day,
    setDay,
    originId,
    setOriginId,
    trafficModel,
    setTrafficModel,
    mapsReady,
    status,
    error,
    travelMinutes: estimate?.minutes ?? null,
    travelText: estimate ? formatDuration(estimate.minutes) : null,
    trafficDelayMinutes,
    trafficSource,
  }
}
