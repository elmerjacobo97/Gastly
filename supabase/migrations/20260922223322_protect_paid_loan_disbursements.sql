ALTER TABLE public.loan_payments
  DROP CONSTRAINT loan_payments_disbursement_loan_fkey;

ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_disbursement_loan_fkey
  FOREIGN KEY (disbursement_id, loan_id)
  REFERENCES public.loan_disbursements (id, loan_id)
  ON DELETE RESTRICT;
