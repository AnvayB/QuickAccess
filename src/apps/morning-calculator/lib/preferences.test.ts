import { describe, expect, it } from 'vitest'
import { loadPreferences, savePreferences } from './preferences'

const KEY = 'morning-calc:prefs'

describe('preferences', () => {
  it('round-trips saved settings', () => {
    savePreferences({
      selectedIds: ['shower', 'custom-1'],
      customActivities: [{ id: 'custom-1', label: 'Walk dog', minutes: 12, category: 'Other', isCustom: true }],
      bufferSelection: 'custom',
      customBufferMinutes: 7,
      direction: 'alarm',
    })
    expect(loadPreferences()).toEqual({
      selectedIds: ['shower', 'custom-1'],
      customActivities: [{ id: 'custom-1', label: 'Walk dog', minutes: 12, category: 'Other', isCustom: true }],
      bufferSelection: 'custom',
      customBufferMinutes: 7,
      direction: 'alarm',
    })
  })

  it('returns nothing when there are no saved settings', () => {
    expect(loadPreferences()).toEqual({})
  })

  it.each(['{not json', 'null', '42', '"text"', '[]'])('survives corrupted storage: %s', (raw) => {
    localStorage.setItem(KEY, raw)
    expect(() => loadPreferences()).not.toThrow()
    expect(loadPreferences()).toEqual({})
  })

  it('drops invalid fields but keeps valid ones', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        selectedIds: ['shower', 7, null],
        customActivities: [
          { id: 'ok', label: 'Fine', minutes: 5 },
          { id: 'zero', label: 'Zero minutes', minutes: 0 },
          { label: 'No id', minutes: 5 },
          'junk',
        ],
        bufferSelection: 17, // not an offered preset
        customBufferMinutes: -5,
        direction: 'sideways',
      }),
    )
    const prefs = loadPreferences()
    expect(prefs.selectedIds).toEqual(['shower'])
    expect(prefs.customActivities).toEqual([{ id: 'ok', label: 'Fine', minutes: 5, category: 'Other', isCustom: true }])
    expect(prefs.bufferSelection).toBeUndefined()
    expect(prefs.customBufferMinutes).toBeUndefined()
    expect(prefs.direction).toBeUndefined()
  })

  it('accepts a zero-minute buffer ("None")', () => {
    localStorage.setItem(KEY, JSON.stringify({ bufferSelection: 0 }))
    expect(loadPreferences().bufferSelection).toBe(0)
  })
})
