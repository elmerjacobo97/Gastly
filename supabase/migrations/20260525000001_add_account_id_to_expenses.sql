ALTER TABLE recurring_expenses
  ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE installment_purchases
  ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION decrement_account_balance(p_account_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE accounts SET balance = balance - p_amount, updated_at = now()
  WHERE id = p_account_id;
$$;

CREATE OR REPLACE FUNCTION check_account_not_savings()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM accounts WHERE id = NEW.account_id AND is_savings = true) THEN
      RAISE EXCEPTION 'No se puede vincular una cuenta de ahorro a gastos o cuotas.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER recurring_expenses_no_savings_account
  BEFORE INSERT OR UPDATE ON recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION check_account_not_savings();

CREATE TRIGGER installment_purchases_no_savings_account
  BEFORE INSERT OR UPDATE ON installment_purchases
  FOR EACH ROW EXECUTE FUNCTION check_account_not_savings();
