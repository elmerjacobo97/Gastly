# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation
1. **[2026-05-20] Validate with configured scripts only**
   Do instead: use `pnpm lint` and `pnpm build`; no test or standalone typecheck script exists yet.

## Repo Structure
1. **[2026-05-20] Single Next app despite workspace file**
   Do instead: treat the repo root as the only package; `pnpm-workspace.yaml` only records pnpm build-policy settings.

## Supabase
1. **[2026-05-20] Project already exists**
   Do instead: use Supabase project `gastly` (`yadpullgqqehyusoonxs`) in `sa-east-1` with `.env.local` variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
