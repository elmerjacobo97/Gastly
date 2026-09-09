import { type Transaction, type TransactionSummary } from "@/features/transactions/types/transaction-types"

export function computeSummary(transactions: Transaction[]): TransactionSummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  return {
    balance: income - expenses,
    income,
    expenses,
    budgetUsage: income > 0 ? Math.round((expenses / income) * 100) : 0,
  }
}
