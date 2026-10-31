-- Each account holds a single currency; balances are expressed in it.
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PEN';

ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS accounts_currency_check;

ALTER TABLE public.accounts
ADD CONSTRAINT accounts_currency_check
CHECK (currency = ANY (ARRAY['PEN'::text, 'USD'::text, 'MXN'::text]));

UPDATE public.accounts
SET currency = 'USD'
WHERE id = '7fb620a3-9464-40a3-bc09-09d498f7a96a';
