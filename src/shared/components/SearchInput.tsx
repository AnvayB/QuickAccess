interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700
          bg-white dark:bg-neutral-900 px-3 py-2.5 text-base
          text-neutral-900 dark:text-white placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
