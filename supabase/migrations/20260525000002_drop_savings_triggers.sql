DROP TRIGGER IF EXISTS recurring_expenses_no_savings_account ON recurring_expenses;
DROP TRIGGER IF EXISTS installment_purchases_no_savings_account ON installment_purchases;
DROP FUNCTION IF EXISTS check_account_not_savings();
