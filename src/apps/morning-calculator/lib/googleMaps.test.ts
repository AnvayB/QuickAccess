import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const setOptions = vi.fn()
const importLibrary = vi.fn()
vi.mock('@googlemaps/js-api-loader', () => ({ setOptions, importLibrary }))

// The module keeps load state, so each test gets a fresh copy.
async function freshLoader() {
  vi.resetModules()
  return (await import('./googleMaps')).loadGoogleMaps
}

beforeEach(() => {
  setOptions.mockReset()
  importLibrary.mockReset()
  importLibrary.mockResolvedValue({})
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('loadGoogleMaps', () => {
  it('configures the loader with the API key and loads the routes and places libraries', async () => {
    const loadGoogleMaps = await freshLoader()
    await loadGoogleMaps()
    expect(setOptions).toHaveBeenCalledTimes(1)
    expect(setOptions).toHaveBeenCalledWith(expect.objectContaining({ key: 'test-key' }))
    expect(importLibrary).toHaveBeenCalledWith('routes')
    expect(importLibrary).toHaveBeenCalledWith('places')
  })

  it('only loads once however many components ask for it', async () => {
    const loadGoogleMaps = await freshLoader()
    await Promise.all([loadGoogleMaps(), loadGoogleMaps()])
    await loadGoogleMaps()
    expect(setOptions).toHaveBeenCalledTimes(1)
    expect(importLibrary).toHaveBeenCalledTimes(2)
  })

  it('explains a missing API key and never calls Google', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
    const loadGoogleMaps = await freshLoader()
    await expect(loadGoogleMaps()).rejects.toThrow('Missing VITE_GOOGLE_MAPS_API_KEY')
    expect(setOptions).not.toHaveBeenCalled()
    expect(importLibrary).not.toHaveBeenCalled()
  })

  it('can retry after a failed load without re-configuring the loader', async () => {
    importLibrary.mockRejectedValueOnce(new Error('network down')).mockResolvedValue({})
    const loadGoogleMaps = await freshLoader()
    await expect(loadGoogleMaps()).rejects.toThrow('network down')
    await Promise.resolve() // let the failure clear the cached promise

    await expect(loadGoogleMaps()).resolves.toBeUndefined()
    expect(setOptions).toHaveBeenCalledTimes(1) // calling it twice would only log a warning
  })
})
