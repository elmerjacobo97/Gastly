ALTER TABLE public.loan_payments
  ADD COLUMN disbursement_id uuid;

UPDATE public.loan_payments AS payment
SET disbursement_id = (
  SELECT disbursement.id
  FROM public.loan_disbursements AS disbursement
  WHERE disbursement.loan_id = payment.loan_id
  ORDER BY
    (disbursement.amount = payment.amount) DESC,
    disbursement.occurred_on,
    disbursement.created_at
  LIMIT 1
);

ALTER TABLE public.loan_payments
  ALTER COLUMN disbursement_id SET NOT NULL;

CREATE UNIQUE INDEX loan_disbursements_id_loan_id_idx
  ON public.loan_disbursements (id, loan_id);

ALTER TABLE public.loan_payments
  ADD CONSTRAINT loan_payments_disbursement_loan_fkey
  FOREIGN KEY (disbursement_id, loan_id)
  REFERENCES public.loan_disbursements (id, loan_id)
  ON DELETE CASCADE;

CREATE INDEX loan_payments_disbursement_id_idx
  ON public.loan_payments (disbursement_id);
