import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let loadPromise: Promise<void> | null = null
let optionsSet = false

/**
 * Loads the Maps JS API through Google's official loader, which installs the global
 * `google.maps.importLibrary()` that `travelTime.ts` relies on, then pulls in the two
 * libraries this app uses: `routes` (Routes API, traffic-aware drive times) and
 * `places` (Places API (New), address autocomplete). The older Distance Matrix /
 * legacy Places APIs are not available to new Google Cloud projects, so we don't use them.
 */
export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY — add it to your .env file')
    }
    // setOptions may only be called once; later calls just log a warning.
    if (!optionsSet) {
      setOptions({ key: apiKey, v: 'weekly' })
      optionsSet = true
    }
    await Promise.all([importLibrary('routes'), importLibrary('places')])
  })()

  // Allow a retry (e.g. after fixing the key) instead of caching the failure.
  loadPromise.catch(() => {
    loadPromise = null
  })

  return loadPromise
}
