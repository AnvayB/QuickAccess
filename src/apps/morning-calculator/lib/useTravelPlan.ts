import { useEffect, useState } from 'react'
import { getCurrentPosition, type Coordinates } from './geolocation'
import { loadGoogleMaps } from './googleMaps'
import { nextOccurrence } from './time'
import { getTravelDuration } from './travelTime'

export type TravelStatus = 'idle' | 'loading' | 'error'

const DEBOUNCE_MS = 600

/**
 * referenceMinutes anchors the traffic lookup: the arrival time when the arrival
 * time is known, or the (already computed) departure time when working forward
 * from an alarm time.
 */
export function useTravelPlan(enabled: boolean, referenceMinutes: number | null) {
  const [destination, setDestination] = useState('')
  const [origin, setOrigin] = useState<Coordinates | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [status, setStatus] = useState<TravelStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [travelMinutes, setTravelMinutes] = useState<number | null>(null)
  const [travelText, setTravelText] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setMapsReady(true)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setStatus('error')
        }
      })

    getCurrentPosition()
      .then((coords) => {
        if (!cancelled) setOrigin(coords)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !mapsReady || !origin || !destination.trim() || referenceMinutes === null) {
      setTravelMinutes(null)
      setTravelText(null)
      return
    }

    const timer = setTimeout(() => {
      setStatus('loading')
      setError(null)
      getTravelDuration(origin, destination, nextOccurrence(referenceMinutes))
        .then((result) => {
          setTravelMinutes(result.minutes)
          setTravelText(result.text)
          setStatus('idle')
        })
        .catch((err: Error) => {
          setTravelMinutes(null)
          setTravelText(null)
          setError(err.message)
          setStatus('error')
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [enabled, mapsReady, origin, destination, referenceMinutes])

  return {
    destination,
    setDestination,
    mapsReady,
    status,
    error,
    travelMinutes,
    travelText,
  }
}
