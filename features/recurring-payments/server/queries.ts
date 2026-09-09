import { endOfMonth, format, startOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"

type RecurringPaymentRow = {
  id: string
  amount: number | string
  description: string
  frequency: "monthly" | "custom_months" | "yearly"
  interval_months: number
  payment_kind: "fixed" | "variable"
  next_due_on: string
  billing_day: number
  notes: string | null
  is_active: boolean
  type: "expense" | "income"
  account_id: string | null
  accounts: { id: string; name: string; color: string } | null
  categories: {
    id: string
    name: string
    color: string
    icon: string
  } | null
}

type PaidTransactionRow = {
  recurring_expense_id: string | null
  occurred_on: string
  amount: number | string
}

function mapRecurringPayment(
  row: RecurringPaymentRow,
  paidByExpense: Map<string, string>,
  paidAmountByExpense: Map<string, number>
): RecurringPayment {
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    frequency: row.frequency,
    intervalMonths: row.interval_months,
    paymentKind: row.payment_kind,
    nextDueOn: row.next_due_on,
    notes: row.notes,
    isActive: row.is_active,
    type: row.type,
    category: row.categories,
    accountId: row.account_id,
    account: row.accounts ?? null,
    paidOn: paidByExpense.get(row.id) ?? null,
    paidAmount: paidAmountByExpense.get(row.id) ?? null,
  }
}

export async function getRecurringPayments(month?: Date, type?: "expense" | "income") {
  const supabase = await createClient()
  const targetMonth = startOfMonth(month ?? new Date())
  const monthStart = format(targetMonth, "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(targetMonth), "yyyy-MM-dd")

  let query = supabase
    .from("recurring_expenses")
    .select(
      `
      id,
      amount,
      description,
      frequency,
      interval_months,
      payment_kind,
      next_due_on,
      billing_day,
      notes,
      is_active,
      type,
      account_id,
      accounts!account_id(id, name, color),
      categories(id, name, color, icon)
    `
    )
    .order("is_active", { ascending: false })
    .order("next_due_on", { ascending: true })

  if (type !== undefined) {
    query = query.eq("type", type)
  }

  const { data, error } = await query.overrideTypes<RecurringPaymentRow[], { merge: false }>()

  if (error) {
    throw new Error(error.message)
  }

  const ids = data.map((expense) => expense.id)
  const paidByExpense = new Map<string, string>()
  const paidAmountByExpense = new Map<string, number>()

  if (ids.length > 0) {
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("recurring_expense_id, occurred_on, amount")
      .in("recurring_expense_id", ids)
      .gte("occurred_on", monthStart)
      .lte("occurred_on", monthEnd)
      .overrideTypes<PaidTransactionRow[], { merge: false }>()

    if (txError) {
      throw new Error(txError.message)
    }

    for (const transaction of transactions ?? []) {
      if (transaction.recurring_expense_id) {
        paidByExpense.set(transaction.recurring_expense_id, transaction.occurred_on)
        paidAmountByExpense.set(transaction.recurring_expense_id, Number(transaction.amount))
      }
    }
  }

  return data.map((row) => mapRecurringPayment(row, paidByExpense, paidAmountByExpense))
}

export type PaymentHistoryEntry = {
  id: string
  occurredOn: string
  amount: number
  notes: string | null
}

export async function getRecurringPaymentHistory(paymentId: string): Promise<PaymentHistoryEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("id, occurred_on, amount, notes")
    .eq("recurring_expense_id", paymentId)
    .order("occurred_on", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    occurredOn: row.occurred_on,
    amount: Number(row.amount),
    notes: row.notes,
  }))
}
