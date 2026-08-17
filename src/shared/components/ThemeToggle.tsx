import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center min-h-9 min-w-9 rounded-md
        text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800
        transition-colors"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
