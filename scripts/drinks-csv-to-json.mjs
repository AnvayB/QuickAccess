// One-off conversion script: run manually (`npm run data:build:drinks`) whenever
// data-source/drinks.csv changes. Not part of the Vite build.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parse } from 'csv-parse/sync'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '..', 'data-source', 'drinks.csv')
const outPath = path.join(__dirname, '..', 'src', 'apps', 'drinks', 'data', 'drinks.json')

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

const drinks = records.map((row, index) => {
  const name = row.Name?.trim()
  const type = row.Type?.trim()
  const rankingRaw = row.Ranking?.trim()
  const caffeineRaw = row.Caffeine?.trim()
  const sugarRaw = row.Sugar?.trim()
  const notes = row.Notes?.trim()

  if (!name) {
    throw new Error(`Row ${index + 2}: missing Name`)
  }
  if (!type) {
    throw new Error(`Row ${index + 2} (${name}): missing Type`)
  }

  const ranking = Number(rankingRaw)
  const caffeineMg = Number(caffeineRaw)
  const sugarG = Number(sugarRaw)

  if (Number.isNaN(ranking)) {
    throw new Error(`Row ${index + 2} (${name}): invalid Ranking "${rankingRaw}"`)
  }
  if (Number.isNaN(caffeineMg)) {
    throw new Error(`Row ${index + 2} (${name}): invalid Caffeine "${caffeineRaw}"`)
  }
  if (Number.isNaN(sugarG)) {
    throw new Error(`Row ${index + 2} (${name}): invalid Sugar "${sugarRaw}"`)
  }

  const baseSlug = slugify(name)
  const count = seenSlugs.get(baseSlug) ?? 0
  seenSlugs.set(baseSlug, count + 1)
  const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`

  return {
    id,
    name,
    ranking,
    caffeineMg,
    sugarG,
    notes: notes || undefined,
    type,
  }
})

writeFileSync(outPath, JSON.stringify(drinks, null, 2) + '\n', 'utf-8')

console.log(`Wrote ${drinks.length} drinks to ${path.relative(process.cwd(), outPath)}`)
