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

/** 'target' = user knows the leave/arrival time and we compute backward to the alarm.
 *  'alarm' = user knows their alarm time and we compute forward to leave/arrival time. */
export type Direction = 'target' | 'alarm'
