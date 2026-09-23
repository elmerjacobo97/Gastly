-- The original currency migration is in some environments' migration history,
-- but the live table may still be missing the column. Keep this reconciliation
-- safe for environments where the earlier migration did apply successfully.
alter table public.recurring_expenses
  add column if not exists currency text not null default 'PEN';
