import type { Mode } from '../types'
import { Segmented } from './Segmented'

const OPTIONS: { value: Mode; label: string }[] = [
  { value: 'travel', label: 'Travel' },
  { value: 'wake-up', label: 'Wake up only' },
]

interface ModeToggleProps {
  value: Mode
  onChange: (value: Mode) => void
}

export function ModeToggle({ value, onChange }: ModeToggleProps) {
  return <Segmented options={OPTIONS} value={value} onChange={onChange} ariaLabel="Mode" />
}
