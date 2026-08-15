import { Link } from 'react-router-dom'
import { appRegistry } from './appRegistry'

export function HomeScreen() {
  return (
    <div
      className="min-h-svh bg-neutral-50 dark:bg-neutral-950 px-4 py-6"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">QuickAccess</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6">Your quick-access tools</p>
      <div className="grid grid-cols-2 gap-3">
        {appRegistry.map((app) => (
          <Link
            key={app.path}
            to={app.path}
            className="flex flex-col items-start gap-2 rounded-xl border border-neutral-200
              dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 min-h-28
              active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl" aria-hidden>
              {app.icon}
            </span>
            <span className="font-semibold text-neutral-900 dark:text-white">{app.label}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {app.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
