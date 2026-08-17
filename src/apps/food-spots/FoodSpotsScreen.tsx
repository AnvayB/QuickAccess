import { useMemo, useState } from 'react'
import { PageLayout } from '../../shared/components/PageLayout'
import { useMultiSelectFilter } from '../../shared/hooks/useMultiSelectFilter'
import { colorForValue } from '../../shared/lib/colorAssignment'
import { FilterBar } from './components/FilterBar'
import { ResultsList } from './components/ResultsList'
import { SurpriseMeButton } from './components/SurpriseMeButton'
import { SurpriseModal } from './components/SurpriseModal'
import foodSpotsData from './data/foodSpots.json'
import type { FoodSpot, Status } from './types'

const foodSpots = foodSpotsData as FoodSpot[]

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

// Ordered roughly by driving proximity to Milpitas, nearest first.
const LOCATION_PROXIMITY_TO_MILPITAS = [
  'Milpitas',
  'Fremont',
  'San Jose',
  'Santa Clara',
  'Sunnyvale',
  'Cupertino',
  'Campbell',
  'Mountain View',
  'Los Gatos',
  'Palo Alto',
  'Pleasanton',
  'San Carlos',
  'Foster City',
  'San Mateo',
  'Oakland',
  'Berkeley',
  'San Francisco',
  'Monterey',
  'Davis',
  'Sacramento',
]

function uniqueByProximity(values: string[]): string[] {
  const unique = Array.from(new Set(values))
  return unique.sort((a, b) => {
    const indexA = LOCATION_PROXIMITY_TO_MILPITAS.indexOf(a)
    const indexB = LOCATION_PROXIMITY_TO_MILPITAS.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

export function FoodSpotsScreen() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | Status>('All')
  const locationFilter = useMultiSelectFilter()
  const cuisineFilter = useMultiSelectFilter()
  const typeFilter = useMultiSelectFilter()
  const [surpriseSpot, setSurpriseSpot] = useState<FoodSpot | null>(null)

  const locationOptions = useMemo(
    () => uniqueByProximity(foodSpots.flatMap((s) => s.location)),
    [],
  )
  const cuisineOptions = useMemo(() => uniqueSorted(foodSpots.map((s) => s.cuisine)), [])
  const typeOptions = useMemo(() => uniqueSorted(foodSpots.flatMap((s) => s.type)), [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return foodSpots.filter((spot) => {
      if (query && !spot.name.toLowerCase().includes(query)) return false
      if (status !== 'All' && spot.status !== status) return false
      if (
        locationFilter.selected.size > 0 &&
        !spot.location.some((l) => locationFilter.selected.has(l))
      )
        return false
      if (cuisineFilter.selected.size > 0 && !cuisineFilter.selected.has(spot.cuisine))
        return false
      if (typeFilter.selected.size > 0 && !spot.type.some((t) => typeFilter.selected.has(t)))
        return false
      return true
    })
  }, [search, status, locationFilter.selected, cuisineFilter.selected, typeFilter.selected])

  const pickSurprise = () => {
    if (filtered.length === 0) return
    const spot = filtered[Math.floor(Math.random() * filtered.length)]
    setSurpriseSpot(spot)
  }

  return (
    <PageLayout title="Food Spots">
      <div className="flex flex-col gap-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          locationOptions={locationOptions}
          cuisineOptions={cuisineOptions}
          typeOptions={typeOptions}
          locationSelected={locationFilter.selected}
          cuisineSelected={cuisineFilter.selected}
          typeSelected={typeFilter.selected}
          onToggleLocation={locationFilter.toggle}
          onToggleCuisine={cuisineFilter.toggle}
          onToggleType={typeFilter.toggle}
          colorFor={colorForValue}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {filtered.length} of {foodSpots.length} spots
          </p>
          <SurpriseMeButton disabled={filtered.length === 0} onPress={pickSurprise} />
        </div>

        <ResultsList spots={filtered} />
      </div>

      {surpriseSpot && (
        <SurpriseModal
          spot={surpriseSpot}
          onPickAgain={pickSurprise}
          onClose={() => setSurpriseSpot(null)}
        />
      )}
    </PageLayout>
  )
}
