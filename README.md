# Kenya Insurance Ledger (v4)

Kenya general insurance regulatory & financial intelligence portal.

React 18 + TypeScript + Tailwind CSS 3 + Recharts 2, built with Vite 5.

```
npm install
npm run dev      # local development
npm run build    # type-check + production build to dist/
```

Live site: https://kenya-insurance-ledger.github.io/ — deployed by `.github/workflows/deploy.yml` on every push to `main`.

Tests: `tests/test4.py` (Playwright, 59 checks) expects the built `dist/` served at `http://127.0.0.1:8766`.

## Structure
- `src/data/reference.js` — sourced reference data (sources, classes, insurers, aliases, contacts, legal library, feed, reconciliation items). Every record has a status and a source id.
- `public/data/ira_general.json` — insurer-by-insurer IRA quarterly panel, Q4 2016 – Q1 2026 (KSh millions, year to date), built from Marion Peter's `maidenpeter/ira-kenya-data` reconstruction, plus 29 spot checks against IRA PDFs.
- `src/lib/fin.ts` — financial engine: value queries with per-record status (VERIFIED / REPORTED / DISPUTED), calculated ratios, single-quarter derivation.
- `src/lib/importer.ts` — CSV/JSON validation (column mapping, units, periods, names, duplicates, sources, definitions).
- `src/lib/store.ts` — localStorage persistence with JSON backup/restore (demo only — not secure, not shared).
- `src/components/illustrations.tsx` — PCF shield, corporate lineage and data-pipeline SVGs.
- `src/views/*` — the seven modules.

## Data rules enforced in code
- Rankings exclude DISPUTED returns and list every excluded or missing insurer with the reason.
- Market share uses insurer and market totals from the same IRA table and period only.
- Charts never join across missing periods (`connectNulls={false}`).
- Imports never overwrite silently: replacements need explicit approval and the original is archived as SUPERSEDED.
- Reconciliation resolutions require a written justification.

Production persistence should move to an authenticated API (e.g. Next.js routes + PostgreSQL/Prisma; schema in the "Pipeline & data model" tab).
