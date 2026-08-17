const TYPE_COLORS: Record<string, string> = {
  'Energy Drink': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'Hydration Drink': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  Kombucha: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Soda: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
}

const DEFAULT_TYPE_COLOR =
  'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'

export function typeColorFor(type: string): string {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR
}

export function rankingColorFor(ranking: number): string {
  if (ranking >= 10) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  if (ranking >= 8) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
  if (ranking >= 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
}
