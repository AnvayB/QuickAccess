// One-off conversion script: run manually (`npm run data:build`) whenever
// data-source/food-spots.csv changes. Not part of the Vite build.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parse } from 'csv-parse/sync'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '..', 'data-source', 'food-spots.csv')
const outPath = path.join(
  __dirname,
  '..',
  'src',
  'apps',
  'food-spots',
  'data',
  'foodSpots.json',
)

const VALID_STATUSES = new Set(['Visited', 'Not Visited'])

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const csvText = readFileSync(csvPath, 'utf-8')
const records = parse(csvText, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
})

const seenSlugs = new Map()

const foodSpots = records.map((row, index) => {
  const name = row.Name?.trim()
  const cuisine = row.Cuisine?.trim()
  const status = row.Status?.trim()

  if (!name) {
    throw new Error(`Row ${index + 2}: missing Name`)
  }
  if (!VALID_STATUSES.has(status)) {
    throw new Error(
      `Row ${index + 2} (${name}): invalid Status "${status}" — expected "Visited" or "Not Visited"`,
    )
  }

  const location = row.Location?.split('|').map((s) => s.trim()).filter(Boolean) ?? []
  const type = row.Type?.split('|').map((s) => s.trim()).filter(Boolean) ?? []

  if (location.length === 0) {
    throw new Error(`Row ${index + 2} (${name}): missing Location`)
  }
  if (type.length === 0) {
    throw new Error(`Row ${index + 2} (${name}): missing Type`)
  }

  const baseSlug = slugify(name)
  const count = seenSlugs.get(baseSlug) ?? 0
  seenSlugs.set(baseSlug, count + 1)
  const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`

  return { id, name, location, cuisine, type, status }
})

writeFileSync(outPath, JSON.stringify(foodSpots, null, 2) + '\n', 'utf-8')

console.log(`Wrote ${foodSpots.length} food spots to ${path.relative(process.cwd(), outPath)}`)
