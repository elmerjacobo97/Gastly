import { format, startOfMonth, endOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import {
  type TransactionType,
  type PaymentMethod,
} from "@/features/transactions/schemas/transaction-schemas"
import {
  type Category,
  type Transaction,
} from "@/features/transactions/types/transaction-types"

const TRANSACTION_SELECT =
  "id, type, amount, description, occurred_on, notes, recurring_expense_id, payment_method, credit_card_name, credit_card_due_on, credit_card_paid_on, categories(id, name, type, color, icon)"

type TransactionRow = {
  id: string
  type: TransactionType
  amount: number | string
  description: string
  occurred_on: string
  notes: string | null
  recurring_expense_id: string | null
  categories: CategoryRow | null
  payment_method: PaymentMethod
  credit_card_name: string | null
  credit_card_due_on: string | null
  credit_card_paid_on: string | null
}

type CategoryRow = {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, type: row.type, color: row.color, icon: row.icon }
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    occurredOn: row.occurred_on,
    notes: row.notes,
    recurringExpenseId: row.recurring_expense_id,
    category: row.categories ? mapCategory(row.categories) : null,
    paymentMethod: row.payment_method,
    creditCardName: row.credit_card_name,
    creditCardDueOn: row.credit_card_due_on,
    creditCardPaidOn: row.credit_card_paid_on,
  }
}

export async function getTransactions(opts?: {
  type?: TransactionType
  month?: Date
  from?: string
  to?: string
  limit?: number
}) {
  const supabase = await createClient()
  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500)

  if (opts?.type) query = query.eq("type", opts.type)

  if (opts?.month) {
    query = query
      .gte("occurred_on", format(startOfMonth(opts.month), "yyyy-MM-dd"))
      .lte("occurred_on", format(endOfMonth(opts.month), "yyyy-MM-dd"))
  }

  if (opts?.from) query = query.gte("occurred_on", opts.from)
  if (opts?.to) query = query.lte("occurred_on", opts.to)

  const { data, error } = await query.overrideTypes<TransactionRow[], { merge: false }>()
  if (error) throw new Error(error.message)
  return data.map(mapTransaction)
}

export async function getUnpaidCreditCardTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("payment_method", "credit_card")
    .is("credit_card_paid_on", null)
    .order("occurred_on", { ascending: false })
    .overrideTypes<TransactionRow[], { merge: false }>()
  if (error) throw new Error(error.message)
  return data.map(mapTransaction)
}
