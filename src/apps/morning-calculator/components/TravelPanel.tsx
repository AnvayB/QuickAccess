import type { TravelStatus } from '../lib/useTravelPlan'
import { DestinationInput } from './DestinationInput'

interface TravelPanelProps {
  destination: string
  onDestinationChange: (value: string) => void
  arrivalTime: string
  onArrivalTimeChange: (value: string) => void
  mapsReady: boolean
  status: TravelStatus
  error: string | null
  travelText: string | null
  departureLabel: string | null
}

export function TravelPanel({
  destination,
  onDestinationChange,
  arrivalTime,
  onArrivalTimeChange,
  mapsReady,
  status,
  error,
  travelText,
  departureLabel,
}: TravelPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
          Where are you going?
        </h3>
        <DestinationInput value={destination} onChange={onDestinationChange} mapsReady={mapsReady} />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
          What time do you need to arrive?
        </h3>
        <input
          type="time"
          value={arrivalTime}
          onChange={(e) => onArrivalTimeChange(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white"
        />
      </div>

      {status === 'loading' && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Checking traffic…</p>
      )}
      {status === 'error' && error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      {status === 'idle' && travelText && departureLabel && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Drive time: <span className="font-medium text-neutral-900 dark:text-white">{travelText}</span>
          {' — '}leave by{' '}
          <span className="font-medium text-neutral-900 dark:text-white">{departureLabel}</span>
        </p>
      )}
    </div>
  )
}
