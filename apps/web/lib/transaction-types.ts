import { type Category } from "@/lib/category-types";

export const transactionTypes = ["expense", "income"] as const;

export const paymentMethods = ["cash", "credit_card"] as const;

export type TransactionType = (typeof transactionTypes)[number];

export type PaymentMethod = (typeof paymentMethods)[number];

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  occurredOn: string;
  notes: string | null;
  category: Category | null;
  recurringExpenseId: string | null;
  paymentMethod: PaymentMethod;
  creditCardName: string | null;
  creditCardDueOn: string | null;
  creditCardPaidOn: string | null;
};

export type TransactionSummary = {
  balance: number;
  income: number;
  expenses: number;
  budgetUsage: number;
};
