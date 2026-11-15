/** localStorage can throw (private mode, blocked storage), so never let it break the UI. */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore — persistence is best-effort.
  }
}
