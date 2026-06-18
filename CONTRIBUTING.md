# Contributing to EcoSphere

Thank you for your interest in contributing to EcoSphere! This project is open to contributors of all skill levels — whether you're participating in GirlScript Summer of Code (GSSoC), Hacktoberfest, or just want to help build something meaningful.

EcoSphere is a supply-chain carbon intelligence platform built on a fully free and open-source stack. Contributions help sustainability teams everywhere get better tooling.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Get Started](#how-to-get-started)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Good First Issues](#good-first-issues)
- [Development Guidelines](#development-guidelines)
- [Getting Help](#getting-help)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing. We are committed to making participation a welcoming, harassment-free experience for everyone.

---

## How to Get Started

### Prerequisites

- Node.js 18.18 or higher
- npm
- A free [Neon](https://neon.tech) Postgres database (free tier, no credit card needed)
- A GitHub account

### 1. Fork the repository

Click the **Fork** button at the top right of this page. This creates your own copy of EcoSphere under your GitHub account.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR-USERNAME/ecosphere.git
cd ecosphere
```

### 3. Add the upstream remote

This lets you pull in changes from the main repo later:

```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/ecosphere.git
```

### 4. Install dependencies

```bash
npm install
```

### 5. Set up environment variables

```bash
cp .env.example .env
```

Then fill in `.env` with your own values:
- `DATABASE_URL` — from your Neon project dashboard
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- Google OAuth keys are optional — leave blank to skip Google sign-in

### 6. Set up the database

```bash
npm run db:push
npm run db:seed
```

### 7. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`. You should see the EcoSphere landing page.

Demo login (seeded): `demo@ecosphere.dev` / `EcoSphereDemo123!`

---

## Project Structure

```
app/              — Next.js App Router pages and API routes
components/       — React components (ui/, dashboard/, graph/, map/, charts/, upload/, landing/)
lib/              — Core logic: emissions.ts, insights.ts, auth.ts, validations.ts, reports.ts
prisma/           — Schema and seed data
types/            — Shared TypeScript types
hooks/            — Custom React hooks
__tests__/        — Jest unit tests and Playwright E2E tests
public/templates/ — Downloadable CSV template files
```

---

## How to Contribute

### Finding something to work on

- Look for issues labeled **`good first issue`** if you're new — these are scoped small and have clear acceptance criteria.
- Issues labeled **`help wanted`** are open to anyone.
- Issues labeled **`gssoc`** are part of the GirlScript Summer of Code program.
- If you want to work on something not listed, **open an issue first** to discuss it before writing code. This avoids duplicate work and ensures your effort lands as a merged PR.

### Claiming an issue

Comment on the issue saying you'd like to work on it. A maintainer will assign it to you. **Do not submit a PR for an issue that's already assigned to someone else.**

---

## Branch Naming

Always branch off from `main`. Use this naming convention:

| Type | Format | Example |
|---|---|---|
| New feature | `feat/short-description` | `feat/dark-mode-toggle` |
| Bug fix | `fix/short-description` | `fix/map-marker-overlap` |
| Documentation | `docs/short-description` | `docs/update-setup-guide` |
| Tests | `test/short-description` | `test/insights-edge-cases` |
| Refactor | `refactor/short-description` | `refactor/emissions-engine` |
| UI/styling | `ui/short-description` | `ui/mobile-nav-polish` |

```bash
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name
```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): short description

Optional longer body explaining what and why (not how).
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(insights): add carbon intensity per revenue metric
fix(map): prevent marker overlap when coordinates are identical
docs(contributing): clarify branch naming conventions
test(emissions): add edge cases for zero-amount activities
```

Keep the first line under 72 characters. Use the imperative mood ("add", not "added" or "adds").

---

## Pull Request Process

1. **Make sure your branch is up to date** with `main` before opening a PR:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run the full test suite** before submitting:
   ```bash
   npm test
   npm run lint
   ```
   Fix any failures before opening the PR — PRs that fail CI won't be reviewed.

3. **Open the PR against `main`** on the original repo (not your fork's main).

4. **Fill in the PR template** completely:
   - What does this PR do?
   - Which issue does it close? (use `Closes #123`)
   - Screenshots/screen recordings for any UI changes
   - Any breaking changes or migration notes

5. **Keep PRs small and focused.** One PR = one logical change. Large PRs that touch many unrelated files are very hard to review and often get deprioritized.

6. A maintainer will review your PR within a few days. You may be asked to make changes — this is normal and not a rejection. Update your branch and push; the PR will update automatically.

7. Once approved, a maintainer will merge your PR. Do not merge your own PRs.

---

## Good First Issues

If you're just getting started, here are the kinds of things typically labeled `good first issue` in this project:

- Adding a new emission factor category (e.g. a new country's electricity grid factor)
- Improving accessibility of an existing component (better ARIA labels, keyboard nav)
- Adding a missing unit test for an edge case in `lib/emissions.ts` or `lib/insights.ts`
- Fixing a UI inconsistency on mobile
- Improving error messages shown to the user when CSV upload fails
- Adding a new insight rule in `lib/insights.ts`
- Translating the UI (i18n setup first, then translation PRs)

---

## Development Guidelines

### TypeScript

- All new code must be TypeScript. No plain `.js` files in `app/`, `components/`, or `lib/`.
- Avoid `any` types except where genuinely necessary. Add a comment explaining why if you do use it.
- Run `npx tsc --noEmit` to check for type errors before submitting.

### Components

- Follow the existing component patterns — shadcn/ui-style primitives in `components/ui/`, page-specific components closer to the page.
- Client components (`'use client'`) only where actually needed.
- All icons need `aria-hidden="true"` when decorative, or `aria-label` when they're the only content in a button.

### Emissions logic

- Changes to `lib/emissions.ts` or `lib/insights.ts` **must** come with corresponding test updates in `__tests__/unit/`.
- Do not change existing emission factor values without a citation.

### Styling

- Use Tailwind utility classes only. No inline styles, no external CSS files (except `app/globals.css`).
- Responsive first — test at 320px width and desktop. No horizontal scroll at 320px.
- Dark mode is supported via CSS variables — test both modes if your change touches colors.

### Testing

- New features should have at least one unit test if they touch calculation or business logic.
- Bug fixes should have a test that would have caught the bug.
- Run `npm test` before submitting a PR. All tests must pass.

---

## Getting Help

- **Open a GitHub Discussion** for general questions.
- **Comment on the issue** you're working on if you get stuck.
- **Do not** open a new issue just to ask a question — use Discussions for that.

---

## Recognition

All contributors are listed in the project's GitHub contributor graph. For GSSoC participants, point allocations follow the program's standard guidelines:

- **Level 1 (easy):** documentation, small UI fixes, new unit tests
- **Level 2 (medium):** new features, bug fixes with tests, new insight rules
- **Level 3 (hard):** architectural changes, new pages, performance improvements

Thank you for helping make supply-chain carbon data more accessible. 🌍
