export type SortOption = 'ranking' | 'caffeine' | 'sugar'

export interface Drink {
  id: string
  name: string
  ranking: number
  caffeineMg: number
  sugarG: number
  notes?: string
  type: string
}
