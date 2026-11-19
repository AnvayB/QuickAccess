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

/** 'auto' = the next time this clock time occurs; otherwise a local date as YYYY-MM-DD. */
export type DayChoice = 'auto' | (string & {})

const SHORT_DAY: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }

function toLocalDateString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** The moment a time of day falls on for the chosen day. Invalid dates fall back to 'auto'. */
export function resolveTripDate(minutesSinceMidnight: number, choice: DayChoice, now = new Date()): Date {
  const match = choice === 'auto' ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(choice)
  if (!match) return nextOccurrence(minutesSinceMidnight, now)
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Math.floor(minutesSinceMidnight / 60),
    minutesSinceMidnight % 60,
  )
}

/** "Today", "Tomorrow", or "Mon, Nov 16". */
export function describeDay(date: Date, now = new Date()): string {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', SHORT_DAY)
}

/** Choices for the day picker: "Next" (auto) followed by the coming week. */
export function dayOptions(now = new Date(), minutesSinceMidnight: number | null = null) {
  const nextLabel =
    minutesSinceMidnight === null
      ? 'Next'
      : `Next · ${nextOccurrence(minutesSinceMidnight, now).toLocaleDateString('en-US', SHORT_DAY)}`
  const options: { value: DayChoice; label: string }[] = [{ value: 'auto', label: nextLabel }]
  for (let i = 0; i < 7; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const text = day.toLocaleDateString('en-US', SHORT_DAY)
    options.push({
      value: toLocalDateString(day),
      label: i === 0 ? `Today · ${text}` : i === 1 ? `Tomorrow · ${text}` : text,
    })
  }
  return options
}
