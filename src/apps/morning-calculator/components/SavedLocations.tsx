import { useState } from 'react'
import type { SavedLocation } from '../lib/useSavedLocations'

interface SavedLocationsProps {
  locations: SavedLocation[]
  /** The destination currently entered; used to highlight a match and offer "Save". */
  currentAddress: string
  onPick: (address: string) => void
  onSave: (label: string, address: string) => void
  onRemove: (id: string) => void
}

export function SavedLocations({ locations, currentAddress, onPick, onSave, onRemove }: SavedLocationsProps) {
  const [naming, setNaming] = useState(false)
  const [label, setLabel] = useState('')

  const trimmedAddress = currentAddress.trim()
  const alreadySaved = locations.some((l) => l.address === trimmedAddress)
  const canSave = trimmedAddress.length > 0 && !alreadySaved

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    onSave(label, trimmedAddress)
    setLabel('')
    setNaming(false)
  }

  if (locations.length === 0 && !canSave) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => {
            const selected = loc.address === trimmedAddress
            return (
              <span
                key={loc.id}
                className={`inline-flex items-center rounded-full text-sm font-medium min-h-9
                  ${
                    selected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                  }`}
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  title={loc.address}
                  onClick={() => onPick(loc.address)}
                  className="min-h-9 pl-3 pr-1.5"
                >
                  {loc.label}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${loc.label}`}
                  onClick={() => {
                    if (window.confirm(`Remove "${loc.label}"?`)) onRemove(loc.id)
                  }}
                  className="min-h-9 pl-1 pr-3 opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      {canSave &&
        (naming ? (
          <form onSubmit={submit} className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Name this place (e.g. Gym)"
              className="min-h-9 flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700
                bg-white dark:bg-neutral-900 px-3 text-base sm:text-sm text-neutral-900 dark:text-white
                placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
            <button
              type="submit"
              className="min-h-9 px-3 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800
                text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700
                transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setNaming(false)
                setLabel('')
              }}
              className="min-h-9 px-2 text-sm text-neutral-500 dark:text-neutral-400"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="self-start min-h-9 text-sm font-medium text-neutral-500 dark:text-neutral-400
              hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            ☆ Save this place
          </button>
        ))}
    </div>
  )
}
