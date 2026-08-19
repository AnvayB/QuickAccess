import { useMemo, useState } from 'react'
import { PageLayout } from '../../shared/components/PageLayout'
import { useMultiSelectFilter } from '../../shared/hooks/useMultiSelectFilter'
import { ActivityChecklist } from './components/ActivityChecklist'
import { BufferSelector } from './components/BufferSelector'
import { CustomActivityForm } from './components/CustomActivityForm'
import { DirectionToggle } from './components/DirectionToggle'
import { ModeToggle } from './components/ModeToggle'
import { ResultCard, type ResultRow } from './components/ResultCard'
import { TravelPanel } from './components/TravelPanel'
import { activityLibrary } from './data/activities'
import { addMinutes, formatMinutesAsClock, parseTimeToMinutes, subtractMinutes } from './lib/time'
import { useTravelPlan } from './lib/useTravelPlan'
import type { Activity, BufferSelection, Direction, Mode } from './types'

let customIdCounter = 0

export function MorningCalculatorScreen() {
  const [mode, setMode] = useState<Mode>('wake-up')
  const [direction, setDirection] = useState<Direction>('target')
  const [targetTime, setTargetTime] = useState('') // departure (wake-up) or arrival (travel)
  const [alarmTime, setAlarmTime] = useState('')
  const [customActivities, setCustomActivities] = useState<Activity[]>([])
  const [bufferSelection, setBufferSelection] = useState<BufferSelection>(15)
  const [customBufferMinutes, setCustomBufferMinutes] = useState(15)
  const activitySelection = useMultiSelectFilter()

  const allActivities = useMemo(
    () => [...activityLibrary, ...customActivities],
    [customActivities],
  )

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

  // In travel mode the traffic lookup needs a single anchor time: the known
  // arrival time when working backward, or the computed departure time when
  // working forward from an alarm.
  const travelReferenceMinutes =
    mode === 'travel' ? (direction === 'alarm' ? departureForward : targetInputMinutes) : null
  const travel = useTravelPlan(mode === 'travel', travelReferenceMinutes)

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
    const id = `custom-${customIdCounter++}`
    const activity: Activity = { id, label, minutes, category: 'Other', isCustom: true }
    setCustomActivities((prev) => [...prev, activity])
    activitySelection.toggle(id)
  }

  const removeCustomActivity = (id: string) => {
    setCustomActivities((prev) => prev.filter((a) => a.id !== id))
    if (activitySelection.isSelected(id)) activitySelection.toggle(id)
  }

  const departureLabel = departureMinutes === null ? '—' : formatMinutesAsClock(departureMinutes)
  const arrivalLabel = arrivalMinutes === null ? '—' : formatMinutesAsClock(arrivalMinutes)
  const alarmLabel = alarmMinutes === null ? '—' : formatMinutesAsClock(alarmMinutes)
  const startGettingReadyLabel =
    startGettingReadyMinutes === null ? '—' : formatMinutesAsClock(startGettingReadyMinutes)

  const isReady = direction === 'alarm' ? alarmInputMinutes !== null : targetInputMinutes !== null
  const emptyMessage =
    direction === 'alarm'
      ? 'Set your alarm time to see when you need to leave.'
      : mode === 'travel'
        ? 'Set an arrival time to see your alarm time.'
        : 'Set a departure time to see your alarm time.'

  const headlineLabel =
    direction === 'alarm' ? (mode === 'travel' ? "You'll arrive at" : "You'll need to leave at") : 'Set your alarm for'
  const headlineValue = direction === 'alarm' ? (mode === 'travel' ? arrivalLabel : departureLabel) : alarmLabel

  const rows: ResultRow[] = [
    ...(direction === 'alarm' ? [{ label: 'Alarm', value: alarmLabel }] : []),
    ...(mode === 'travel' && direction === 'target' ? [{ label: 'You need to arrive', value: arrivalLabel }] : []),
    ...(mode === 'travel' && direction === 'alarm' ? [{ label: 'You need to leave', value: departureLabel }] : []),
    ...(mode === 'wake-up' && direction === 'target'
      ? [{ label: 'You need to leave', value: departureLabel }]
      : []),
    { label: 'Morning routine', value: `${totalActivityMinutes} min` },
    { label: 'Wake-up buffer', value: `${bufferMinutes} min` },
    { label: 'Start getting ready', value: startGettingReadyLabel },
  ]

  return (
    <PageLayout
      title="Morning Calc"
      headerRight={
        <div className="flex items-center gap-2">
          <ModeToggle value={mode} onChange={setMode} />
          <DirectionToggle value={direction} onChange={setDirection} />
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {mode === 'wake-up' ? (
          direction === 'target' ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                What time do you need to leave the house?
              </h3>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700
                  bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white"
              />
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                What time is your alarm?
              </h3>
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700
                  bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white"
              />
            </div>
          )
        ) : (
          <TravelPanel
            destination={travel.destination}
            onDestinationChange={travel.setDestination}
            timeLabel={direction === 'target' ? 'What time do you need to arrive?' : 'What time is your alarm?'}
            timeValue={direction === 'target' ? targetTime : alarmTime}
            onTimeChange={direction === 'target' ? setTargetTime : setAlarmTime}
            mapsReady={travel.mapsReady}
            status={travel.status}
            error={travel.error}
            travelText={travel.travelText}
            summaryLabel={direction === 'target' ? 'leave by' : 'arrive by'}
            summaryValue={direction === 'target' ? departureLabel : arrivalLabel}
          />
        )}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Morning activities
          </h3>
          <ActivityChecklist
            customActivities={customActivities}
            isSelected={activitySelection.isSelected}
            onToggle={activitySelection.toggle}
            onRemoveCustom={removeCustomActivity}
          />
          <div className="mt-3">
            <CustomActivityForm onAdd={addCustomActivity} />
          </div>
        </div>

        <BufferSelector
          selection={bufferSelection}
          customMinutes={customBufferMinutes}
          onSelect={setBufferSelection}
          onCustomMinutesChange={setCustomBufferMinutes}
        />

        <ResultCard
          isReady={isReady}
          emptyMessage={emptyMessage}
          headlineLabel={headlineLabel}
          headlineValue={headlineValue}
          rows={rows}
          selectedActivities={selectedActivities}
        />
      </div>
    </PageLayout>
  )
}
