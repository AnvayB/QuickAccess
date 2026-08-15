interface ChipProps {
  label: string
  color: string
  selected: boolean
  onToggle: () => void
}

export function Chip({ label, color, selected, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium
        transition-colors select-none min-h-9
        ${selected ? 'text-white ring-2 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900' : 'text-neutral-700 dark:text-neutral-200'}
      `}
      style={{
        backgroundColor: selected ? color : `${color}22`,
        ...(selected ? ({ '--tw-ring-color': color } as React.CSSProperties) : {}),
      }}
    >
      {selected && <span aria-hidden>✓</span>}
      {label}
    </button>
  )
}
