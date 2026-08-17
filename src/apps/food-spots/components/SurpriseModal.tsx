import { isMobileDevice } from '../../../shared/lib/device'
import { mapsUrlFor } from '../lib/maps'
import { typeColorFor } from '../lib/typeColors'
import type { FoodSpot } from '../types'

interface SurpriseModalProps {
  spot: FoodSpot
  onPickAgain: () => void
  onClose: () => void
}

export function SurpriseModal({ spot, onPickAgain, onClose }: SurpriseModalProps) {
  // On mobile, a same-tab navigation lets iOS/Android hand off to the
  // Google Maps app via universal links; target="_blank" would suppress that.
  const mobile = isMobileDevice()

  return (
    <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full sm:max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
          You should try...
        </p>
        <a
          href={mapsUrlFor(spot)}
          {...(mobile ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className="block hover:underline"
        >
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{spot.name}</h2>
        </a>
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
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onPickAgain}
            className="flex-1 rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium min-h-11"
          >
            Pick again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-neutral-100 dark:bg-neutral-800
              text-neutral-700 dark:text-neutral-200 py-2.5 text-sm font-medium min-h-11"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
