# Setup Guide

## Prerequisites

- Node.js 18.18+ (check with `node --version`)
- npm (comes with Node.js)
- A free [Neon](https://neon.tech) Postgres database account
- A GitHub account

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR-USERNAME/EcoSphere.git
cd EcoSphere
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with these values:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | Yes |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate | Yes |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No (leave blank) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No (leave blank) |

### 3. Set up the database

```bash
npm run db:push    # Creates tables from Prisma schema
npm run db:seed    # Seeds emission factors + demo org
```

### 4. Start development

```bash
npm run dev
```

Open `http://localhost:3000`.

### 5. Demo login

Use these credentials to explore the app:
- **Email:** `demo@ecosphere.dev`
- **Password:** `EcoSphereDemo123!`

## Troubleshooting

### `prisma: error - Environment variable not found: DATABASE_URL`

Make sure you've created the `.env` file from `.env.example` and filled in the `DATABASE_URL` with your Neon connection string.

### `Error: getaddrinfo ENOTFOUND` on database connection

Check that your Neon database is active. Free tier databases may pause after 7 days of inactivity — wake it up by running a query in the Neon console.

### Build fails with TypeScript errors

Run `npx tsc --noEmit` to identify type errors. Common issues:
- Missing types in `@types/*` packages (run `npm install` again)
- Using `any` types without comments

### Login always fails with "Incorrect email or password"

- Make sure you ran `npm run db:seed` to create the demo user
- Check that the `NEXTAUTH_SECRET` is set correctly
- Verify the database connection is working

### Map tiles not loading

The Leaflet map uses OpenStreetMap tiles, which require internet access. If you're behind a corporate proxy or firewall, the tiles may not load. This doesn't affect functionality.

## Production Deployment (Vercel)

1. Push your repository to GitHub
2. Import the project on [Vercel](https://vercel.com/new)
3. Set environment variables in Vercel project settings:
   - `DATABASE_URL`: Use the pooled connection string from Neon
   - `NEXTAUTH_SECRET`: Generate a new secret
   - `NEXTAUTH_URL`: Set to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
4. Deploy
5. Apply schema changes to production through your migration workflow before or during deployment. Do not run `db:push` or `db:seed` against production; reserve seeding for local development or staging data.

## Testing

```bash
npm test             # Jest unit tests
npm run test:watch   # Watch mode
npm run test:e2e     # Playwright E2E tests
```

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run Jest tests |
| `npm run test:e2e` | Run Playwright tests |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Create a new migration |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio |
