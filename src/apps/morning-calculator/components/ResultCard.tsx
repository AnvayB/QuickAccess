import type { Activity } from '../types'

export interface ResultRow {
  label: string
  value: string
}

export interface ResultFigure {
  label: string
  value: string
}

interface ResultCardProps {
  isReady: boolean
  emptyMessage: string
  headline: ResultFigure
  secondary?: ResultFigure
  rows: ResultRow[]
  selectedActivities: Activity[]
}

/** Renders "6:42 AM" with a smaller AM/PM so two big times fit side by side on a phone. */
export function BigTime({ value, className = 'text-4xl' }: { value: string; className?: string }) {
  const [time, period] = value.split(' ')
  return (
    <span className={`font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap ${className}`}>
      {time}
      {period && (
        <>
          {' '}
          <span className="text-[0.5em] font-semibold text-neutral-500 dark:text-neutral-400">{period}</span>
        </>
      )}
    </span>
  )
}

const CARD = 'rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5'
const LABEL = 'text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400'

export function ResultCard({ isReady, emptyMessage, headline, secondary, rows, selectedActivities }: ResultCardProps) {
  if (!isReady) {
    return (
      <div className={`${CARD} text-center`}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={CARD}>
      <div className={secondary ? 'grid grid-cols-2 gap-4' : ''}>
        <div>
          <p className={LABEL}>{headline.label}</p>
          <p className="mt-1">
            <BigTime value={headline.value} />
          </p>
        </div>
        {secondary && (
          <div>
            <p className={LABEL}>{secondary.label}</p>
            <p className="mt-1">
              <BigTime value={secondary.value} />
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <span className="text-neutral-500 dark:text-neutral-400">{row.label}</span>
            <span className="text-right font-medium text-neutral-900 dark:text-white">{row.value}</span>
          </div>
        ))}
      </div>

      {selectedActivities.length > 0 && (
        <details className="mt-4 group">
          <summary className={`cursor-pointer select-none min-h-9 flex items-center ${LABEL}`}>
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
