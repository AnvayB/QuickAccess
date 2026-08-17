import { isMobileDevice } from '../../../shared/lib/device'
import { mapsUrlFor } from '../lib/maps'
import { typeColorFor } from '../lib/typeColors'
import type { FoodSpot } from '../types'

export function SpotCard({ spot }: { spot: FoodSpot }) {
  // On mobile, a same-tab navigation lets iOS/Android hand off to the
  // Google Maps app via universal links; target="_blank" would suppress that.
  const mobile = isMobileDevice()

  return (
    <a
      href={mapsUrlFor(spot)}
      {...(mobile ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      className="block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4
        active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-neutral-900 dark:text-white">{spot.name}</h3>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
            spot.status === 'Visited'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
        >
          {spot.status}
        </span>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        {spot.location.join(' · ')} — {spot.cuisine}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {spot.type.map((t) => (
          <span
            key={t}
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColorFor(t)}`}
          >
            {t}
          </span>
        ))}
      </div>
    </a>
  )
}
