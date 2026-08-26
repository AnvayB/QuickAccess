import type { VercelRequest, VercelResponse } from '@vercel/node'
import { appendCsvRow, checkSecret, commitFile, getFile, toCsvRow } from './_lib/github.js'

const CSV_PATH = 'data-source/drinks.csv'

interface AddDrinkBody {
  name?: string
  ranking?: number | string
  caffeineMg?: number | string
  sugarG?: number | string
  notes?: string
  type?: string
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

  const body = req.body as AddDrinkBody
  const name = body.name?.trim()
  const type = body.type?.trim()
  const notes = body.notes?.trim() ?? ''
  const ranking = Number(body.ranking)
  const caffeineMg = Number(body.caffeineMg)
  const sugarG = Number(body.sugarG)

  if (!name) {
    res.status(400).json({ error: 'Name is required' })
    return
  }
  if (!type) {
    res.status(400).json({ error: 'Type is required' })
    return
  }
  if (Number.isNaN(ranking)) {
    res.status(400).json({ error: 'Ranking must be a number' })
    return
  }
  if (Number.isNaN(caffeineMg)) {
    res.status(400).json({ error: 'Caffeine must be a number' })
    return
  }
  if (Number.isNaN(sugarG)) {
    res.status(400).json({ error: 'Sugar must be a number' })
    return
  }

  const row = toCsvRow([
    name,
    String(ranking),
    String(caffeineMg),
    String(sugarG),
    notes,
    type,
  ])

  try {
    const { content, sha } = await getFile(CSV_PATH)
    const updated = appendCsvRow(content, row)
    await commitFile(CSV_PATH, updated, sha, `Add drink: ${name}`)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Failed to save' })
    return
  }

  res.status(200).json({ ok: true })
}
