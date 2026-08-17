import type { BufferPreset, BufferSelection } from '../types'

const PRESETS: { value: BufferPreset; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
]

interface BufferSelectorProps {
  selection: BufferSelection
  customMinutes: number
  onSelect: (selection: BufferSelection) => void
  onCustomMinutesChange: (minutes: number) => void
}

export function BufferSelector({
  selection,
  customMinutes,
  onSelect,
  onCustomMinutesChange,
}: BufferSelectorProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
        Wake-up buffer
      </h3>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = selection === preset.value
          return (
            <button
              key={preset.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(preset.value)}
              className={`min-h-9 px-3 rounded-lg text-sm font-medium transition-colors
                ${
                  active
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
            >
              {preset.label}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={selection === 'custom'}
          onClick={() => onSelect('custom')}
          className={`min-h-9 px-3 rounded-lg text-sm font-medium transition-colors
            ${
              selection === 'custom'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
        >
          Custom
        </button>
      </div>

      {selection === 'custom' && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={customMinutes}
            onChange={(e) => onCustomMinutesChange(Math.max(0, Number(e.target.value) || 0))}
            className="min-h-9 w-24 rounded-lg border border-neutral-200 dark:border-neutral-700
              bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-900 dark:text-white"
          />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">minutes</span>
        </div>
      )}
    </div>
  )
}
