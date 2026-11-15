import { useId } from 'react'
import type { SavedLocation } from '../lib/useSavedLocations'
import { CURRENT_LOCATION, type TravelStatus } from '../lib/useTravelPlan'
import { DestinationInput } from './DestinationInput'
import { SavedLocations } from './SavedLocations'

interface TravelPanelProps {
  destination: string
  onDestinationChange: (value: string) => void
  savedLocations: SavedLocation[]
  onSaveLocation: (label: string, address: string) => void
  onRemoveLocation: (id: string) => void
  originId: string
  onOriginChange: (id: string) => void
  timeLabel: string
  timeValue: string
  onTimeChange: (value: string) => void
  mapsReady: boolean
  status: TravelStatus
  error: string | null
}

const SECTION_HEADING =
  'text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2'
const FIELD =
  'min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white'

export function TravelPanel({
  destination,
  onDestinationChange,
  savedLocations,
  onSaveLocation,
  onRemoveLocation,
  originId,
  onOriginChange,
  timeLabel,
  timeValue,
  onTimeChange,
  mapsReady,
  status,
  error,
}: TravelPanelProps) {
  const destinationId = useId()
  const timeId = useId()
  const originFieldId = useId()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor={destinationId} className={`block ${SECTION_HEADING}`}>
          Where are you going?
        </label>
        <DestinationInput id={destinationId} value={destination} onChange={onDestinationChange} mapsReady={mapsReady} />
        <SavedLocations
          locations={savedLocations}
          currentAddress={destination}
          onPick={onDestinationChange}
          onSave={onSaveLocation}
          onRemove={onRemoveLocation}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={timeId} className={`block ${SECTION_HEADING}`}>
            {timeLabel}
          </label>
          <input
            id={timeId}
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={originFieldId} className={`block ${SECTION_HEADING}`}>
            Leaving from
          </label>
          <select id={originFieldId} value={originId} onChange={(e) => onOriginChange(e.target.value)} className={FIELD}>
            <option value={CURRENT_LOCATION}>Current location</option>
            {savedLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
          Checking traffic…
        </p>
      )}
      {status === 'error' && error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
