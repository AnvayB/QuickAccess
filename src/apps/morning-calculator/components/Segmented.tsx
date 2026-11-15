interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Full-width segmented control with 44px tap targets, sized for thumbs. */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-lg px-2 text-sm font-medium transition-colors
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
