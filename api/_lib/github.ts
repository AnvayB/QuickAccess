import type { VercelRequest } from '@vercel/node'
import { parse } from 'csv-parse/sync'

const GITHUB_OWNER = 'AnvayB'
const GITHUB_REPO = 'QuickAccess'
const GITHUB_BRANCH = 'main'

function contentsUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`
}

function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured')
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export function checkSecret(req: VercelRequest): boolean {
  const expected = process.env.ADD_SECRET
  if (!expected) {
    throw new Error('ADD_SECRET is not configured')
  }
  const provided = req.headers['x-add-secret']
  return typeof provided === 'string' && provided === expected
}

export async function getFile(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(`${contentsUrl(path)}?ref=${GITHUB_BRANCH}`, {
    headers: githubHeaders(),
  })
  if (!res.ok) {
    throw new Error(`Failed to read ${path} from GitHub: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as { content: string; sha: string }
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { content, sha: data.sha }
}

export async function commitFile(
  path: string,
  content: string,
  sha: string,
  message: string,
): Promise<void> {
  const res = await fetch(contentsUrl(path), {
    method: 'PUT',
    headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha,
      branch: GITHUB_BRANCH,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to commit ${path}: ${res.status} ${res.statusText} ${body}`)
  }
}

export function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',')
}

export function appendCsvRow(csvText: string, row: string): string {
  const normalized = csvText.endsWith('\n') ? csvText : `${csvText}\n`
  return `${normalized}${row}\n`
}

/**
 * Replaces the data row whose first column (Name) equals `originalName`.
 * `occurrence` (0-based) disambiguates rows that share a name. Throws if no row matches.
 */
export function replaceCsvRow(
  csvText: string,
  originalName: string,
  occurrence: number,
  newFields: string[],
): string {
  const rows = parse(csvText, { skip_empty_lines: true }) as string[][]
  let seen = 0
  let targetIndex = -1
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === originalName) {
      if (seen === occurrence) {
        targetIndex = i
        break
      }
      seen++
    }
  }
  if (targetIndex === -1) {
    throw new Error(`Could not find "${originalName}" in the data file`)
  }
  rows[targetIndex] = newFields
  return rows.map(toCsvRow).join('\n') + '\n'
}
