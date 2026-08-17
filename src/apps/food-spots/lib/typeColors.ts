const TYPE_COLORS: Record<string, string> = {
  Boba: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'Ice Cream': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Restaurant: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Cafe/Bakery': 'bg-stone-200 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300',
  Store: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  'Bar/Brewery': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
}

const DEFAULT_TYPE_COLOR =
  'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'

export function typeColorFor(type: string): string {
  return TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR
}
