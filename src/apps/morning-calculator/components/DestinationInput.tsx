import { useEffect, useRef } from 'react'

interface DestinationInputProps {
  value: string
  onChange: (value: string) => void
  mapsReady: boolean
}

export function DestinationInput({ value, onChange, mapsReady }: DestinationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'name'],
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const description = place.formatted_address ?? place.name
      if (description) onChangeRef.current(description)
    })
    autocompleteRef.current = autocomplete
  }, [mapsReady])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Where are you going?"
      className="min-h-11 w-full rounded-lg border border-neutral-200 dark:border-neutral-700
        bg-white dark:bg-neutral-900 px-3 text-base text-neutral-900 dark:text-white
        placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
    />
  )
}
