-- Budget limits no longer belong to a month: one standing limit per category
-- and currency, plus one global limit per currency. Keep the most recent row
-- of each group, then drop the month column (which drops its unique indexes).

DELETE FROM public.budgets
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, category_id, currency) id
  FROM public.budgets
  ORDER BY user_id, category_id, currency, month DESC, created_at DESC
);

ALTER TABLE public.budgets DROP COLUMN month;

CREATE UNIQUE INDEX budgets_user_category_currency_idx
  ON public.budgets (user_id, category_id, currency);

DELETE FROM public.monthly_budget_totals
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, currency) id
  FROM public.monthly_budget_totals
  ORDER BY user_id, currency, month DESC, created_at DESC
);

ALTER TABLE public.monthly_budget_totals DROP COLUMN month;

ALTER TABLE public.monthly_budget_totals
  ADD CONSTRAINT monthly_budget_totals_user_currency_key
  UNIQUE (user_id, currency);
