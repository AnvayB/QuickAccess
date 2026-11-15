import type { Activity, BufferSelection, Direction } from '../types'
import { readStored, writeStored } from './storage'

export interface Preferences {
  selectedIds: string[]
  customActivities: Activity[]
  bufferSelection: BufferSelection
  customBufferMinutes: number
  direction: Direction
}

const STORAGE_KEY = 'morning-calc:prefs'
const BUFFER_PRESETS = [0, 5, 10, 15, 20, 30]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Reads saved routine settings; anything missing or malformed is simply omitted. */
export function loadPreferences(): Partial<Preferences> {
  const raw = readStored(STORAGE_KEY)
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!isRecord(parsed)) return {}

  const result: Partial<Preferences> = {}
  if (Array.isArray(parsed.selectedIds)) {
    result.selectedIds = parsed.selectedIds.filter((id): id is string => typeof id === 'string')
  }
  if (Array.isArray(parsed.customActivities)) {
    result.customActivities = parsed.customActivities.flatMap((a): Activity[] =>
      isRecord(a) && typeof a.id === 'string' && typeof a.label === 'string' && typeof a.minutes === 'number' && a.minutes > 0
        ? [{ id: a.id, label: a.label, minutes: a.minutes, category: 'Other', isCustom: true }]
        : [],
    )
  }
  if (parsed.bufferSelection === 'custom' || BUFFER_PRESETS.includes(parsed.bufferSelection as number)) {
    result.bufferSelection = parsed.bufferSelection as BufferSelection
  }
  if (typeof parsed.customBufferMinutes === 'number' && parsed.customBufferMinutes >= 0) {
    result.customBufferMinutes = parsed.customBufferMinutes
  }
  if (parsed.direction === 'target' || parsed.direction === 'alarm') {
    result.direction = parsed.direction
  }
  return result
}

export function savePreferences(prefs: Preferences): void {
  writeStored(STORAGE_KEY, JSON.stringify(prefs))
}
