import { useEffect, useState } from 'react'
import { getCurrentPosition, type Coordinates } from './geolocation'
import { loadGoogleMaps } from './googleMaps'
import { nextOccurrence, parseTimeToMinutes } from './time'
import { getTravelDuration } from './travelTime'

export type TravelStatus = 'idle' | 'loading' | 'error'

const DEBOUNCE_MS = 600

export function useTravelPlan(enabled: boolean) {
  const [arrivalTime, setArrivalTime] = useState('')
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
    if (!enabled || !mapsReady || !origin || !destination.trim()) {
      setTravelMinutes(null)
      setTravelText(null)
      return
    }
    const arrivalMinutes = parseTimeToMinutes(arrivalTime)
    if (arrivalMinutes === null) {
      setTravelMinutes(null)
      setTravelText(null)
      return
    }

    const timer = setTimeout(() => {
      setStatus('loading')
      setError(null)
      getTravelDuration(origin, destination, nextOccurrence(arrivalMinutes))
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
  }, [enabled, mapsReady, origin, destination, arrivalTime])

  return {
    arrivalTime,
    setArrivalTime,
    destination,
    setDestination,
    mapsReady,
    status,
    error,
    travelMinutes,
    travelText,
  }
}
