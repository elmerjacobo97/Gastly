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
- Structure domain code by feature under `features/*`; split internals into `components/`, `server/`, `lib/`, `schemas/`, and `types/` as needed. Do not add barrel files.

## UI And Styling
- Tailwind is v4 via `@tailwindcss/postcss`; there is no `tailwind.config.*`. Theme tokens and Tailwind imports live in `app/globals.css`.
- shadcn is configured in `components.json` with `style: "radix-nova"`, `rsc: true`, `tsx: true`, aliases to `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils`.
- Shared UI primitives live under `components/ui`; use `cn` from `@/lib/utils` for class merging.
- Components are Server Components by default. Add `"use client"` only where hooks, event handlers, or browser APIs require it.

## Tooling Notes
- ESLint uses `eslint-config-next/core-web-vitals` plus `eslint-config-next/typescript` from `eslint.config.mjs`; generated Next output, repo-local skills in `.agents/**`, and `next-env.d.ts` are ignored.
- `next.config.ts` is intentionally empty right now; avoid inventing config unless a change needs it.

## Supabase
- Supabase project: `gastly` (`yadpullgqqehyusoonxs`) in `sa-east-1`; chosen because the user is in Peru.
- Local env uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`; keep real values out of git because `.env*` is ignored.
- Supabase SSR clients live in `lib/supabase/*`; auth session refresh is wired through Next 16 `proxy.ts`.
