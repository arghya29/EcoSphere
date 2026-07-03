# EcoSphere Architecture

## Overview

EcoSphere is a supply-chain carbon intelligence platform built with Next.js 14 (App Router). It allows users to map suppliers, facilities, and transport routes, import usage data, and compute Scope 1, 2, and 3 emissions.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, Radix UI primitives, class-variance-authority |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Authentication | NextAuth.js v4 (Credentials + Google OAuth), JWT strategy |
| Charts | Recharts |
| Graph Visualization | @xyflow/react (React Flow) |
| Maps | Leaflet + react-leaflet (OpenStreetMap, no API key) |
| CSV/Excel | PapaParse, SheetJS (client-side) |
| PDF Reports | jsPDF + jspdf-autotable (client-side) |
| Testing | Jest (unit), Playwright (E2E) |

## Directory Structure

```
app/
  (auth)/           # Login and signup pages
  (dashboard)/      # Protected dashboard pages
    dashboard/      # Summary stats, graph, map
    upload/         # CSV/Excel import
    builder/        # Manual supply-chain editor
    analysis/       # Emissions breakdown charts
    insights/       # Rule-based insight cards
    reports/        # PDF/CSV/JSON export
    profile/        # User profile
    settings/       # Organization settings
  api/              # REST API routes
components/
  ui/               # shadcn-style primitives (Button, Card, Input, etc.)
  auth/             # Login/signup form components
  shared/           # ThemeProvider, ThemeToggle, SessionProvider
  dashboard/        # DashboardNav, DashboardStats, InsightCard
  graph/            # React Flow supply-chain diagram
  map/              # Leaflet map (client-only, dynamically imported)
  charts/           # Recharts wrappers (Pie, Bar, Line)
  upload/           # Drag-and-drop CSV/Excel form
  builder/          # EntityForm, ManageList
  landing/          # Interactive landing-page demo
lib/
  auth.ts           # NextAuth configuration
  prisma.ts         # Prisma client singleton
  session.ts        # requireOrg() middleware
  emissions.ts      # Scope 1/2/3 calculation engine
  insights.ts       # Rule-based insight generation
  reports.ts        # Client-side PDF/CSV/JSON generation
  validations.ts    # Zod schemas
  utils.ts          # cn(), formatKg(), findUnauthorizedIds()
  csv-parser.ts     # Client-side CSV/XLSX parsing
prisma/
  schema.prisma     # Full data model
  seed.ts           # Emission factors + demo data
hooks/
  use-api.ts        # Generic data-fetching hook with retry
  use-mutation.ts   # POST/PUT/DELETE mutation hook
types/
  api.ts            # Client-facing API response types
```

## Data Flow

### Authentication Flow

1. User visits a dashboard page
2. `(dashboard)/layout.tsx` calls `getServerSession(authOptions)` server-side
3. If no session, redirect to `/login`
4. Login form calls `signIn('credentials')` with email/password
5. NextAuth JWT callback embeds `user.id` in the token
6. Client-side `useSession()` provides user info for Profile/Settings

### API Request Flow

1. Client calls `/api/*` endpoint
2. API route calls `requireOrg()` to get session + organization context
3. Queries are scoped to `organizationId`
4. Response returns `{ success: boolean, data: T, error?: string }`

### Emissions Calculation Flow

1. Activity data is stored with `amount`, `unit`, and `factor_category`
2. On upload, the API resolves the `EmissionFactor` by category
3. `emissionsKg = amount * factor.co2PerUnit` (from `lib/emissions.ts`)
4. Scope is determined by the factor's scope (SCOPE_1, SCOPE_2, SCOPE_3)
5. Dashboard API aggregates by scope, entity, and month

## Key Design Decisions

- **No external API calls**: All emissions calculations, chart rendering, and report generation happen client-side or in the Next.js API routes without paid API dependencies
- **Rule-based insights**: The insight engine (`lib/insights.ts`) uses deterministic thresholds, not ML/LLM
- **Cross-org security**: `requireOrg()` in `lib/session.ts` ensures every query is scoped to the user's organization
- **Owner-chip pattern**: upload-related FK ownership checks use `findUnauthorizedIds()` to reject cross-org references before writes
