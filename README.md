# EcoSphere

[![CI](https://github.com/arghya29/EcoSphere/actions/workflows/ci.yml/badge.svg)](https://github.com/arghya29/EcoSphere/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://eco-sphere-pi.vercel.app)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)](./CONTRIBUTING.md)
![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red.svg)

Supply-chain carbon intelligence, built entirely on free and open-source tools. Map your suppliers, facilities, and transport routes, import usage data, and EcoSphere computes Scope 1, 2, and 3 emissions and flags the hotspots worth acting on first.

**Live demo:** [eco-sphere-pi.vercel.app](https://eco-sphere-pi.vercel.app) — try it without signing up using the interactive landing page demo, or log in with the seeded demo account (`demo@ecosphere.dev` / `EcoSphereDemo123!`).

---

## Features

- **Interactive supply-chain graph** — drag-and-drop network diagram (React Flow) showing suppliers, facilities, and transport routes
- **Map view** — geolocated suppliers and routes on an OpenStreetMap-powered Leaflet map
- **Scope 1, 2, and 3 emissions** — calculated automatically from your data using published emission factors, no external API calls
- **CSV/Excel import** — upload suppliers, facilities, and activity data with a live preview before saving
- **Rule-based insights** — automatically surfaces your top emitters, high-carbon transport modes, and reduction opportunities
- **Charts** — pie, bar, and line charts (Recharts) for scope breakdown, top emitters, and monthly trend
- **Report export** — PDF, CSV, and JSON reports generated entirely in the browser (jsPDF, PapaParse)
- **Dark/light theme** — dark by default, togglable on every page, remembers your choice
- **Google OAuth + email/password** — NextAuth.js authentication with both providers
- **Fully accessible** — semantic HTML, ARIA labels, keyboard navigation, WCAG AA colour contrast, reflows at 320px

---

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, shadcn/ui-style components (Radix primitives)
- **Database:** PostgreSQL via [Neon](https://neon.tech) (free tier), accessed through Prisma
- **Auth:** NextAuth.js — email/password (Credentials) and Google OAuth
- **Graph:** [@xyflow/react](https://reactflow.dev) (React Flow)
- **Maps:** Leaflet + react-leaflet, OpenStreetMap tiles (no API key required)
- **Charts:** Recharts
- **Theme:** next-themes
- **CSV/Excel parsing:** PapaParse, SheetJS — all client-side
- **Reports:** jsPDF + jspdf-autotable, PapaParse, native JSON — all in-browser
- **Testing:** Jest (unit) + Playwright (E2E)
- **Hosting:** Vercel (Hobby/free plan)
- **Code review:** CodeRabbit (automated AI review on every PR)

Every dependency is MIT/BSD/Apache licensed. No paid APIs are called anywhere in the app.

---

## Getting started

### Prerequisites

- Node.js 18.18+ and npm
- A free [Neon](https://neon.tech) Postgres database (no credit card needed)

### 1. Fork and clone

```bash
git clone https://github.com/YOUR-USERNAME/EcoSphere.git
cd EcoSphere
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:
- `DATABASE_URL` — your Neon connection string (use the pooled string for Vercel)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, leave blank to disable Google sign-in

### 4. Set up the database

```bash
npm run db:push    # creates tables from prisma/schema.prisma
npm run db:seed    # seeds emission factors + demo org with sample data
```

Demo login: `demo@ecosphere.dev` / `EcoSphereDemo123!`

For contributor onboarding and developer testing, you can also seed a larger dedicated demo dataset and reset it:

```bash
npm run seed:demo   # seeds 1 org, 3 suppliers, 3 facilities, 3 routes, and 10 activities
npm run reset:demo  # deletes the seeded developer dataset cleanly
```

Demo seed login: `demo-seed-user@ecosphere.dev` / `DemoSeedUser123!`

### 5. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

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
  api/                               — REST-ish JSON API routes
components/
  ui/        — shadcn-style primitives (button, card, input, select, tabs…)
  auth/      — login/signup form components
  shared/    — theme provider, theme toggle, session provider
  dashboard/ — stat cards, nav, insight cards
  graph/     — React Flow supply-chain diagram
  map/       — Leaflet map (dynamically imported, client-only)
  charts/    — Recharts wrappers (pie/bar/line)
  upload/    — drag-and-drop CSV/Excel form with preview
  landing/   — interactive landing-page demo (no login required)
lib/
  emissions.ts   — Scope 1/2/3 calculation engine
  insights.ts    — deterministic, rule-based insight generation
  auth.ts        — NextAuth configuration
  prisma.ts      — Prisma client singleton
  validations.ts — Zod schemas shared by forms and API routes
  reports.ts     — client-side PDF/CSV/JSON generation
prisma/
  schema.prisma  — full data model
  seed.ts        — emission factors + demo data
__tests__/
  unit/          — Jest tests for emissions.ts and insights.ts
  e2e/           — Playwright tests for signup, demo, accessibility
```

---

## API routes

All routes are scoped to the signed-in user's organization.

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth session handling |
| `/api/signup` | POST | Create user + first organization |
| `/api/suppliers` | GET/POST | List / batch-create suppliers |
| `/api/facilities` | GET/POST | List / batch-create facilities |
| `/api/routes` | GET/POST | List / batch-create transport routes |
| `/api/activities` | GET/POST | List / batch-create usage records |
| `/api/upload` | POST | Bulk CSV/Excel ingestion |
| `/api/dashboard` | GET | Scope totals, top emitters, monthly trend |
| `/api/insights` | GET | Runs the rule-based insight engine |
| `/api/reports` | GET/POST | Report export history |

---

## Emissions calculation

Implemented in `lib/emissions.ts`:

- **Scope 1** (direct): `CO2e = fuel_amount × fuel_co2_per_unit`
- **Scope 2** (purchased energy): `CO2e = kWh × grid_emission_factor`
- **Scope 3** (indirect/freight): `CO2e = tonne_km × mode_factor`

All factors live in the `EmissionFactor` table (seeded with indicative DEFRA/EPA/GHG-Protocol-style figures). No external API calls are made for any calculation.

---

## Insights engine

`lib/insights.ts` is fully rule-based (no ML/LLM):
- Top-emitter concentration (supplier or facility > 30% of total)
- High-carbon transport mode flags (air freight, with rail/sea mode-shift suggestions)
- Scope 2 share warnings (purchased electricity > 30% of total)
- Anomaly detection (a facility emitting 3×+ its peer average)

---

## Testing

```bash
npm test             # Jest unit tests (emissions + insights logic)
npm run test:watch   # watch mode
npm run test:e2e     # Playwright E2E
```

---

## Deploying to Vercel

1. Push to GitHub.
2. Import at [vercel.com/new](https://vercel.com/new) — Next.js preset is auto-detected.
3. Add environment variables from `.env.example` in Vercel project settings. Set `NEXTAUTH_URL` to your deployed URL (e.g. `https://your-app.vercel.app`).
4. Deploy. After the first deploy, run `npm run db:push` and `npm run db:seed` locally against your production `DATABASE_URL`.

---

## What's deliberately deferred

- Multi-tenant organizations / advanced roles beyond OWNER
- Integrations with government registries (EPA, CDP) or blockchain
- AI/LLM-driven insights (the insights engine is intentionally rule-based)
- Automated ISO compliance reporting, scenario optimization

The schema is already shaped so these can be added without a breaking migration.

---

## Contributing

Contributions are welcome from developers of all skill levels!

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.
- Look for issues labeled [`good first issue`](https://github.com/arghya29/EcoSphere/issues?q=label%3A%22good+first+issue%22) to get started.
- Read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
- Every PR is automatically reviewed by [CodeRabbit](https://coderabbit.ai) — you'll get feedback within minutes of opening a PR.

---

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2026 Arghya and EcoSphere contributors.