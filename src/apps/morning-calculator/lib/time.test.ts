import { describe, expect, it } from 'vitest'
import {
  addMinutes,
  dayOptions,
  describeDay,
  formatMinutesAsClock,
  nextOccurrence,
  parseTimeToMinutes,
  resolveTripDate,
  subtractMinutes,
} from './time'

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

describe('choosing the day of the trip', () => {
  // Saturday 11:06 PM, the situation where "9:30 AM" silently meant Sunday.
  const saturdayNight = new Date(2026, 10, 14, 23, 6)

  describe('resolveTripDate', () => {
    it("'auto' is the next occurrence of that time", () => {
      const result = resolveTripDate(9 * 60 + 30, 'auto', saturdayNight)
      expect([result.getMonth(), result.getDate(), result.getHours(), result.getMinutes()]).toEqual([10, 15, 9, 30])
    })

    it('an explicit date puts the time on that day', () => {
      const result = resolveTripDate(9 * 60 + 30, '2026-11-16', saturdayNight) // the Monday commute
      expect([result.getMonth(), result.getDate(), result.getHours(), result.getMinutes()]).toEqual([10, 16, 9, 30])
    })

    it('can be today even if that time has passed (the caller decides what to do)', () => {
      const result = resolveTripDate(9 * 60, '2026-11-14', saturdayNight)
      expect(result.getTime()).toBeLessThan(saturdayNight.getTime())
    })

    it('falls back to auto for a malformed date', () => {
      expect(resolveTripDate(9 * 60, 'garbage', saturdayNight)).toEqual(nextOccurrence(9 * 60, saturdayNight))
    })
  })

  describe('describeDay', () => {
    it('says Today and Tomorrow, otherwise the weekday and date', () => {
      expect(describeDay(new Date(2026, 10, 14, 9), saturdayNight)).toBe('Today')
      expect(describeDay(new Date(2026, 10, 15, 9), saturdayNight)).toBe('Tomorrow')
      expect(describeDay(new Date(2026, 10, 16, 9), saturdayNight)).toBe('Mon, Nov 16')
    })
  })

  describe('dayOptions', () => {
    it('offers "Next" plus the coming week, starting today', () => {
      const options = dayOptions(saturdayNight)
      expect(options).toHaveLength(8)
      expect(options[0]).toEqual({ value: 'auto', label: 'Next' })
      expect(options[1]).toEqual({ value: '2026-11-14', label: 'Today · Sat, Nov 14' })
      expect(options[2]).toEqual({ value: '2026-11-15', label: 'Tomorrow · Sun, Nov 15' })
      expect(options[3]).toEqual({ value: '2026-11-16', label: 'Mon, Nov 16' })
      expect(options.at(-1)?.value).toBe('2026-11-20')
    })

    it('spells out which day "Next" means once a time is known', () => {
      expect(dayOptions(saturdayNight, 9 * 60 + 30)[0].label).toBe('Next · Sun, Nov 15')
    })

    it('rolls correctly across a month and year boundary', () => {
      const options = dayOptions(new Date(2026, 11, 29, 8))
      expect(options.map((o) => o.value)).toContain('2027-01-02')
    })
  })
})
