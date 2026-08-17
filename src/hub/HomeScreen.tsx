import { Link } from 'react-router-dom'
import { ThemeToggle } from '../shared/components/ThemeToggle'
import { appRegistry } from './appRegistry'

export function HomeScreen() {
  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950">
      <div
        className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800
          bg-white dark:bg-neutral-900 px-4 pb-8"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
      >
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              QuickAccess
            </h1>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">Your quick-access tools</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex flex-col gap-3">
          {appRegistry.map((app) => (
            <Link
              key={app.path}
              to={app.path}
              className="group flex items-center gap-4 rounded-xl border
                border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4
                transition-all hover:border-neutral-300 dark:hover:border-neutral-700
                hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:scale-[0.98]"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                  bg-neutral-100 dark:bg-neutral-800 text-lg group-hover:bg-neutral-200
                  dark:group-hover:bg-neutral-700"
              >
                {app.icon}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {app.label}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {app.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
