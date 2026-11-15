import { useEffect, useMemo, useState } from 'react'
import { getCurrentPosition, type Coordinates } from './geolocation'
import { loadGoogleMaps } from './googleMaps'
import { readStored, writeStored } from './storage'
import { nextOccurrence } from './time'
import { estimateTravel, formatDuration, type Origin, type TravelEstimate } from './travelTime'
import type { SavedLocation } from './useSavedLocations'

export type TravelStatus = 'idle' | 'loading' | 'error'
export type AnchorKind = 'arrive-by' | 'depart-at'

export const CURRENT_LOCATION = 'current'

const ORIGIN_STORAGE_KEY = 'morning-calc:origin'
const DEBOUNCE_MS = 600

/**
 * anchorMinutes is the time of day that anchors the traffic lookup, interpreted
 * per anchorKind: the required arrival time ('arrive-by') or the (already
 * computed) departure time ('depart-at').
 */
export function useTravelPlan(
  enabled: boolean,
  anchorMinutes: number | null,
  anchorKind: AnchorKind,
  savedLocations: SavedLocation[],
) {
  const [destination, setDestination] = useState('')
  const [storedOriginId, setStoredOriginId] = useState(() => readStored(ORIGIN_STORAGE_KEY) ?? CURRENT_LOCATION)
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [coordsError, setCoordsError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [estimateResult, setEstimateResult] = useState<{ tripKey: string; value: TravelEstimate } | null>(null)

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

  // Identifies the trip an estimate was computed for. When the origin or destination changes
  // the old estimate is hidden immediately rather than shown beside the wrong place.
  const tripKey = origin ? `${typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`}|${destination.trim()}` : ''
  const estimate = estimateResult?.tripKey === tripKey ? estimateResult.value : null

  useEffect(() => {
    if (!enabled || !mapsReady || !origin || !destination.trim() || anchorMinutes === null) {
      setEstimateResult(null)
      setRouteError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      setRouteError(null)
      estimateTravel(origin, destination, { kind: anchorKind, at: nextOccurrence(anchorMinutes) })
        .then((result) => {
          if (cancelled) return
          setEstimateResult({ tripKey, value: result })
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
  }, [enabled, mapsReady, origin, destination, anchorMinutes, anchorKind, tripKey])

  const error = mapsError ?? (usingCurrentLocation ? coordsError : null) ?? routeError
  const status: TravelStatus = error ? 'error' : loading ? 'loading' : 'idle'
  const trafficDelayMinutes = estimate ? estimate.minutes - estimate.staticMinutes : null

  return {
    destination,
    setDestination,
    originId,
    setOriginId,
    mapsReady,
    status,
    error,
    travelMinutes: estimate?.minutes ?? null,
    travelText: estimate ? formatDuration(estimate.minutes) : null,
    trafficDelayMinutes,
  }
}
