# Gastly

Personal finance tracker — income, expenses, budgets, installments, loans, and recurring payments. Built as a pnpm + Turborepo monorepo with a Next.js 16 web app and a published CLI.

## Repository Layout

```
apps/web/       Next.js 16 App Router app (features, components, Supabase clients)
packages/cli/   @codigoconelmer/gastly-cli
supabase/       Migrations and edge functions (shared infrastructure)
docs/           Supporting documentation
```

Agent conventions live in [AGENTS.md](AGENTS.md). It is the source of truth for architecture, commands, and rules.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Framework:** Next.js 16 App Router (`apps/web`)
- **Database:** Supabase (PostgreSQL + Auth)
- **Data layer:** Server Components + Server Actions (server-first)
- **Validation:** Zod
- **UI:** shadcn/ui + Tailwind v4
- **CLI:** `@codigoconelmer/gastly-cli` (`packages/cli`)
- **Deploy:** Vercel

## Local Development

Requires [Docker](https://www.docker.com/) for the local Supabase stack.

### 1. Install dependencies

Run from the repository root:

```bash
pnpm install
```

### 2. Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

### 3. Start local Supabase

```bash
supabase start
```

This spins up a local PostgreSQL + Auth stack and applies all migrations automatically.

### 4. Configure environment

Create `apps/web/.env.local` (template in `apps/web/.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from supabase status>
```

Run `supabase status` to get the keys.

### 5. Run the dev server

```bash
pnpm dev
```

Turborepo filters the web app. The app runs at [http://localhost:3000](http://localhost:3000).
Email confirmations are captured by Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324).

## Commands

| Command                             | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm dev`                          | Next dev server for `apps/web`                 |
| `pnpm build`                        | Build all packages (Next + CLI `dist/`)        |
| `pnpm lint`                         | ESLint across packages                         |
| `pnpm typecheck`                    | `tsc --noEmit` in `apps/web`                   |
| `pnpm test`                         | Vitest for `apps/web` and `packages/cli`       |
| `pnpm format` / `pnpm format:check` | Prettier write / check                         |
| `pnpm check`                        | Prettier + lint + typecheck + test + build     |
| `pnpm publish:cli`                  | Build and publish `@codigoconelmer/gastly-cli` |

Scope a command to one package with `pnpm --filter web <script>` or `pnpm --filter @codigoconelmer/gastly-cli <script>`.

## CLI

```bash
npm install -g @codigoconelmer/gastly-cli
gastly-cli --help
```

Usage reference: [packages/cli/README.md](packages/cli/README.md). Agent patterns: [packages/cli/SKILL.md](packages/cli/SKILL.md). Publish a new version from the repo root with `pnpm publish:cli`.

## Email

See [docs/email.md](docs/email.md) for Resend SMTP setup, auth email flows, and template configuration.

## Database Migrations

All schema changes go through migration files in `supabase/migrations/`.

```bash
# Create a new migration
supabase migration new describe_the_change

# Edit the generated file in supabase/migrations/
# Then apply to local DB
supabase db reset
```

## Deployment

Production runs on Vercel + Supabase cloud. There is no CI; run `pnpm check` locally before deploying.

### Vercel

- Root Directory must be `apps/web` (set manually in the Vercel project settings).
- Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<prod anon key>
```

### Apply migrations to production

```bash
supabase db push
```

If not yet linked to the production project:

```bash
supabase link --project-ref yadpullgqqehyusoonxs
supabase db push
```

Set Site URL and redirect URL in Supabase dashboard → Authentication:

- Site URL: `https://gastly.elmerjacobo.dev`
- Redirect URL: `https://gastly.elmerjacobo.dev/**`
