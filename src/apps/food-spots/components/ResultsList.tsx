import type { FoodSpot } from '../types'
import { SpotCard } from './SpotCard'

export function ResultsList({ spots }: { spots: FoodSpot[] }) {
  if (spots.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <p>No spots match your filters.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {spots.map((spot) => (
        <SpotCard key={spot.id} spot={spot} />
      ))}
    </div>
  )
}
