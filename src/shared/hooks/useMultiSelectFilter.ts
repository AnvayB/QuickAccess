import { useCallback, useMemo, useState } from 'react'

export interface MultiSelectFilter {
  selected: Set<string>
  isSelected: (value: string) => boolean
  toggle: (value: string) => void
  clear: () => void
}

export function useMultiSelectFilter(): MultiSelectFilter {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const toggle = useCallback((value: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  const isSelected = useCallback((value: string) => selected.has(value), [selected])

  return useMemo(
    () => ({ selected, isSelected, toggle, clear }),
    [selected, isSelected, toggle, clear],
  )
}
