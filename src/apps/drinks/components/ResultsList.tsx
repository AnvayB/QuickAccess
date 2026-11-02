import type { Drink } from '../types'
import { DrinkCard } from './DrinkCard'

export function ResultsList({ drinks, onEdit }: { drinks: Drink[]; onEdit: (drink: Drink) => void }) {
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
        <DrinkCard key={drink.id} drink={drink} onEdit={() => onEdit(drink)} />
      ))}
    </div>
  )
}
