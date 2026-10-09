ALTER TABLE public.budgets
  ADD COLUMN currency text NOT NULL DEFAULT 'PEN',
  ADD CONSTRAINT budgets_currency_check CHECK (currency IN ('PEN', 'USD', 'MXN'));

DROP INDEX public.budgets_user_category_month_idx;

CREATE UNIQUE INDEX budgets_user_category_month_currency_idx
  ON public.budgets (user_id, category_id, month, currency);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PEN';

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_currency_check CHECK (currency IN ('PEN', 'USD', 'MXN'));

CREATE TABLE public.monthly_budget_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  month date NOT NULL CHECK (month = date_trunc('month', month)::date),
  currency text NOT NULL CHECK (currency IN ('PEN', 'USD', 'MXN')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month, currency)
);

ALTER TABLE public.monthly_budget_totals ENABLE ROW LEVEL SECURITY;

CREATE POLICY monthly_budget_totals_select_own
  ON public.monthly_budget_totals FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY monthly_budget_totals_insert_own
  ON public.monthly_budget_totals FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY monthly_budget_totals_update_own
  ON public.monthly_budget_totals FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY monthly_budget_totals_delete_own
  ON public.monthly_budget_totals FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.monthly_budget_totals TO authenticated;
