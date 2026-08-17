import type { Mode } from '../types'

const OPTIONS: { value: Mode; label: string }[] = [
  { value: 'wake-up', label: 'Wake Up' },
  { value: 'travel', label: 'Travel' },
]

interface ModeToggleProps {
  value: Mode
  onChange: (value: Mode) => void
}

export function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 gap-0.5">
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-7 px-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap
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
