# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — start dev server at `http://localhost:3000`
- `pnpm build` — production build + TypeScript check (no separate typecheck script)
- `pnpm lint` — ESLint via `eslint-config-next/core-web-vitals` + `typescript`
- No test runner configured; do not claim tests passed

## Architecture

**Gastly** is a personal finance tracker (income, expenses, budgets, categories) built with Next.js 16 App Router + Supabase + React Query.

### Route structure

```
app/
  (auth)/          — login, sign-up, check-email (unauthenticated layout)
  dashboard/       — protected layout with AppSidebar; pages: /, /income, /expenses, /categories, /budget
  layout.tsx       — root layout wrapping <Providers>
  page.tsx         — redirects to /dashboard
```

### Request interception

Next 16 uses `proxy.ts` (not `middleware.ts`). Export `proxy()` from `proxy.ts` for auth session refresh. The `proxy()` calls `updateSession` from `lib/supabase/proxy.ts`.

### Feature structure

Domain code lives in `features/<domain>/` split into:
- `components/` — React components for that domain
- `lib/` — API functions (Supabase calls using browser client)
- `schemas/` — Zod schemas + inferred types for forms
- `types/` — plain TypeScript types for data models
- `server/` — Server Actions (auth only, so far)

No barrel files (`index.ts`). Import directly from sub-paths.

### Data layer

- All Supabase queries in `features/*/lib/*-api.ts` use the **browser client** (`lib/supabase/browser.ts`) and are called from Client Components via React Query.
- Server Actions in `features/auth/server/actions.ts` use the **server client** (`lib/supabase/server.ts`).
- `lib/supabase/` has four files: `browser.ts`, `server.ts`, `proxy.ts`, `env.ts`.
- React Query `staleTime` default: 30s (set in `app/providers.tsx`).
- DB columns are `snake_case`; TypeScript models are `camelCase` — map in the `*-api.ts` file.

### UI

- Tailwind v4 via `@tailwindcss/postcss`; **no `tailwind.config.*`**. Theme tokens in `app/globals.css`.
- shadcn style: `radix-nova`. Add components with `pnpm dlx shadcn add <component>`.
- Shared primitives: `components/ui/`. Class merging: `cn()` from `@/lib/utils`.
- Components are Server Components by default; add `"use client"` only when hooks/events/browser APIs require it.
- Toasts via `sonner` (`<Toaster richColors />` in `<Providers>`).
- Theme: `next-themes` with `attribute="class"` and system default.

## Supabase

- Project: `gastly` (`yadpullgqqehyusoonxs`), region `sa-east-1`.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (git-ignored).
- Auth redirect after login: `/dashboard`.
