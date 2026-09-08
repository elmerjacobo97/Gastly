import { type TransactionType } from "@/lib/finance/transactions/schemas/transaction-schemas"

export type Category = {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  createdAt: string
}
