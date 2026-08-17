import { activityCategories, activityLibrary } from '../data/activities'
import type { Activity } from '../types'

interface ActivityChecklistProps {
  customActivities: Activity[]
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
  onRemoveCustom: (id: string) => void
}

export function ActivityChecklist({
  customActivities,
  isSelected,
  onToggle,
  onRemoveCustom,
}: ActivityChecklistProps) {
  return (
    <div className="flex flex-col gap-5">
      {activityCategories.map((category) => {
        const activities = activityLibrary.filter((a) => a.category === category)
        return (
          <div key={category}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              {category}
            </h3>
            <div className="flex flex-col gap-1">
              {activities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  checked={isSelected(activity.id)}
                  onToggle={() => onToggle(activity.id)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {customActivities.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Custom
          </h3>
          <div className="flex flex-col gap-1">
            {customActivities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                checked={isSelected(activity.id)}
                onToggle={() => onToggle(activity.id)}
                onRemove={() => onRemoveCustom(activity.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ActivityRowProps {
  activity: Activity
  checked: boolean
  onToggle: () => void
  onRemove?: () => void
}

function ActivityRow({ activity, checked, onToggle, onRemove }: ActivityRowProps) {
  return (
    <label
      className="flex items-center gap-3 rounded-lg px-2 py-2 min-h-11 cursor-pointer
        hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-5 w-5 shrink-0 rounded accent-neutral-900 dark:accent-white"
      />
      <span className="flex-1 text-sm text-neutral-900 dark:text-white">{activity.label}</span>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{activity.minutes} min</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${activity.label}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className="min-h-7 min-w-7 -mr-1 rounded-md text-neutral-400 hover:text-neutral-600
            dark:hover:text-neutral-200"
        >
          ✕
        </button>
      )}
    </label>
  )
}
