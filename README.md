# QuickAccess

A personal hub of small utility apps, installable as a PWA. One home screen, a few
single-purpose tools:

- **Food Spots** 🍜 — browse and filter Bay Area food & drink spots by location, cuisine, type,
  and visited status.
- **Drinks** 🥤 — browse and filter ranked energy drinks and other drinks by type, caffeine, and
  sugar content.
- **Morning Calculator** ⏰ — work out what time to set your alarm, accounting for travel time.

New mini-apps get added to `src/hub/appRegistry.ts` and routed in `src/App.tsx`.

## Data pipeline

Food Spots and Drinks are backed by CSVs in `data-source/` (`food-spots.csv`, `drinks.csv`) —
the source of truth for both apps. `npm run build` runs `npm run data:build` first, which
converts those CSVs into the JSON files each app actually imports
(`src/apps/food-spots/data/foodSpots.json`, `src/apps/drinks/data/drinks.json`) via
`scripts/csv-to-json.mjs` / `scripts/drinks-csv-to-json.mjs`. Editing a CSV directly and pushing
is enough — the next build regenerates the JSON automatically.

### Adding entries from anywhere

Both apps have a "+ Add" button that opens a form. Submitting it calls a Vercel serverless
function (`api/add-food-spot.ts` / `api/add-drink.ts`), which appends a row to the relevant CSV
via the GitHub API and commits it directly to `main`. That push triggers a normal Vercel
redeploy, so a new entry added from your phone (or anywhere) shows up for everyone within a
minute or two — no manual data step required.

This requires two environment variables set in the Vercel project (see `.env.example`):

- `GITHUB_TOKEN` — a fine-grained GitHub PAT scoped to this repo with `Contents: Read and write`.
- `ADD_SECRET` — a shared passcode the Add forms require, so the endpoints aren't publicly
  writable.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run data:build  # regenerate JSON from data-source/*.csv after editing them
npm run build     # typecheck + regenerate data + production build
npm run lint      # oxlint
```

Built with Vite, React, TypeScript, React Router, and Tailwind CSS; deployed on Vercel.
