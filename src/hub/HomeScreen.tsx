import { Link } from 'react-router-dom'
import { appRegistry } from './appRegistry'

export function HomeScreen() {
  return (
    <div className="min-h-svh bg-neutral-950">
      <div
        className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-br
          from-neutral-900 via-neutral-900 to-neutral-950 px-4 pb-8"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full
            bg-indigo-500/20 blur-3xl"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full
            bg-sky-500/10 blur-3xl"
        />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-white">QuickAccess</h1>
          <p className="mt-1 text-neutral-400">Your quick-access tools</p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className={appRegistry.length > 1 ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
          {appRegistry.map((app) => (
            <Link
              key={app.path}
              to={app.path}
              className="group flex flex-col items-start gap-2 rounded-xl border
                border-neutral-800 bg-neutral-900 p-4 min-h-28 transition-all
                hover:border-neutral-700 hover:bg-neutral-800/80 active:scale-[0.98]"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg
                  bg-neutral-800 text-lg group-hover:bg-neutral-700"
              >
                {app.icon}
              </span>
              <span className="font-semibold text-white">{app.label}</span>
              <span className="text-xs text-neutral-400">{app.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
