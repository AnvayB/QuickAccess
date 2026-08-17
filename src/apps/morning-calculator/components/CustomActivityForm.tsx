import { useState } from 'react'

interface CustomActivityFormProps {
  onAdd: (label: string, minutes: number) => void
}

export function CustomActivityForm({ onAdd }: CustomActivityFormProps) {
  const [label, setLabel] = useState('')
  const [minutes, setMinutes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = label.trim()
    const parsedMinutes = Number(minutes)
    if (!trimmed || !parsedMinutes || parsedMinutes <= 0) return
    onAdd(trimmed, parsedMinutes)
    setLabel('')
    setMinutes('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Custom activity…"
        className="min-h-9 flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-900 dark:text-white
          placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
      />
      <input
        type="number"
        min={1}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        placeholder="min"
        className="min-h-9 w-16 rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-900 px-2 text-sm text-neutral-900 dark:text-white
          placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
      />
      <button
        type="submit"
        className="min-h-9 px-3 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800
          text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700
          transition-colors"
      >
        Add
      </button>
    </form>
  )
}
