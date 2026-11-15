import { BigTime, type ResultFigure } from './ResultCard'

interface SummaryBarProps {
  headline: ResultFigure
  secondary?: ResultFigure
  onClick: () => void
}

/** Phone-only bar pinned to the bottom so the answer stays visible while editing the routine. */
export function SummaryBar({ headline, secondary, onClick }: SummaryBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Jump to full result"
      className="fixed inset-x-0 bottom-0 z-20 lg:hidden border-t border-neutral-200 dark:border-neutral-800
        bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-4 pt-2.5 text-left"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        {[headline, secondary].map(
          (figure) =>
            figure && (
              <div key={figure.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {figure.label}
                </p>
                <BigTime value={figure.value} className="text-xl" />
              </div>
            ),
        )}
      </div>
    </button>
  )
}
