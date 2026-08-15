import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageLayoutProps {
  title: string
  children: ReactNode
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950">
      <header
        className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200
          dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Link
          to="/"
          aria-label="Back to home"
          className="inline-flex items-center justify-center min-h-9 min-w-9 -ml-1 rounded-md
            text-neutral-500 dark:text-neutral-400"
        >
          ←
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h1>
      </header>
      <main className="px-4 py-4">{children}</main>
    </div>
  )
}
