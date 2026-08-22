import type { Activity } from '../types'

export interface ResultRow {
  label: string
  value: string
}

interface ResultCardProps {
  isReady: boolean
  emptyMessage: string
  headlineLabel: string
  headlineValue: string
  rows: ResultRow[]
  selectedActivities: Activity[]
}

export function ResultCard({
  isReady,
  emptyMessage,
  headlineLabel,
  headlineValue,
  rows,
  selectedActivities,
}: ResultCardProps) {
  if (!isReady) {
    return (
      <div
        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white
          dark:bg-neutral-900 p-5 text-center"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white
        dark:bg-neutral-900 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {headlineLabel}
      </p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
        {headlineValue}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <span className="text-neutral-500 dark:text-neutral-400">{row.label}</span>
            <span className="text-right font-medium text-neutral-900 dark:text-white">{row.value}</span>
          </div>
        ))}
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
