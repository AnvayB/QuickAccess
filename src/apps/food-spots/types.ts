export type Status = 'Visited' | 'Not Visited'

export interface FoodSpot {
  id: string
  name: string
  location: string[]
  cuisine: string
  type: string[]
  status: Status
}
