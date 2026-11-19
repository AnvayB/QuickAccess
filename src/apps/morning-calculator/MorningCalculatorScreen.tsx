import { useEffect, useId, useMemo, useState } from 'react'
import { PageLayout } from '../../shared/components/PageLayout'
import { useMultiSelectFilter } from '../../shared/hooks/useMultiSelectFilter'
import { ActivityChecklist } from './components/ActivityChecklist'
import { BufferSelector } from './components/BufferSelector'
import { CustomActivityForm } from './components/CustomActivityForm'
import { DirectionToggle } from './components/DirectionToggle'
import { ModeToggle } from './components/ModeToggle'
import { ResultCard, type ResultFigure, type ResultRow } from './components/ResultCard'
import { SummaryBar } from './components/SummaryBar'
import { TravelPanel } from './components/TravelPanel'
import { activityLibrary } from './data/activities'
import { loadPreferences, savePreferences } from './lib/preferences'
import { addMinutes, formatMinutesAsClock, parseTimeToMinutes, subtractMinutes } from './lib/time'
import { useInView } from './lib/useInView'
import { useSavedLocations } from './lib/useSavedLocations'
import { useTravelPlan } from './lib/useTravelPlan'
import type { Activity, BufferSelection, Direction, Mode } from './types'

const FIELD =
  'min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white'
const SECTION_HEADING =
  'text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2'

function newCustomId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function MorningCalculatorScreen() {
  const [initialPrefs] = useState(loadPreferences)
  const timeFieldId = useId()

  // Travel is the primary mode; the routine settings below are remembered between visits.
  const [mode, setMode] = useState<Mode>('travel')
  const [direction, setDirection] = useState<Direction>(initialPrefs.direction ?? 'target')
  const [targetTime, setTargetTime] = useState('') // departure (wake-up) or arrival (travel)
  const [alarmTime, setAlarmTime] = useState('')
  const [customActivities, setCustomActivities] = useState<Activity[]>(initialPrefs.customActivities ?? [])
  const [bufferSelection, setBufferSelection] = useState<BufferSelection>(initialPrefs.bufferSelection ?? 15)
  const [customBufferMinutes, setCustomBufferMinutes] = useState(initialPrefs.customBufferMinutes ?? 15)
  const activitySelection = useMultiSelectFilter(initialPrefs.selectedIds)
  // Start the routine section open only when there's nothing remembered to review.
  const [routineStartsOpen] = useState(() => (initialPrefs.selectedIds ?? []).length === 0)

  useEffect(() => {
    savePreferences({
      selectedIds: [...activitySelection.selected],
      customActivities,
      bufferSelection,
      customBufferMinutes,
      direction,
    })
  }, [activitySelection.selected, customActivities, bufferSelection, customBufferMinutes, direction])

  const allActivities = useMemo(() => [...activityLibrary, ...customActivities], [customActivities])

  const selectedActivities = useMemo(
    () => allActivities.filter((a) => activitySelection.isSelected(a.id)),
    [allActivities, activitySelection],
  )

  const totalActivityMinutes = useMemo(
    () => selectedActivities.reduce((sum, a) => sum + a.minutes, 0),
    [selectedActivities],
  )

  const bufferMinutes = bufferSelection === 'custom' ? customBufferMinutes : bufferSelection

  const targetInputMinutes = parseTimeToMinutes(targetTime)
  const alarmInputMinutes = parseTimeToMinutes(alarmTime)

  // Forward: alarm -> start getting ready -> leave/arrive.
  const startGettingReadyForward =
    alarmInputMinutes === null ? null : addMinutes(alarmInputMinutes, bufferMinutes)
  const departureForward =
    startGettingReadyForward === null
      ? null
      : addMinutes(startGettingReadyForward, totalActivityMinutes)

  // In travel mode the traffic lookup needs a single anchor time: the required
  // arrival time when working backward (the hook then solves for the departure
  // time that traffic actually applies to), or the computed departure time when
  // working forward from an alarm.
  const travelAnchorMinutes =
    mode === 'travel' ? (direction === 'alarm' ? departureForward : targetInputMinutes) : null
  const savedLocations = useSavedLocations()
  const travel = useTravelPlan({
    enabled: mode === 'travel',
    anchorMinutes: travelAnchorMinutes,
    anchorKind: direction === 'alarm' ? 'depart-at' : 'arrive-by',
    savedLocations: savedLocations.locations,
  })

  // Backward: leave/arrive -> start getting ready -> alarm.
  const travelDepartureMinutes =
    mode === 'travel' && targetInputMinutes !== null && travel.travelMinutes !== null
      ? subtractMinutes(targetInputMinutes, travel.travelMinutes)
      : null

  const departureMinutes =
    direction === 'alarm' ? departureForward : mode === 'travel' ? travelDepartureMinutes : targetInputMinutes

  const startGettingReadyMinutes =
    direction === 'alarm'
      ? startGettingReadyForward
      : departureMinutes === null
        ? null
        : subtractMinutes(departureMinutes, totalActivityMinutes)

  const alarmMinutes =
    direction === 'alarm'
      ? alarmInputMinutes
      : startGettingReadyMinutes === null
        ? null
        : subtractMinutes(startGettingReadyMinutes, bufferMinutes)

  const arrivalMinutes =
    mode === 'travel'
      ? direction === 'alarm'
        ? departureMinutes !== null && travel.travelMinutes !== null
          ? addMinutes(departureMinutes, travel.travelMinutes)
          : null
        : targetInputMinutes
      : null

  const addCustomActivity = (label: string, minutes: number) => {
    const id = newCustomId()
    const activity: Activity = { id, label, minutes, category: 'Other', isCustom: true }
    setCustomActivities((prev) => [...prev, activity])
    activitySelection.toggle(id)
  }

  const removeCustomActivity = (id: string) => {
    setCustomActivities((prev) => prev.filter((a) => a.id !== id))
    if (activitySelection.isSelected(id)) activitySelection.toggle(id)
  }

  const clock = (minutes: number | null) => (minutes === null ? '—' : formatMinutesAsClock(minutes))
  const departureLabel = clock(departureMinutes)
  const arrivalLabel = clock(arrivalMinutes)
  const alarmLabel = clock(alarmMinutes)
  const startGettingReadyLabel = clock(startGettingReadyMinutes)

  const inputsReady = direction === 'alarm' ? alarmInputMinutes !== null : targetInputMinutes !== null
  // Travel results need a drive time too, otherwise the times would be placeholders.
  const isReady = inputsReady && (mode === 'wake-up' || travel.travelMinutes !== null)

  let emptyMessage: string
  if (mode === 'travel' && !travel.destination.trim()) {
    emptyMessage = 'Choose a destination to see your times.'
  } else if (!inputsReady) {
    emptyMessage =
      direction === 'alarm'
        ? 'Set your alarm time to see when you need to leave.'
        : mode === 'travel'
          ? 'Set an arrival time to see your alarm and departure.'
          : 'Set a departure time to see your alarm time.'
  } else if (travel.status === 'error') {
    emptyMessage = "Couldn't get a drive time — see the message above."
  } else {
    emptyMessage = 'Checking traffic…'
  }

  const driveTimeRow: ResultRow[] = travel.travelText
    ? [
        {
          label: 'Drive time',
          value:
            travel.trafficDelayMinutes !== null && travel.trafficDelayMinutes >= 2
              ? `${travel.travelText} (+${travel.trafficDelayMinutes} traffic)`
              : travel.travelText,
        },
      ]
    : []

  let headline: ResultFigure
  let secondary: ResultFigure | undefined
  let rows: ResultRow[]

  if (mode === 'travel') {
    if (direction === 'target') {
      headline = { label: 'Wake up at', value: alarmLabel }
      secondary = { label: 'Leave by', value: departureLabel }
    } else {
      headline = { label: 'Leave by', value: departureLabel }
      secondary = { label: 'Arrive at', value: arrivalLabel }
    }
    rows = [
      ...(direction === 'alarm' ? [{ label: 'Alarm', value: alarmLabel }] : []),
      { label: 'Wake-up buffer', value: `${bufferMinutes} min` },
      { label: 'Start getting ready', value: startGettingReadyLabel },
      { label: 'Morning routine', value: `${totalActivityMinutes} min` },
      ...driveTimeRow,
      ...(direction === 'target' ? [{ label: 'Arrive by', value: arrivalLabel }] : []),
    ]
  } else {
    headline =
      direction === 'alarm'
        ? { label: "You'll need to leave at", value: departureLabel }
        : { label: 'Set your alarm for', value: alarmLabel }
    rows = [
      ...(direction === 'alarm' ? [{ label: 'Alarm', value: alarmLabel }] : [{ label: 'You need to leave', value: departureLabel }]),
      { label: 'Morning routine', value: `${totalActivityMinutes} min` },
      { label: 'Wake-up buffer', value: `${bufferMinutes} min` },
      { label: 'Start getting ready', value: startGettingReadyLabel },
    ]
  }

  const resultView = useInView<HTMLDivElement>()
  const showSummaryBar = isReady && !resultView.inView

  const timeInputLabel =
    mode === 'travel'
      ? direction === 'target'
        ? 'What time do you need to arrive?'
        : 'What time is your alarm?'
      : direction === 'target'
        ? 'What time do you need to leave the house?'
        : 'What time is your alarm?'
  const timeValue = direction === 'target' ? targetTime : alarmTime
  const onTimeChange = direction === 'target' ? setTargetTime : setAlarmTime

  return (
    <PageLayout title="Morning Calc">
      <div className="mx-auto max-w-md pb-24 lg:max-w-5xl lg:pb-4">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-x-10">
          <section className="flex flex-col gap-5 lg:col-start-1">
            <div className="flex flex-col gap-2">
              <ModeToggle value={mode} onChange={setMode} />
              <DirectionToggle mode={mode} value={direction} onChange={setDirection} />
            </div>

            {mode === 'travel' ? (
              <TravelPanel
                destination={travel.destination}
                onDestinationChange={travel.setDestination}
                savedLocations={savedLocations.locations}
                onSaveLocation={savedLocations.add}
                onRemoveLocation={savedLocations.remove}
                originId={travel.originId}
                onOriginChange={travel.setOriginId}
                day={travel.day}
                onDayChange={travel.setDay}
                anchorMinutes={travelAnchorMinutes}
                trafficModel={travel.trafficModel}
                onTrafficModelChange={travel.setTrafficModel}
                trafficSource={travel.trafficSource}
                timeLabel={timeInputLabel}
                timeValue={timeValue}
                onTimeChange={onTimeChange}
                mapsReady={travel.mapsReady}
                status={travel.status}
                error={travel.error}
              />
            ) : (
              <div>
                <label htmlFor={timeFieldId} className={`block ${SECTION_HEADING}`}>
                  {timeInputLabel}
                </label>
                <input
                  id={timeFieldId}
                  type="time"
                  value={timeValue}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className={FIELD}
                />
              </div>
            )}
          </section>

          {/* Right column on desktop (sticky); directly under the trip inputs on phones. */}
          <div
            ref={resultView.ref}
            className="scroll-mt-20 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          >
            <ResultCard
              isReady={isReady}
              emptyMessage={emptyMessage}
              headline={headline}
              secondary={secondary}
              rows={rows}
              selectedActivities={selectedActivities}
            />
          </div>

          <details open={routineStartsOpen} className="group lg:col-start-1">
            <summary
              className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3
                rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900
                px-4 select-none [&::-webkit-details-marker]:hidden"
            >
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Morning routine</span>
              <span className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                {selectedActivities.length} selected · {totalActivityMinutes} min · {bufferMinutes} min buffer
                <span aria-hidden className="transition-transform group-open:rotate-90">
                  ›
                </span>
              </span>
            </summary>
            <div className="mt-4 flex flex-col gap-5">
              <ActivityChecklist
                customActivities={customActivities}
                isSelected={activitySelection.isSelected}
                onToggle={activitySelection.toggle}
                onRemoveCustom={removeCustomActivity}
              />
              <CustomActivityForm onAdd={addCustomActivity} />
              <BufferSelector
                selection={bufferSelection}
                customMinutes={customBufferMinutes}
                onSelect={setBufferSelection}
                onCustomMinutesChange={setCustomBufferMinutes}
              />
            </div>
          </details>
        </div>
      </div>

      {showSummaryBar && (
        <SummaryBar
          headline={headline}
          secondary={secondary}
          onClick={() => resultView.element?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      )}
    </PageLayout>
  )
}
