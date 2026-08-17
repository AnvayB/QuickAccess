import { useMemo, useState } from 'react'
import { PageLayout } from '../../shared/components/PageLayout'
import { useMultiSelectFilter } from '../../shared/hooks/useMultiSelectFilter'
import { ActivityChecklist } from './components/ActivityChecklist'
import { BufferSelector } from './components/BufferSelector'
import { CustomActivityForm } from './components/CustomActivityForm'
import { ModeToggle } from './components/ModeToggle'
import { ResultCard } from './components/ResultCard'
import { TravelPanel } from './components/TravelPanel'
import { activityLibrary } from './data/activities'
import { formatMinutesAsClock, parseTimeToMinutes, subtractMinutes } from './lib/time'
import { useTravelPlan } from './lib/useTravelPlan'
import type { Activity, BufferSelection, Mode } from './types'

let customIdCounter = 0

export function MorningCalculatorScreen() {
  const [mode, setMode] = useState<Mode>('wake-up')
  const [departureTime, setDepartureTime] = useState('')
  const [customActivities, setCustomActivities] = useState<Activity[]>([])
  const [bufferSelection, setBufferSelection] = useState<BufferSelection>(15)
  const [customBufferMinutes, setCustomBufferMinutes] = useState(15)
  const activitySelection = useMultiSelectFilter()
  const travel = useTravelPlan(mode === 'travel')

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

  const arrivalMinutes = parseTimeToMinutes(travel.arrivalTime)
  const travelDepartureMinutes =
    arrivalMinutes === null || travel.travelMinutes === null
      ? null
      : subtractMinutes(arrivalMinutes, travel.travelMinutes)

  const departureMinutes =
    mode === 'travel' ? travelDepartureMinutes : parseTimeToMinutes(departureTime)

  const startGettingReadyMinutes =
    departureMinutes === null ? null : subtractMinutes(departureMinutes, totalActivityMinutes)

  const alarmMinutes =
    startGettingReadyMinutes === null ? null : subtractMinutes(startGettingReadyMinutes, bufferMinutes)

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

  const resultCardProps = {
    hasDepartureTime: departureMinutes !== null,
    departureLabel: departureMinutes === null ? '—' : formatMinutesAsClock(departureMinutes),
    alarmLabel: alarmMinutes === null ? '—' : formatMinutesAsClock(alarmMinutes),
    startGettingReadyLabel:
      startGettingReadyMinutes === null ? '—' : formatMinutesAsClock(startGettingReadyMinutes),
    totalActivityMinutes,
    bufferMinutes,
    selectedActivities,
  }

  return (
    <PageLayout title="Morning Calc" headerRight={<ModeToggle value={mode} onChange={setMode} />}>
      <div className="flex flex-col gap-5">
        {mode === 'wake-up' ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              What time do you need to leave the house?
            </h3>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700
                bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white"
            />
          </div>
        ) : (
          <TravelPanel
            destination={travel.destination}
            onDestinationChange={travel.setDestination}
            arrivalTime={travel.arrivalTime}
            onArrivalTimeChange={travel.setArrivalTime}
            mapsReady={travel.mapsReady}
            status={travel.status}
            error={travel.error}
            travelText={travel.travelText}
            departureLabel={departureMinutes === null ? null : formatMinutesAsClock(departureMinutes)}
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

        <ResultCard {...resultCardProps} />
      </div>
    </PageLayout>
  )
}
