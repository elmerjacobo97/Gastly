ALTER TABLE public.loan_disbursements
  ADD COLUMN IF NOT EXISTS description text;
