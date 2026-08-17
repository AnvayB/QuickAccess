import { rankingColorFor, typeColorFor } from '../lib/typeColors'
import type { Drink } from '../types'

export function DrinkCard({ drink }: { drink: Drink }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-neutral-900 dark:text-white">{drink.name}</h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5
            rounded-full ${rankingColorFor(drink.ranking)}`}
        >
          ★ {drink.ranking}
        </span>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        {drink.caffeineMg} mg caffeine · {drink.sugarG} g sugar
      </p>
      {drink.notes && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 italic">
          "{drink.notes}"
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColorFor(drink.type)}`}
        >
          {drink.type}
        </span>
      </div>
    </div>
  )
}
