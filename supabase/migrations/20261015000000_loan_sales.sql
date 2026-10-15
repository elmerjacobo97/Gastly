ALTER TABLE public.loan_disbursements
  ADD COLUMN is_sale boolean NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN loan_payment_id uuid
  REFERENCES public.loan_payments (id) ON DELETE CASCADE;

CREATE UNIQUE INDEX transactions_loan_payment_id_idx
  ON public.transactions (loan_payment_id)
  WHERE loan_payment_id IS NOT NULL;
