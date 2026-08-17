import type { Direction } from '../types'

const OPTIONS: { value: Direction; label: string }[] = [
  { value: 'target', label: 'I know my leave/arrival time' },
  { value: 'alarm', label: 'I know my alarm time' },
]

interface DirectionToggleProps {
  value: Direction
  onChange: (value: Direction) => void
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <div className="inline-flex w-full rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 gap-0.5">
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-9 flex-1 rounded-md px-2 text-xs font-medium transition-colors
              ${
                active
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
