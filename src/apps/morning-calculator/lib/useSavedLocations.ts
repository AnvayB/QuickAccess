import { useCallback, useEffect, useState } from 'react'
import { readStored, writeStored } from './storage'

export interface SavedLocation {
  id: string
  label: string
  address: string
}

const STORAGE_KEY = 'morning-calc:saved-locations'

function load(): SavedLocation[] {
  const raw = readStored(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is SavedLocation =>
        typeof item?.id === 'string' && typeof item?.label === 'string' && typeof item?.address === 'string',
    )
  } catch {
    return []
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/** Named places (Home, Gym, Office…) kept in this browser's localStorage. */
export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>(load)

  useEffect(() => {
    writeStored(STORAGE_KEY, JSON.stringify(locations))
  }, [locations])

  const add = useCallback((label: string, address: string) => {
    const trimmedLabel = label.trim()
    const trimmedAddress = address.trim()
    if (!trimmedLabel || !trimmedAddress) return
    setLocations((prev) => [...prev, { id: newId(), label: trimmedLabel, address: trimmedAddress }])
  }, [])

  const remove = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return { locations, add, remove }
}
