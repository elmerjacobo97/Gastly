import {
  type Transaction,
  type TransactionSummary,
} from "@/lib/transaction-types";
import { CURRENCY_CODES } from "@/lib/format";
import { sumByCurrency } from "@/lib/currency-totals";

export function computeSummary(
  transactions: Transaction[],
): TransactionSummary {
  const income = sumByCurrency(
    transactions.filter((transaction) => transaction.type === "income"),
    (transaction) => transaction.amount,
  );
  const expenses = sumByCurrency(
    transactions.filter((transaction) => transaction.type === "expense"),
    (transaction) => transaction.amount,
  );
  const balance: TransactionSummary["balance"] = {};
  const budgetUsage: TransactionSummary["budgetUsage"] = {};

  for (const currency of CURRENCY_CODES) {
    if (income[currency] === undefined && expenses[currency] === undefined) {
      continue;
    }
    const currencyIncome = income[currency] ?? 0;
    const currencyExpenses = expenses[currency] ?? 0;
    balance[currency] = currencyIncome - currencyExpenses;
    budgetUsage[currency] =
      currencyIncome > 0
        ? Math.round((currencyExpenses / currencyIncome) * 100)
        : 0;
  }

  return {
    balance,
    income,
    expenses,
    budgetUsage,
  };
}
