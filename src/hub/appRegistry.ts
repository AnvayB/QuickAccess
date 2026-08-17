export interface AppRegistryEntry {
  path: string
  label: string
  description: string
  icon: string
}

// Add an entry here whenever a new mini-app route is added.
export const appRegistry: AppRegistryEntry[] = [
  {
    path: '/food-spots',
    label: 'Food Spots',
    description: 'Browse and filter Bay Area food & drink spots',
    icon: '🍜',
  },
  {
    path: '/drinks',
    label: 'Drinks',
    description: 'Browse and filter ranked energy drinks & more',
    icon: '🥤',
  },
  {
    path: '/morning-calculator',
    label: 'Morning Calculator',
    description: 'Work out what time to set your alarm',
    icon: '⏰',
  },
]
