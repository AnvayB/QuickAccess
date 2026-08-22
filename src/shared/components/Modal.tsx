import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
}

export function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-5"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
