import { useMemo, useState } from 'react'
import { PageLayout } from '../../shared/components/PageLayout'
import { SurpriseMeButton } from '../../shared/components/SurpriseMeButton'
import { useMultiSelectFilter } from '../../shared/hooks/useMultiSelectFilter'
import { AddDrinkModal } from './components/AddDrinkModal'
import { FilterBar } from './components/FilterBar'
import { ResultsList } from './components/ResultsList'
import { SurpriseModal } from './components/SurpriseModal'
import drinksData from './data/drinks.json'
import type { Drink, SortOption } from './types'

const drinks = drinksData as Drink[]

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

const SORT_COMPARATORS: Record<SortOption, (a: Drink, b: Drink) => number> = {
  ranking: (a, b) => b.ranking - a.ranking,
  caffeine: (a, b) => b.caffeineMg - a.caffeineMg,
  sugar: (a, b) => a.sugarG - b.sugarG,
}

export function DrinksScreen() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('ranking')
  const typeFilter = useMultiSelectFilter()
  const [surpriseDrink, setSurpriseDrink] = useState<Drink | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const typeOptions = useMemo(() => uniqueSorted(drinks.map((d) => d.type)), [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const results = drinks.filter((drink) => {
      if (query && !drink.name.toLowerCase().includes(query)) return false
      if (typeFilter.selected.size > 0 && !typeFilter.selected.has(drink.type)) return false
      return true
    })
    return results.sort(SORT_COMPARATORS[sort])
  }, [search, sort, typeFilter.selected])

  const surpriseCandidates = useMemo(
    () => filtered.filter((d) => d.ranking >= 8 && !d.name.toUpperCase().startsWith('PRIME ')),
    [filtered],
  )

  const pickSurprise = () => {
    if (surpriseCandidates.length === 0) return
    const drink = surpriseCandidates[Math.floor(Math.random() * surpriseCandidates.length)]
    setSurpriseDrink(drink)
  }

  return (
    <PageLayout title="Drinks">
      <div className="flex flex-col gap-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          typeOptions={typeOptions}
          typeSelected={typeFilter.selected}
          onToggleType={typeFilter.toggle}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {filtered.length} of {drinks.length} drinks
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800
                text-neutral-700 dark:text-neutral-200 px-4 py-2.5 text-sm font-medium min-h-11
                active:scale-[0.98] transition-transform"
            >
              + Add
            </button>
            <SurpriseMeButton disabled={surpriseCandidates.length === 0} onPress={pickSurprise} />
          </div>
        </div>

        <ResultsList drinks={filtered} />
      </div>

      {surpriseDrink && (
        <SurpriseModal
          drink={surpriseDrink}
          onPickAgain={pickSurprise}
          onClose={() => setSurpriseDrink(null)}
        />
      )}

      {showAddModal && (
        <AddDrinkModal onClose={() => setShowAddModal(false)} typeOptions={typeOptions} />
      )}
    </PageLayout>
  )
}
