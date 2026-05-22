# Gastly

Personal finance tracker — income, expenses, budgets, installments, loans, and recurring payments. Built with Next.js 16 App Router + Supabase + React Query.

## Stack

- **Framework:** Next.js 16 App Router
- **Database:** Supabase (PostgreSQL + Auth)
- **State:** TanStack Query v5
- **UI:** shadcn/ui + Tailwind v4
- **Deploy:** Vercel

## Local Development

Requires [Docker](https://www.docker.com/) for the local Supabase stack.

### 1. Install dependencies

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

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from supabase status>
```

Run `supabase status` to get the keys.

### 5. Run the dev server

```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).
Email confirmations are captured by Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324).

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

Production runs on Vercel + Supabase cloud.

### Apply migrations to production

```bash
supabase db push
```

If not yet linked to the production project:

```bash
supabase link --project-ref yadpullgqqehyusoonxs
supabase db push
```

### Vercel environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<prod anon key>
```

Set Site URL and redirect URL in Supabase dashboard → Authentication:
- Site URL: `https://gastly.elmerjacobo.dev`
- Redirect URL: `https://gastly.elmerjacobo.dev/**`
