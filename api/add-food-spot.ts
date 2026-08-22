import type { VercelRequest, VercelResponse } from '@vercel/node'
import { appendCsvRow, checkSecret, commitFile, getFile, toCsvRow } from './_lib/github'

const CSV_PATH = 'data-source/food-spots.csv'
const VALID_STATUSES = new Set(['Visited', 'Not Visited'])

interface AddFoodSpotBody {
  name?: string
  location?: string[]
  cuisine?: string
  type?: string[]
  status?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let authorized: boolean
  try {
    authorized = checkSecret(req)
  } catch {
    res.status(500).json({ error: 'Server is not configured (missing ADD_SECRET)' })
    return
  }
  if (!authorized) {
    res.status(401).json({ error: 'Incorrect passcode' })
    return
  }

  const body = req.body as AddFoodSpotBody
  const name = body.name?.trim()
  const cuisine = body.cuisine?.trim()
  const status = body.status?.trim()
  const location = (body.location ?? []).map((l) => l.trim()).filter(Boolean)
  const type = (body.type ?? []).map((t) => t.trim()).filter(Boolean)

  if (!name) {
    res.status(400).json({ error: 'Name is required' })
    return
  }
  if (location.length === 0) {
    res.status(400).json({ error: 'At least one location is required' })
    return
  }
  if (!cuisine) {
    res.status(400).json({ error: 'Cuisine is required' })
    return
  }
  if (type.length === 0) {
    res.status(400).json({ error: 'At least one type is required' })
    return
  }
  if (!status || !VALID_STATUSES.has(status)) {
    res.status(400).json({ error: 'Status must be "Visited" or "Not Visited"' })
    return
  }

  const row = toCsvRow([name, location.join('|'), cuisine, type.join('|'), status])

  try {
    const { content, sha } = await getFile(CSV_PATH)
    const updated = appendCsvRow(content, row)
    await commitFile(CSV_PATH, updated, sha, `Add food spot: ${name}`)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Failed to save' })
    return
  }

  res.status(200).json({ ok: true })
}
