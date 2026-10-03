-- Remove automatic savings settings and monthly-plan saving parameters.
-- Keep monthly plan rows, notes, and transaction relations intact.
ALTER TABLE public.monthly_plans
  DROP CONSTRAINT IF EXISTS monthly_plans_check,
  DROP CONSTRAINT IF EXISTS monthly_plans_savings_mode_check,
  DROP CONSTRAINT IF EXISTS monthly_plans_savings_value_check,
  DROP COLUMN IF EXISTS savings_mode,
  DROP COLUMN IF EXISTS savings_value;

ALTER TABLE public.user_settings
  DROP COLUMN IF EXISTS savings_percentage;
