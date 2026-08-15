// Fixed palette of accessible, visually distinct colors (readable with white text).
// Chosen for both scanability and reasonable contrast on light/dark backgrounds.
const PALETTE = [
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#d97706', // amber-600
  '#65a30d', // lime-600
  '#16a34a', // green-600
  '#0d9488', // teal-600
  '#0891b2', // cyan-600
  '#2563eb', // blue-600
  '#4f46e5', // indigo-600
  '#7c3aed', // violet-600
  '#c026d3', // fuchsia-600
  '#e11d48', // rose-600
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Deterministic color for a tag value — same value always maps to the same color. */
export function colorForValue(value: string): string {
  return PALETTE[hashString(value) % PALETTE.length]
}

/** Precompute a value -> color lookup for a set of unique values. */
export function buildColorMap(values: string[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const value of values) {
    map.set(value, colorForValue(value))
  }
  return map
}
