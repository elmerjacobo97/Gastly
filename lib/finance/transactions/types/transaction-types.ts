import { type TransactionType, type PaymentMethod } from "@/lib/finance/transactions/schemas/transaction-schemas"

export type Category = {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  description: string
  occurredOn: string
  notes: string | null
  category: Category | null
  recurringExpenseId: string | null
  paymentMethod: PaymentMethod
  creditCardName: string | null
  creditCardDueOn: string | null
  creditCardPaidOn: string | null
}

export type TransactionSummary = {
  balance: number
  income: number
  expenses: number
  budgetUsage: number
}
