import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

export type Category = {
  id: string
  name: string
  type: TransactionType
  color: string
}

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  description: string
  occurredOn: string
  notes: string | null
  category: Category | null
}

export type TransactionSummary = {
  balance: number
  income: number
  expenses: number
  budgetUsage: number
}
