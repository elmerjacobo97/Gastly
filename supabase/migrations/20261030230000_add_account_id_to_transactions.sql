-- Account the money moved through; null for transactions not tied to an account.
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_account_id
ON public.transactions (account_id)
WHERE account_id IS NOT NULL;
