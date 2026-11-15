import { useEffect, useRef, useState } from 'react'

interface DestinationInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  mapsReady: boolean
}

interface Suggestion {
  id: string
  text: string
}

const MIN_QUERY_LENGTH = 3
const SUGGEST_DEBOUNCE_MS = 250

/**
 * Text input with a Places API (New) autocomplete dropdown. Built on
 * AutocompleteSuggestion rather than the Autocomplete widget so it matches the
 * app's styling (including dark mode) and works with a controlled value.
 */
export function DestinationInput({ id, value, onChange, mapsReady }: DestinationInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const closeList = () => {
    requestIdRef.current++ // drop any in-flight response
    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  const fetchSuggestions = (input: string) => {
    const requestId = ++requestIdRef.current
    google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input })
      .then(({ suggestions: results }) => {
        if (requestId !== requestIdRef.current) return
        const next = results.flatMap((s) =>
          s.placePrediction
            ? [{ id: s.placePrediction.placeId, text: s.placePrediction.text.toString() }]
            : [],
        )
        setSuggestions(next)
        setActiveIndex(-1)
        setOpen(next.length > 0)
      })
      .catch((err: unknown) => {
        console.error('Places autocomplete failed', err)
        if (requestId === requestIdRef.current) closeList()
      })
  }

  const handleChange = (next: string) => {
    onChange(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!mapsReady || next.trim().length < MIN_QUERY_LENGTH) {
      closeList()
      return
    }
    timerRef.current = setTimeout(() => fetchSuggestions(next.trim()), SUGGEST_DEBOUNCE_MS)
  }

  const select = (suggestion: Suggestion) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange(suggestion.text)
    closeList()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      select(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      closeList()
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={closeList}
        placeholder="Search for an address or place"
        className="min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white
          placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
      />
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200
            dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === activeIndex}
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(e) => {
                e.preventDefault()
                select(s)
              }}
              className={`cursor-pointer px-3 py-2.5 text-sm text-neutral-900 dark:text-white
                ${i === activeIndex ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
