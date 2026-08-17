export type ActivityCategory = 'Basic Hygiene' | 'Getting Ready' | 'Breakfast & Drinks' | 'Other'

export interface Activity {
  id: string
  label: string
  minutes: number
  category: ActivityCategory
  isCustom?: boolean
}

export type BufferPreset = 0 | 5 | 10 | 15 | 20 | 30

export type BufferSelection = BufferPreset | 'custom'

export type Mode = 'wake-up' | 'travel'
