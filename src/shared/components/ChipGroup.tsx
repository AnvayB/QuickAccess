import { Chip } from './Chip'

interface ChipGroupProps {
  label: string
  options: string[]
  selected: Set<string>
  onToggle: (value: string) => void
  colorFor: (value: string) => string
}

export function ChipGroup({ label, options, selected, onToggle, colorFor }: ChipGroupProps) {
  if (options.length === 0) return null

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            color={colorFor(option)}
            selected={selected.has(option)}
            onToggle={() => onToggle(option)}
          />
        ))}
      </div>
    </div>
  )
}
