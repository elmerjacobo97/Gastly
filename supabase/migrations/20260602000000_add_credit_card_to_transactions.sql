ALTER TABLE transactions
  ADD COLUMN payment_method text NOT NULL DEFAULT 'cash'
    CONSTRAINT transactions_payment_method_check CHECK (payment_method IN ('cash', 'credit_card')),
  ADD COLUMN credit_card_name text,
  ADD COLUMN credit_card_due_on date,
  ADD COLUMN credit_card_paid_on date;

CREATE INDEX idx_transactions_credit_card_unpaid
  ON transactions (user_id)
  WHERE payment_method = 'credit_card' AND credit_card_paid_on IS NULL;
