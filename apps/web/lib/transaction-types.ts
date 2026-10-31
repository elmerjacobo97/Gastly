import { type Category } from "@/lib/category-types";
import { type CurrencyCode, type CurrencyTotals } from "@/lib/format";

export const transactionTypes = ["expense", "income"] as const;

export type TransactionType = (typeof transactionTypes)[number];

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  description: string;
  occurredOn: string;
  notes: string | null;
  category: Category | null;
  recurringExpenseId: string | null;
  accountId: string | null;
  accountAmount: number | null;
};

export type TransactionSummary = {
  balance: CurrencyTotals;
  income: CurrencyTotals;
  expenses: CurrencyTotals;
  budgetUsage: Partial<Record<CurrencyCode, number>>;
};
