# AGENTS.md

## Commands
- Use `pnpm`; `pnpm-lock.yaml` is the committed lockfile. The README is still the generic create-next-app text and lists other package managers.
- `pnpm dev` starts the Next dev server at `http://localhost:3000`.
- `pnpm lint` runs the only configured lint check (`eslint`).
- `pnpm build` is the production verification path and also runs the Next TypeScript check. There is no standalone `typecheck` script.
- No test runner or test script is configured yet; do not claim tests passed unless you add/configure one.

## App Shape
- This is a single Next.js App Router project rooted at the repo root, not a multi-package monorepo. `pnpm-workspace.yaml` only contains pnpm dependency build settings.
- Main entrypoints are `app/layout.tsx`, `app/page.tsx`, and `app/globals.css`.
- The TypeScript alias `@/*` maps to the repository root.
- This project uses Next 16; use root `proxy.ts` with exported `proxy()` for request interception, not deprecated `middleware.ts`.
- Features are fully self-contained under `features/<domain>/{components,schemas,types,server,lib,hooks}` (accounts, auth, budget, categories, custody, installments, loans, monthly-plan, recurring-payments, savings, settings, transactions). Features do not import each other.
- Data layer per feature: `features/<domain>/server/queries.ts` (server Supabase client fetch) and `features/<domain>/server/actions.ts` (`"use server"` mutations ending in `revalidatePath`). `features/<domain>/lib/` holds pure helpers only; `hooks/` is legacy TanStack Query, being removed as features migrate.
- Server-first pattern (see `features/custody/` or `features/savings/` as reference): `app/**/page.tsx` fetches via `server/queries.ts` and passes data as props; panels are thin client orchestrators (dialog state + selection) composed from server sections; dialogs call `server/actions.ts` via `useTransition` + `toast`. Route-level `loading.tsx` replaces per-query skeletons.
- When a component is needed by multiple features, move it to `components/` (e.g. `components/category-select.tsx`) or compose it as a slot prop from the route file (`app/**` may import any feature).
- Do not add barrel files.

## UI And Styling
- Tailwind is v4 via `@tailwindcss/postcss`; there is no `tailwind.config.*`. Theme tokens and Tailwind imports live in `app/globals.css`.
- shadcn is configured in `components.json` with `style: "radix-nova"`, `rsc: true`, `tsx: true`, aliases to `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils`.
- Shared UI primitives live under `components/ui`; use `cn` from `@/lib/utils` for class merging.
- Components are Server Components by default. Add `"use client"` only where hooks, event handlers, or browser APIs require it.

## Tooling Notes
- ESLint uses `eslint-config-next/core-web-vitals` plus `eslint-config-next/typescript` from `eslint.config.mjs`; generated Next output, repo-local skills in `.agents/**`, and `next-env.d.ts` are ignored.
- TypeScript is v6 (the JS-API line). Do not bump to 7 (`tsgo`): `typescript-eslint`/`@typescript-eslint/typescript-estree` do not support TS 7 yet, and the TS 7 npm package ships no `lib/typescript.js` JS API, which breaks `pnpm lint` through `eslint-config-next`.
- TanStack Table is v9: configure tables with `tableFeatures({...})` + `useTable({ features, ... })` from `@tanstack/react-table`; column defs are `ColumnDef<Features, TData>`. See `components/ui/data-table.tsx` for the working setup (exports `DataTableFeatures`).
- Zod is v4: import from `zod` (not `zod/v3`). Forms with `z.coerce` fields use `resolver: zodResolver(schema) as Resolver<XValues>` (see any `*-dialog.tsx`).
- `next.config.ts` only sets `devIndicators: false`; avoid inventing config unless a change needs it.

## Supabase
- Supabase project: `gastly` (`yadpullgqqehyusoonxs`) in `sa-east-1`; chosen because the user is in Peru.
- Local env uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`; keep real values out of git because `.env*` is ignored.
- Supabase SSR clients live in `lib/supabase/*`; auth session refresh is wired through Next 16 `proxy.ts`.


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
