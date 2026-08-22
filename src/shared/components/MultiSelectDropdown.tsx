import { useEffect, useRef, useState } from 'react'

interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: Set<string>
  onToggle: (value: string) => void
  onClear?: () => void
  colorFor?: (value: string) => string
  iconFor?: (value: string) => string | undefined
  pillClassFor?: (value: string) => string
  allowCustom?: boolean
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
  colorFor,
  iconFor,
  pillClassFor,
  allowCustom,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [customOptions, setCustomOptions] = useState<string[]>([])
  const [customValue, setCustomValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (options.length === 0 && !allowCustom) return null

  const allOptions = customOptions.length > 0 ? [...options, ...customOptions] : options
  const selectedOptions = allOptions.filter((option) => selected.has(option))

  function addCustomValue() {
    const value = customValue.trim()
    if (!value) return
    if (!allOptions.some((option) => option.toLowerCase() === value.toLowerCase())) {
      setCustomOptions((prev) => [...prev, value])
    }
    onToggle(value)
    setCustomValue('')
  }

  function renderRowLabel(option: string) {
    const color = colorFor?.(option)
    const icon = iconFor?.(option)
    const pillClass = pillClassFor?.(option)

    if (pillClass) {
      return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pillClass}`}>
          {option}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
        {color && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        )}
        {option}
        {icon ? ` ${icon}` : ''}
      </span>
    )
  }

  function renderChip(option: string) {
    const color = colorFor?.(option)
    const icon = iconFor?.(option)
    const pillClass = pillClassFor?.(option)

    if (pillClass) {
      return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pillClass}`}>
          {option}
        </span>
      )
    }

    if (color) {
      return (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}26`, color }}
        >
          {option}
        </span>
      )
    }

    return (
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800
          text-neutral-700 dark:text-neutral-200"
      >
        {option}
        {icon ? ` ${icon}` : ''}
      </span>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </h3>
        {onClear && selectedOptions.length > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onClear()
            }}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400
              dark:hover:text-neutral-200 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700
          bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200
          min-h-9 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
      >
        {selectedOptions.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1.5 text-left">
            {selectedOptions.map((option) => (
              <span key={option}>{renderChip(option)}</span>
            ))}
          </span>
        ) : (
          <span>All {label}</span>
        )}
        <span aria-hidden className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute z-10 mt-2 w-full min-w-64 max-h-72 overflow-y-auto rounded-lg border
            border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 shadow-lg"
        >
          {allOptions.map((option) => {
            const isSelected = selected.has(option)
            const color = colorFor?.(option)
            return (
              <label
                key={option}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer
                  hover:bg-neutral-100 dark:hover:bg-neutral-800 select-none"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(option)}
                  className="h-4 w-4 rounded border border-neutral-300 dark:border-neutral-600 accent-current"
                  style={color ? { accentColor: color } : undefined}
                />
                {renderRowLabel(option)}
              </label>
            )
          })}

          {allowCustom && (
            <div
              className="flex items-center gap-1.5 pt-1.5 mt-1.5 border-t border-neutral-200 dark:border-neutral-800"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomValue()
                  }
                }}
                placeholder="Add new…"
                className="flex-1 min-w-0 rounded-md border border-neutral-300 dark:border-neutral-700
                  bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm text-neutral-900 dark:text-white
                  placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addCustomValue}
                disabled={!customValue.trim()}
                className="shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700
                  dark:text-neutral-200 px-2.5 py-1.5 text-sm font-medium disabled:opacity-40
                  disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
