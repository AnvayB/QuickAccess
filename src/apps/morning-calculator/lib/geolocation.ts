export interface Coordinates {
  lat: number
  lng: number
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new Error(error.message || 'Could not get your location')),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
