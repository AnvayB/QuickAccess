import { useEffect, useState } from 'react'

/** Tracks whether an element is on screen. Returns a callback ref, the element, and its visibility. */
export function useInView<T extends Element>() {
  const [element, setElement] = useState<T | null>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return { ref: setElement, element, inView }
}
