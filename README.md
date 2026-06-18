# EcoSphere

Supply-chain carbon intelligence, built entirely on free and open-source tools. Map your suppliers, facilities, and transport routes, import usage data, and EcoSphere computes Scope 1, 2, and 3 emissions and flags the hotspots worth acting on first.

This repository is a complete, working implementation of the MVP scope defined in the developer proposal: authentication, data import, an interactive supply-chain graph, a map view, charts, a rule-based insights engine, and client-side report export (PDF/CSV/JSON).

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, shadcn/ui-style components (Radix primitives)
- **Database:** PostgreSQL via [Neon](https://neon.tech) (free tier), accessed through Prisma
- **Auth:** NextAuth.js — email/password (Credentials) and Google OAuth
- **Graph:** [@xyflow/react](https://reactflow.dev) (React Flow) for the supply-chain network diagram
- **Maps:** Leaflet + react-leaflet, OpenStreetMap tiles (no API key required)
- **Charts:** Recharts
- **CSV/Excel parsing:** PapaParse, SheetJS — all client-side
- **Reports:** jsPDF + jspdf-autotable, PapaParse, native JSON — all generated in-browser, no server rendering
- **Testing:** Jest (unit) + Playwright (E2E)
- **Hosting:** Vercel (Hobby/free plan)

Every dependency is MIT/BSD/Apache licensed. No paid APIs are called anywhere in the app.

## Getting started

### 1. Prerequisites

- Node.js 18.18+ and npm
- A free [Neon](https://neon.tech) Postgres database (or any Postgres instance)

### 2. Install

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — your Neon (or other Postgres) connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional; leave blank to disable Google sign-in (Credentials login still works)

### 4. Set up the database

```bash
npm run db:push    # creates tables from prisma/schema.prisma
npm run db:seed     # seeds emission factors + a demo org with sample data
```

The seed script creates a demo login: `demo@ecosphere.dev` / `EcoSphereDemo123!`.

### 5. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Project structure

```
app/
  (auth)/login, (auth)/signup        — auth pages
  (dashboard)/dashboard              — summary, graph, map
  (dashboard)/upload                 — CSV/Excel import
  (dashboard)/builder                — manual supply-chain editor
  (dashboard)/analysis               — charts (pie/bar/line)
  (dashboard)/insights               — rule-based hotspot cards
  (dashboard)/reports                — client-side PDF/CSV/JSON export
  (dashboard)/settings               — account + org profile
  api/                                — REST-ish JSON API routes (see below)
components/
  ui/        — shadcn-style primitives (button, card, input, select, tabs…)
  dashboard/ — stat cards, nav, insight cards
  graph/     — React Flow supply-chain diagram
  map/       — Leaflet map (dynamically imported, client-only)
  charts/    — Recharts wrappers (pie/bar/line)
  upload/    — drag-and-drop CSV/Excel form with preview
  landing/   — interactive landing-page demo (no login required)
lib/
  emissions.ts    — Scope 1/2/3 calculation engine (the core formulas)
  insights.ts     — deterministic, rule-based insight generation
  auth.ts         — NextAuth configuration
  prisma.ts       — Prisma client singleton
  validations.ts  — Zod schemas shared by forms and API routes
  reports.ts       — client-side PDF/CSV/JSON generation
prisma/
  schema.prisma   — full data model (Org, Supplier, Facility, Route, Activity, EmissionFactor, Report)
  seed.ts          — emission factors + demo data
__tests__/
  unit/            — Jest tests for emissions.ts and insights.ts
  e2e/             — Playwright tests for signup, demo, and accessibility smoke checks
```

## API routes

All routes are scoped to the signed-in user's organization (single-org-per-user in V1; the schema already supports multiple via the `Membership` join table).

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth session handling |
| `/api/signup` | POST | Create user + first organization |
| `/api/suppliers` | GET/POST | List / batch-create suppliers |
| `/api/facilities` | GET/POST | List / batch-create facilities |
| `/api/routes` | GET/POST | List / batch-create transport routes |
| `/api/activities` | GET/POST | List / batch-create usage records (computes emissions on write) |
| `/api/upload` | POST | Bulk CSV/Excel ingestion (suppliers, facilities, or activities) |
| `/api/dashboard` | GET | Scope totals, top emitters, monthly trend |
| `/api/insights` | GET | Runs the rule-based insight engine |
| `/api/reports` | GET/POST | Report export history (the files themselves are generated client-side) |

## Emissions calculation

Implemented in `lib/emissions.ts`, following the formulas in the proposal exactly:

- **Scope 1** (direct): `CO2e = fuel_amount × fuel_co2_per_unit`
- **Scope 2** (purchased energy): `CO2e = kWh × grid_emission_factor`
- **Scope 3** (indirect/freight): `CO2e = tonne_km × mode_factor`

All factors live in the `EmissionFactor` table (seeded with indicative DEFRA/EPA/GHG-Protocol-style figures — replace with your organization's preferred authoritative source before using this for compliance reporting). No external API calls are made for any calculation.

## Insights engine

`lib/insights.ts` is fully rule-based (no ML/LLM), matching the proposal:
- Top-emitter concentration (supplier or facility > 30% of total)
- High-carbon transport mode flags (air freight share, with rail/sea mode-shift suggestions)
- Scope 2 share warnings (purchased electricity > 30% of total)
- Simple anomaly detection (a facility emitting 3×+ the group average)

## Accessibility

- Semantic landmarks (`header`, `main`, `nav`, `footer`) throughout
- All interactive icons have `aria-label`; charts include a visually-hidden (`sr-only`) data table alongside the visual for screen readers
- Color contrast follows Tailwind's default palette (already AA-compliant) with custom scope colors checked against the background
- Layout reflows to a single column at 320px width (tested in the Playwright suite)
- Keyboard navigation works throughout; the map container is focusable and Leaflet's built-in keyboard pan/zoom is enabled

Run `npm run test:e2e` to execute the Playwright accessibility smoke tests. For deeper coverage, wire `@axe-core/playwright` into the E2E suite — it's not included by default to keep dependencies minimal, but the test file is structured to make adding it straightforward.

## Testing

```bash
npm test            # Jest unit tests (emissions + insights logic)
npm run test:watch  # watch mode
npm run test:e2e    # Playwright E2E (starts the prod server automatically)
```

To run the demo-login E2E test, seed the database first and set `E2E_DEMO_SEEDED=1`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new) — framework preset `Next.js` is auto-detected.
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Deploy. Vercel's Hobby plan is free and covers this app's needs (serverless API routes, CDN-cached static assets, automatic preview deployments on PRs).
5. After the first deploy, run `npm run db:push` and `npm run db:seed` locally (pointed at your Neon `DATABASE_URL`) to initialize the schema.

## What's deliberately deferred (per the proposal's MVP scope)

- Multi-tenant organizations / advanced roles beyond OWNER
- Integrations with government registries (EPA, CDP) or blockchain
- AI/LLM-driven insights (the insights engine is intentionally rule-based)
- Automated ISO compliance reporting, scenario optimization

The schema (`Membership` table, `EmissionScope`/`ActivityType` enums) is already shaped so these can be added without a breaking migration.

## Contributing

Contributions are welcome from developers of all skill levels! EcoSphere participates in open-source programs including GirlScript Summer of Code (GSSoC).

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide — setup, branch naming, commit format, PR process.
- Look for issues labeled [`good first issue`](../../issues?q=label%3A%22good+first+issue%22) to get started.
- Read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2026 Arghya and EcoSphere contributors.

You are free to use, modify, and distribute this software under the terms of the Apache 2.0 license, which also includes an explicit patent grant protecting contributors.
