# AGENTS.md

## Commands

- Use `pnpm` (pinned as `pnpm@11.21.0`). A single `pnpm-lock.yaml` at the repo root covers the whole workspace; do not add nested lockfiles.
- Root scripts run through Turborepo and cover every workspace package:
  - `pnpm dev` — `turbo run dev --filter=web`; Next dev server at `http://localhost:3000`.
  - `pnpm build` — `turbo run build` (Next production build plus TypeScript check; also compiles the CLI to `dist/`).
  - `pnpm lint` — `turbo run lint`.
  - `pnpm typecheck` — `turbo run typecheck` (`tsc --noEmit` in `apps/web`).
  - `pnpm test` — Vitest in `apps/web` and `packages/cli`, plus Deno unit tests for shared Edge Function helpers.
  - `pnpm edge:check` — type-checks the `send-reminders` and `telegram-bot` Edge Functions with the `supabase/functions/deno.json` import map.
  - `pnpm format` / `pnpm format:check` — Prettier over the repo; `.prettierignore` excludes `packages/cli`, `apps/web/components/ui`, and generated dirs.
  - `pnpm check` — format check, Turbo lint/typecheck/build, all Vitest + Deno tests, and Edge Function type-check.
  - `pnpm publish:cli` — builds and publishes `@codigoconelmer/gastly-cli` from the repo root.
- Target one package with `pnpm --filter web <script>` or `pnpm --filter @codigoconelmer/gastly-cli <script>`.
- Turbo caches `build`, `lint`, `typecheck`, and `test`; `dev` is persistent and uncached.
- Never claim tests passed without running them.

## Repo Layout

- pnpm workspace + Turborepo monorepo. `pnpm-workspace.yaml` globs `apps/*` and `packages/*`; `turbo.json` defines the task graph.
- `apps/web/` — the Next.js 16 App Router app. Paths in the App Shape, UI, Tooling, and Supabase sections below are relative to this directory unless stated otherwise.
- `packages/cli/` — `@codigoconelmer/gastly-cli`: TypeScript compiled with `tsc` to `dist/`, tests with Vitest, published from the repo root with `pnpm publish:cli`.
- `supabase/` — shared backend infrastructure: `migrations/`, `functions/` (`send-reminders`, `telegram-bot`), `config.toml`.
- `docs/` — supporting docs (email, Telegram, reminders).
- `graphify-out/` — generated knowledge graph; query it before broad code exploration.

## App Shape

- Next.js 16 App Router app rooted at `apps/web/`. Main entrypoints are `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, and `apps/web/app/globals.css`.
- The TypeScript alias `@/*` maps to the `apps/web/` root.
- This project uses Next 16; use `apps/web/proxy.ts` with exported `proxy()` for request interception, not deprecated `middleware.ts`.
- Features are fully self-contained under `apps/web/features/<domain>/` (accounts, auth, categories, custody, dashboard, installments, loans, monthly-plan, recurring-payments, reports, savings, settings, transactions), each with a subset of `{components,schemas,types,server,lib}`. Features do not import each other.
- Data layer per feature: `features/<domain>/server/queries.ts` (server Supabase client fetch) and `features/<domain>/server/actions.ts` (`"use server"` mutations ending in `revalidatePath`). `features/<domain>/lib/` holds pure helpers only.
- Server-first pattern (see `features/custody/` or `features/savings/` as reference): `app/**/page.tsx` fetches via `server/queries.ts` and passes data as props; panels are thin client orchestrators (dialog state + selection) composed from server sections; dialogs call `server/actions.ts` via `useTransition` + `toast`. Route-level `loading.tsx` replaces per-query skeletons.
- `apps/web/components/` (including `components/ui/`) and `apps/web/lib/` are the shared namespace. When a component is needed by multiple features, move it to `components/` (e.g. `components/category-select.tsx`) or compose it as a slot prop from the route file (`app/**` may import any feature). Do not add barrel files.

## Testing

- Vitest 3 in `apps/web`, configured in `apps/web/vitest.config.ts`: `environment: "node"` and the `@` alias mapped to the app root.
- Tests are colocated next to the module they cover (`foo.test.ts`). Existing tests target pure helpers and schemas. For `server-only` modules, mock the guard with `vi.mock("server-only", () => ({}))`.
- No React Testing Library, Playwright, or component/end-to-end tests yet; add them only when the task requires it.
- `packages/cli` has its own Vitest suite under `packages/cli/src/__tests__/` (flag parsing, config/session parsing, formatting).
- Deno Edge Function helpers have unit tests in `supabase/functions/_shared/`; run them with `pnpm edge:test`.
- `pnpm test` runs both suites through Turbo. Run the focused test file while iterating; report only tests actually executed.

## Architectural Exceptions

These are deliberate decisions, not hidden debt. Match them; do not "fix" them without asking.

- Shared code lives in `apps/web/components/` and `apps/web/lib/`, not in `src/shared/` as the next-architecture skill prefers. Keep one namespace; do not duplicate it.
- Feature layers are `server/` (queries + actions) and `lib/` (pure helpers), not the skill's `services/` + `actions/` + `utils/` split.
- `apps/web/components/quick-create-category-dialog.tsx`, `quick-create-account-dialog.tsx`, and `create-transaction-dialog.tsx` import actions/schemas from features (shared → feature). Accepted while they live in `components/`; if one moves into a feature, pass it as a slot prop from the route file instead.

## UI And Styling

- Tailwind is v4 via `@tailwindcss/postcss`; there is no `tailwind.config.*`. Theme tokens and Tailwind imports live in `apps/web/app/globals.css`.
- shadcn is configured in `apps/web/components.json` with `style: "radix-nova"`, `rsc: true`, `tsx: true`, aliases to `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils`.
- Shared UI primitives live under `apps/web/components/ui`; do not hand-edit generated primitives (Prettier ignores that directory). Use `cn` from `@/lib/utils` for class merging.
- Components are Server Components by default. Add `"use client"` only where hooks, event handlers, or browser APIs require it.

## Tooling Notes

- ESLint uses `eslint-config-next/core-web-vitals` plus `eslint-config-next/typescript` from `apps/web/eslint.config.mjs`; generated Next output, repo-local skills in `.agents/**`, and `next-env.d.ts` are ignored.
- TypeScript is v6 in `apps/web` (the JS-API line). Do not bump to 7 (`tsgo`): `typescript-eslint`/`@typescript-eslint/typescript-estree` do not support TS 7 yet, and the TS 7 npm package ships no `lib/typescript.js` JS API, which breaks `pnpm lint` through `eslint-config-next`. `packages/cli` pins its own TypeScript 5.8 toolchain.
- TanStack Table is v9: configure tables with `tableFeatures({...})` + `useTable({ features, ... })` from `@tanstack/react-table`; column defs are `ColumnDef<Features, TData>`. See `apps/web/components/ui/data-table.tsx` for the working setup (exports `DataTableFeatures`).
- Zod is v4 in `apps/web`: import from `zod` (not `zod/v3`). Forms with `z.coerce` fields use `resolver: zodResolver(schema) as Resolver<XValues>` (see any `*-dialog.tsx`). The CLI still uses zod 3 and stays on it until migrated.
- `apps/web/next.config.ts` only sets `devIndicators: false`; avoid inventing config unless a change needs it.

## Supabase

- Supabase project: `gastly` (`yadpullgqqehyusoonxs`) in `sa-east-1`; chosen because the user is in Peru.
- Local env uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `apps/web/.env.local` (template in `apps/web/.env.example`); keep real values out of git because `.env*` is ignored.
- Supabase SSR clients live in `apps/web/lib/supabase/*` (`server.ts`, `proxy.ts`, `admin.ts`, `env.ts`); auth session refresh is wired through Next 16 `apps/web/proxy.ts`.
- Migrations and edge functions live in the root `supabase/` directory, shared by local and production.
- RLS is enforced in Supabase. Keep `import "server-only"` on privileged modules (`lib/supabase/admin.ts`, `lib/calendar-token.ts`, and feature `server/queries.ts` files).

## Deployment

- Production runs on Vercel + Supabase cloud. The Vercel project's Root Directory must be `apps/web` (manual dashboard action, still pending). GitHub Actions runs `pnpm check` on pushes and pull requests; configure branch protection separately if checks should be required to merge.
- Apply production migrations from the repo root with `supabase db push` (link first with `supabase link --project-ref yadpullgqqehyusoonxs` if needed).
- Production env vars are the same two `NEXT_PUBLIC_*` Supabase values.

## gastly-cli

- CLI lives in `packages/cli/` as a workspace package, published independently as `@codigoconelmer/gastly-cli`.
- Build: `pnpm --filter @codigoconelmer/gastly-cli build` (tsc → `dist/`). Test: `pnpm --filter @codigoconelmer/gastly-cli test` (vitest). Publish: `pnpm publish:cli` from the repo root.
- Agent docs: `packages/cli/SKILL.md`. Copy to `~/.claude/skills/gastly-cli/SKILL.md` for global discovery.
- Quick reference: `gastly-cli transactions new --type expense --amount 100 -d "desc" --json`, `gastly-cli debts --json`.

<!-- headroom:rtk-instructions -->

# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands

```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules

- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage

<!-- /headroom:rtk-instructions -->
