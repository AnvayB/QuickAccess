import { MultiSelectDropdown } from '../../../shared/components/MultiSelectDropdown'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SegmentedControl } from '../../../shared/components/SegmentedControl'
import { cuisineFlagFor } from '../lib/cuisineFlags'
import { typeColorFor } from '../lib/typeColors'
import type { Status } from '../types'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: 'All' | Status
  onStatusChange: (value: 'All' | Status) => void
  locationOptions: string[]
  cuisineOptions: string[]
  typeOptions: string[]
  locationSelected: Set<string>
  cuisineSelected: Set<string>
  typeSelected: Set<string>
  onToggleLocation: (value: string) => void
  onToggleCuisine: (value: string) => void
  onToggleType: (value: string) => void
  colorFor: (value: string) => string
}

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  locationOptions,
  cuisineOptions,
  typeOptions,
  locationSelected,
  cuisineSelected,
  typeSelected,
  onToggleLocation,
  onToggleCuisine,
  onToggleType,
  colorFor,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={search} onChange={onSearchChange} placeholder="Search by name…" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
          Status
        </h3>
        <SegmentedControl
          value={status}
          onChange={onStatusChange}
          options={[
            { value: 'All', label: 'All' },
            { value: 'Visited', label: 'Visited' },
            { value: 'Not Visited', label: 'Not Visited' },
          ]}
        />
      </div>

      <MultiSelectDropdown
        label="Location"
        options={locationOptions}
        selected={locationSelected}
        onToggle={onToggleLocation}
        colorFor={colorFor}
      />
      <MultiSelectDropdown
        label="Cuisine"
        options={cuisineOptions}
        selected={cuisineSelected}
        onToggle={onToggleCuisine}
        iconFor={cuisineFlagFor}
      />
      <MultiSelectDropdown
        label="Type"
        options={typeOptions}
        selected={typeSelected}
        onToggle={onToggleType}
        pillClassFor={typeColorFor}
      />
    </div>
  )
}
