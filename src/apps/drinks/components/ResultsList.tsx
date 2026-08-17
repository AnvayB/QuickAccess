import type { Drink } from '../types'
import { DrinkCard } from './DrinkCard'

export function ResultsList({ drinks }: { drinks: Drink[] }) {
  if (drinks.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <p>No drinks match your filters.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {drinks.map((drink) => (
        <DrinkCard key={drink.id} drink={drink} />
      ))}
    </div>
  )
}
