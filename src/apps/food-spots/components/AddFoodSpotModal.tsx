import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { MultiSelectDropdown } from '../../../shared/components/MultiSelectDropdown'
import { SegmentedControl } from '../../../shared/components/SegmentedControl'
import { colorForValue } from '../../../shared/lib/colorAssignment'
import { cuisineFlagFor } from '../lib/cuisineFlags'
import { typeColorFor } from '../lib/typeColors'
import type { Status } from '../types'

const PASSCODE_STORAGE_KEY = 'quickaccess:add-passcode'

interface AddFoodSpotModalProps {
  onClose: () => void
  locationOptions: string[]
  cuisineOptions: string[]
  typeOptions: string[]
}

function fieldClass() {
  return `w-full rounded-lg border border-neutral-300 dark:border-neutral-700
    bg-white dark:bg-neutral-900 px-3 py-2.5 text-base
    text-neutral-900 dark:text-white placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-blue-500`
}

export function AddFoodSpotModal({
  onClose,
  locationOptions,
  cuisineOptions,
  typeOptions,
}: AddFoodSpotModalProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState<Set<string>>(new Set())
  const [cuisine, setCuisine] = useState<Set<string>>(new Set())
  const [type, setType] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<Status>('Not Visited')
  const [passcode, setPasscode] = useState(
    () => localStorage.getItem(PASSCODE_STORAGE_KEY) ?? '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const canSubmit =
    name.trim() && location.size > 0 && cuisine.size > 0 && type.size > 0 && passcode.trim()

  function toggleLocation(value: string) {
    setLocation((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function toggleType(value: string) {
    setType((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function toggleCuisine(value: string) {
    setCuisine((prev) => (prev.has(value) ? new Set() : new Set([value])))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/add-food-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-add-secret': passcode.trim() },
        body: JSON.stringify({
          name: name.trim(),
          location: Array.from(location),
          cuisine: Array.from(cuisine)[0] ?? '',
          type: Array.from(type),
          status,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Something went wrong')
      }

      localStorage.setItem(PASSCODE_STORAGE_KEY, passcode.trim())
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Added!</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {name} was committed. It'll show up here after the next deploy finishes, usually
          within a minute or two.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium min-h-11 mt-5"
        >
          Done
        </button>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Add a food spot</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={fieldClass()}
        />
        <MultiSelectDropdown
          label="Location"
          options={locationOptions}
          selected={location}
          onToggle={toggleLocation}
          colorFor={colorForValue}
          allowCustom
        />
        <MultiSelectDropdown
          label="Cuisine"
          options={cuisineOptions}
          selected={cuisine}
          onToggle={toggleCuisine}
          iconFor={cuisineFlagFor}
          allowCustom
        />
        <MultiSelectDropdown
          label="Type"
          options={typeOptions}
          selected={type}
          onToggle={toggleType}
          pillClassFor={typeColorFor}
          allowCustom
        />
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: 'Not Visited', label: 'Not Visited' },
            { value: 'Visited', label: 'Visited' },
          ]}
        />
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className={fieldClass()}
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="flex-1 rounded-lg bg-blue-600 text-white py-2.5 text-sm font-medium min-h-11
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding…' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-neutral-100 dark:bg-neutral-800
              text-neutral-700 dark:text-neutral-200 py-2.5 text-sm font-medium min-h-11"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
