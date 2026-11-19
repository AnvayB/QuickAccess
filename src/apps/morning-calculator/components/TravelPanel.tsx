import { useId, useMemo } from 'react'
import { dayOptions, describeDay, type DayChoice } from '../lib/time'
import type { TrafficModel } from '../lib/travelTime'
import type { SavedLocation } from '../lib/useSavedLocations'
import { CURRENT_LOCATION, LIVE_REFRESH_MS, type TrafficSource, type TravelStatus } from '../lib/useTravelPlan'
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
  day: DayChoice
  onDayChange: (day: DayChoice) => void
  /** Time of day being planned; lets the "Next" option say which day it means. */
  anchorMinutes: number | null
  trafficModel: TrafficModel
  onTrafficModelChange: (model: TrafficModel) => void
  trafficSource: TrafficSource | null
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

function clockTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** One line saying whether the drive time is live traffic or a forecast, and for when. */
export function trafficNote(source: TrafficSource, model: TrafficModel): string {
  if (source.kind === 'live') {
    return `Live traffic · updated ${clockTime(source.updatedAt)} · rechecks every ${LIVE_REFRESH_MS / 60_000} min`
  }
  const kind = model === 'pessimistic' ? 'Cautious' : 'Typical'
  return `${kind} traffic forecast for ${describeDay(source.day)}${
    describeDay(source.day) === 'Today' || describeDay(source.day) === 'Tomorrow'
      ? ` (${source.day.toLocaleDateString('en-US', { weekday: 'long' })})`
      : ''
  }`
}

export function TravelPanel({
  destination,
  onDestinationChange,
  savedLocations,
  onSaveLocation,
  onRemoveLocation,
  originId,
  onOriginChange,
  day,
  onDayChange,
  anchorMinutes,
  trafficModel,
  onTrafficModelChange,
  trafficSource,
  timeLabel,
  timeValue,
  onTimeChange,
  mapsReady,
  status,
  error,
}: TravelPanelProps) {
  const destinationId = useId()
  const timeId = useId()
  const dayId = useId()
  const originFieldId = useId()
  const trafficId = useId()
  const days = useMemo(() => dayOptions(new Date(), anchorMinutes), [anchorMinutes])

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

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label htmlFor={timeId} className={`block ${SECTION_HEADING}`}>
            {timeLabel}
          </label>
          <input id={timeId} type="time" value={timeValue} onChange={(e) => onTimeChange(e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor={dayId} className={`block ${SECTION_HEADING}`}>
            Day
          </label>
          <select id={dayId} value={day} onChange={(e) => onDayChange(e.target.value)} className={FIELD}>
            {days.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
        <div>
          <label htmlFor={trafficId} className={`block ${SECTION_HEADING}`}>
            Traffic estimate
          </label>
          <select
            id={trafficId}
            value={trafficModel}
            onChange={(e) => onTrafficModelChange(e.target.value as TrafficModel)}
            className={FIELD}
          >
            <option value="bestguess">Typical</option>
            <option value="pessimistic">Cautious</option>
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
      {status === 'idle' && trafficSource && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{trafficNote(trafficSource, trafficModel)}</p>
      )}
    </div>
  )
}
