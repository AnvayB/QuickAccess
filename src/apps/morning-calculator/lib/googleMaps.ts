let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof google !== 'undefined' && google.maps) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY — add it to your .env file'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })

  return loadPromise
}
