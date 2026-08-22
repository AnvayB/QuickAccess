import type { Direction } from '../types'

const LABELS: Record<Direction, string> = {
  target: 'I know my leave/arrival time',
  alarm: 'I know my alarm time',
}

const NEXT: Record<Direction, Direction> = {
  target: 'alarm',
  alarm: 'target',
}

interface DirectionToggleProps {
  value: Direction
  onChange: (value: Direction) => void
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <button
      type="button"
      aria-label={`Switch to: ${LABELS[NEXT[value]]}`}
      title={LABELS[NEXT[value]]}
      onClick={() => onChange(NEXT[value])}
      className="inline-flex shrink-0 items-center justify-center min-h-9 min-w-9 rounded-lg
        bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400
        hover:text-neutral-900 dark:hover:text-white transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4.5 w-4.5"
      >
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    </button>
  )
}
