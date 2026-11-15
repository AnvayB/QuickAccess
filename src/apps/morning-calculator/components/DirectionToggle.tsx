import type { Direction, Mode } from '../types'
import { Segmented } from './Segmented'

const LABELS: Record<Mode, { value: Direction; label: string }[]> = {
  travel: [
    { value: 'target', label: 'Arrive by' },
    { value: 'alarm', label: 'I have an alarm' },
  ],
  'wake-up': [
    { value: 'target', label: 'Leave at' },
    { value: 'alarm', label: 'I have an alarm' },
  ],
}

interface DirectionToggleProps {
  mode: Mode
  value: Direction
  onChange: (value: Direction) => void
}

export function DirectionToggle({ mode, value, onChange }: DirectionToggleProps) {
  return <Segmented options={LABELS[mode]} value={value} onChange={onChange} ariaLabel="What do you know" />
}
