let loadPromise: Promise<void> | null = null

function injectScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&v=weekly`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

/**
 * Loads the Maps JS bootstrap plus the two libraries this app uses:
 * `routes` (Routes API, traffic-aware drive times) and `places` (Places API (New),
 * address autocomplete). The older Distance Matrix / legacy Places APIs are not
 * available to new Google Cloud projects, so we don't use them.
 */
export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY — add it to your .env file')
    }
    if (typeof google === 'undefined' || !google.maps?.importLibrary) {
      await injectScript(apiKey)
    }
    await Promise.all([google.maps.importLibrary('routes'), google.maps.importLibrary('places')])
  })()

  // Allow a retry (e.g. after fixing the key) instead of caching the failure.
  loadPromise.catch(() => {
    loadPromise = null
  })

  return loadPromise
}
