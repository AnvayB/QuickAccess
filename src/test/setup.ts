import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The travel lookup is debounced (600ms), so async queries need more than the 1s default.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
