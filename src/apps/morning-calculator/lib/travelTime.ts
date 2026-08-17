import type { Coordinates } from './geolocation'

export interface TravelDuration {
  minutes: number
  text: string
}

export function getTravelDuration(
  origin: Coordinates,
  destination: string,
  departureTime: Date,
): Promise<TravelDuration> {
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService()
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime,
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (response, status) => {
        if (status !== 'OK' || !response) {
          reject(new Error('Could not look up travel time'))
          return
        }
        const element = response.rows[0]?.elements[0]
        if (!element || element.status !== 'OK') {
          reject(new Error('No driving route found to that destination'))
          return
        }
        const duration = element.duration_in_traffic ?? element.duration
        resolve({ minutes: Math.ceil(duration.value / 60), text: duration.text })
      },
    )
  })
}
