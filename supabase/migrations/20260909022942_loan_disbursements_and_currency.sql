ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PEN' NOT NULL;

ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_currency_check;

ALTER TABLE public.loans
  ADD CONSTRAINT loans_currency_check
  CHECK (currency = ANY (ARRAY['PEN'::text, 'USD'::text, 'MXN'::text]));

CREATE TABLE IF NOT EXISTS public.loan_disbursements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  loan_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  occurred_on date NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT loan_disbursements_pkey PRIMARY KEY (id),
  CONSTRAINT loan_disbursements_amount_positive CHECK (amount > 0),
  CONSTRAINT loan_disbursements_loan_id_fkey
    FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS loan_disbursements_loan_id_idx
  ON public.loan_disbursements (loan_id);

ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own loan disbursements" ON public.loan_disbursements;

CREATE POLICY "Users manage own loan disbursements"
  ON public.loan_disbursements
  USING (
    loan_id IN (SELECT loans.id FROM public.loans WHERE loans.user_id = auth.uid())
  )
  WITH CHECK (
    loan_id IN (SELECT loans.id FROM public.loans WHERE loans.user_id = auth.uid())
  );

GRANT ALL ON TABLE public.loan_disbursements TO anon;
GRANT ALL ON TABLE public.loan_disbursements TO authenticated;
GRANT ALL ON TABLE public.loan_disbursements TO service_role;

INSERT INTO public.loan_disbursements (loan_id, amount, occurred_on, notes)
SELECT id, amount, loaned_on, notes
FROM public.loans
WHERE NOT EXISTS (
  SELECT 1 FROM public.loan_disbursements d WHERE d.loan_id = loans.id
);

CREATE UNIQUE INDEX IF NOT EXISTS loans_user_person_direction_currency_idx
  ON public.loans (user_id, direction, lower(btrim(person_name)), currency);
