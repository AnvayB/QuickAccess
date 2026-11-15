import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSavedLocations } from './useSavedLocations'

const KEY = 'morning-calc:saved-locations'

describe('useSavedLocations', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useSavedLocations())
    expect(result.current.locations).toEqual([])
  })

  it('adds a place and trims whitespace', () => {
    const { result } = renderHook(() => useSavedLocations())
    act(() => result.current.add('  Gym  ', '  12 Fit St  '))
    expect(result.current.locations).toHaveLength(1)
    expect(result.current.locations[0]).toMatchObject({ label: 'Gym', address: '12 Fit St' })
  })

  it('ignores a blank name or address', () => {
    const { result } = renderHook(() => useSavedLocations())
    act(() => result.current.add('   ', '12 Fit St'))
    act(() => result.current.add('Gym', '   '))
    expect(result.current.locations).toEqual([])
  })

  it('gives every place a unique id', () => {
    const { result } = renderHook(() => useSavedLocations())
    act(() => {
      result.current.add('A', 'addr a')
      result.current.add('B', 'addr b')
    })
    const [a, b] = result.current.locations
    expect(a.id).not.toBe(b.id)
  })

  it('removes only the chosen place', () => {
    const { result } = renderHook(() => useSavedLocations())
    act(() => {
      result.current.add('A', 'addr a')
      result.current.add('B', 'addr b')
    })
    act(() => result.current.remove(result.current.locations[0].id))
    expect(result.current.locations.map((l) => l.label)).toEqual(['B'])
  })

  it('persists across reloads', () => {
    const first = renderHook(() => useSavedLocations())
    act(() => first.result.current.add('Home', '1 Home St'))
    first.unmount()

    const second = renderHook(() => useSavedLocations())
    expect(second.result.current.locations).toMatchObject([{ label: 'Home', address: '1 Home St' }])
  })

  it('survives corrupted or malformed storage', () => {
    localStorage.setItem(KEY, '{broken')
    expect(renderHook(() => useSavedLocations()).result.current.locations).toEqual([])

    localStorage.setItem(KEY, JSON.stringify([{ id: 'x', label: 'Ok', address: 'a' }, { id: 1 }, 'junk']))
    expect(renderHook(() => useSavedLocations()).result.current.locations).toEqual([
      { id: 'x', label: 'Ok', address: 'a' },
    ])
  })
})
