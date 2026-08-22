const MINUTES_PER_DAY = 24 * 60

export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours * 60 + minutes
}

export function subtractMinutes(minutesSinceMidnight: number, minutesToSubtract: number): number {
  return ((minutesSinceMidnight - minutesToSubtract) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

export function addMinutes(minutesSinceMidnight: number, minutesToAdd: number): number {
  return ((minutesSinceMidnight + minutesToAdd) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

export function formatMinutesAsClock(minutesSinceMidnight: number): string {
  const wrapped = ((minutesSinceMidnight % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours24 = Math.floor(wrapped / 60)
  const minutes = wrapped % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

/** Next future Date matching this time-of-day (today if still ahead, otherwise tomorrow). */
export function nextOccurrence(minutesSinceMidnight: number, from = new Date()): Date {
  const result = new Date(from)
  result.setHours(Math.floor(minutesSinceMidnight / 60), minutesSinceMidnight % 60, 0, 0)
  if (result.getTime() <= from.getTime()) {
    result.setDate(result.getDate() + 1)
  }
  return result
}
