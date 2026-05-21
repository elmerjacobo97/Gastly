import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

export type Category = {
  id: string
  name: string
  type: TransactionType
  color: string
  createdAt: string
}
