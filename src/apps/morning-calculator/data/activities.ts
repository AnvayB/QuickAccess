import type { Activity } from '../types'

export const activityLibrary: Activity[] = [
  // Basic Hygiene
  { id: 'brush-teeth', label: 'Brush teeth', minutes: 3, category: 'Basic Hygiene' },
  { id: 'shower', label: 'Shower', minutes: 30, category: 'Basic Hygiene' },
  { id: 'post-shower', label: 'Post-shower routine (lotion)', minutes: 10, category: 'Basic Hygiene' },
  { id: 'shave', label: 'Shave (cheeks and neck)', minutes: 10, category: 'Basic Hygiene' },
  { id: 'trim-beard', label: 'Trim beard', minutes: 5, category: 'Basic Hygiene' },
  { id: 'wash-face', label: 'Wash face / skincare', minutes: 5, category: 'Basic Hygiene' },
  { id: 'hair-grooming', label: 'Hair / grooming', minutes: 10, category: 'Basic Hygiene' },
  { id: 'cut-nails', label: 'Cut nails', minutes: 10, category: 'Basic Hygiene' },
  { id: 'bathroom', label: 'Use bathroom', minutes: 30, category: 'Basic Hygiene' },

  // Getting Ready
  { id: 'get-dressed', label: 'Get dressed', minutes: 10, category: 'Getting Ready' },

  // Breakfast & Drinks
  { id: 'eat-breakfast', label: 'Eat breakfast', minutes: 10, category: 'Breakfast & Drinks' },
  { id: 'prepare-breakfast', label: 'Prepare breakfast', minutes: 10, category: 'Breakfast & Drinks' },
  { id: 'clean-shaker', label: 'Clean shaker bottle', minutes: 10, category: 'Breakfast & Drinks' },
  { id: 'basic-shake', label: 'Make basic protein shake', minutes: 5, category: 'Breakfast & Drinks' },
  { id: 'blender-shake', label: 'Make blender/mixer-based protein shake', minutes: 15, category: 'Breakfast & Drinks' },
  { id: 'pack-food', label: 'Pack food / lunch', minutes: 10, category: 'Breakfast & Drinks' },

  // Other
  { id: 'stretching', label: 'Morning stretching', minutes: 5, category: 'Other' },
]

export const activityCategories: Activity['category'][] = [
  'Basic Hygiene',
  'Getting Ready',
  'Breakfast & Drinks',
  'Other',
]
