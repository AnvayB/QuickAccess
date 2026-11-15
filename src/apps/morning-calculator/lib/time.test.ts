import { describe, expect, it } from 'vitest'
import { addMinutes, formatMinutesAsClock, nextOccurrence, parseTimeToMinutes, subtractMinutes } from './time'

describe('parseTimeToMinutes', () => {
  it('parses HH:MM from a time input', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('06:30')).toBe(390)
    expect(parseTimeToMinutes('23:59')).toBe(1439)
  })

  it('returns null for empty or malformed input (a cleared time field)', () => {
    expect(parseTimeToMinutes('')).toBeNull()
    expect(parseTimeToMinutes('6:30')).toBeNull()
    expect(parseTimeToMinutes('abc')).toBeNull()
  })
})

describe('midnight wrapping', () => {
  it('subtracts across midnight into the previous day', () => {
    expect(subtractMinutes(30, 60)).toBe(23 * 60 + 30) // 12:30 AM - 1h = 11:30 PM
  })

  it('adds across midnight into the next day', () => {
    expect(addMinutes(23 * 60 + 30, 60)).toBe(30)
  })

  it('handles durations longer than a day', () => {
    expect(subtractMinutes(60, 25 * 60)).toBe(0)
  })
})

describe('formatMinutesAsClock', () => {
  it.each([
    [0, '12:00 AM'],
    [5, '12:05 AM'],
    [12 * 60, '12:00 PM'],
    [12 * 60 + 1, '12:01 PM'],
    [13 * 60 + 5, '1:05 PM'],
    [23 * 60 + 59, '11:59 PM'],
    [-30, '11:30 PM'],
    [24 * 60 + 15, '12:15 AM'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatMinutesAsClock(minutes)).toBe(expected)
  })
})

describe('nextOccurrence', () => {
  const now = new Date(2026, 10, 14, 7, 0, 0)

  it('returns today when the time is still ahead', () => {
    const result = nextOccurrence(9 * 60, now)
    expect(result.getDate()).toBe(14)
    expect(result.getHours()).toBe(9)
  })

  it('rolls to tomorrow when the time has passed', () => {
    const result = nextOccurrence(6 * 60, now)
    expect(result.getDate()).toBe(15)
    expect(result.getHours()).toBe(6)
  })

  it('treats exactly-now as already passed', () => {
    expect(nextOccurrence(7 * 60, now).getDate()).toBe(15)
  })
})
