ALTER TABLE public.loan_disbursements
  ADD COLUMN IF NOT EXISTS interest_rate numeric(6,3) DEFAULT 0 NOT NULL;

ALTER TABLE public.loan_disbursements
  DROP CONSTRAINT IF EXISTS loan_disbursements_interest_rate_check;

ALTER TABLE public.loan_disbursements
  ADD CONSTRAINT loan_disbursements_interest_rate_check
  CHECK (interest_rate >= 0);
