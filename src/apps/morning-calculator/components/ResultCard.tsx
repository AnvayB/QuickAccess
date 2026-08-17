import type { Activity } from '../types'

interface ResultCardProps {
  hasDepartureTime: boolean
  departureLabel: string
  alarmLabel: string
  startGettingReadyLabel: string
  totalActivityMinutes: number
  bufferMinutes: number
  selectedActivities: Activity[]
}

export function ResultCard({
  hasDepartureTime,
  departureLabel,
  alarmLabel,
  startGettingReadyLabel,
  totalActivityMinutes,
  bufferMinutes,
  selectedActivities,
}: ResultCardProps) {
  if (!hasDepartureTime) {
    return (
      <div
        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white
          dark:bg-neutral-900 p-5 text-center"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Set a departure time to see your alarm time.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white
        dark:bg-neutral-900 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Set your alarm for
      </p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
        {alarmLabel}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <span className="text-neutral-500 dark:text-neutral-400">You need to leave</span>
        <span className="text-right font-medium text-neutral-900 dark:text-white">
          {departureLabel}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">Morning routine</span>
        <span className="text-right font-medium text-neutral-900 dark:text-white">
          {totalActivityMinutes} min
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">Wake-up buffer</span>
        <span className="text-right font-medium text-neutral-900 dark:text-white">
          {bufferMinutes} min
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">Start getting ready</span>
        <span className="text-right font-medium text-neutral-900 dark:text-white">
          {startGettingReadyLabel}
        </span>
      </div>

      {selectedActivities.length > 0 && (
        <details className="mt-4 group">
          <summary
            className="cursor-pointer text-xs font-semibold uppercase tracking-wide
              text-neutral-500 dark:text-neutral-400 select-none"
          >
            Breakdown ({selectedActivities.length} activities)
          </summary>
          <div className="mt-2 flex flex-col gap-1">
            {selectedActivities.map((activity) => (
              <div key={activity.id} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{activity.label}</span>
                <span className="text-neutral-500 dark:text-neutral-400">{activity.minutes} min</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
