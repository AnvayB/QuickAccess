import { MultiSelectDropdown } from '../../../shared/components/MultiSelectDropdown'
import { SearchInput } from '../../../shared/components/SearchInput'
import { SegmentedControl } from '../../../shared/components/SegmentedControl'
import { typeColorFor } from '../lib/typeColors'
import type { SortOption } from '../types'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
  typeOptions: string[]
  typeSelected: Set<string>
  onToggleType: (value: string) => void
}

export function FilterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  typeOptions,
  typeSelected,
  onToggleType,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={search} onChange={onSearchChange} placeholder="Search by name…" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
          Sort by
        </h3>
        <SegmentedControl
          value={sort}
          onChange={onSortChange}
          options={[
            { value: 'ranking', label: 'Top Rated' },
            { value: 'caffeine', label: 'Most Caffeine' },
            { value: 'sugar', label: 'Least Sugar' },
          ]}
        />
      </div>

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
