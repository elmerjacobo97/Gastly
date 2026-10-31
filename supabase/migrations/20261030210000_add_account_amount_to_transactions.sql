-- Amount in PEN that actually left the account when a transaction is in a foreign currency.
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS account_amount numeric(12, 2);
