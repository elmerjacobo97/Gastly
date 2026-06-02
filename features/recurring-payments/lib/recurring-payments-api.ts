import { addMonths, addYears, endOfMonth, format, startOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/browser"
import {
  type RecurringPaymentPaymentValues,
  type RecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas"
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

function getNextDueDate(
  currentDate: string,
  frequency: RecurringPayment["frequency"],
  intervalMonths: number
) {
  const date = new Date(`${currentDate}T12:00:00`)
  if (frequency === "yearly") return format(addYears(date, 1), "yyyy-MM-dd")
  return format(addMonths(date, frequency === "monthly" ? 1 : intervalMonths), "yyyy-MM-dd")
}

async function getCurrentUserId(errorMessage: string) {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error(errorMessage)
  }

  return user.id
}

export async function getRecurringPayments(month?: Date, type?: "expense" | "income") {
  const supabase = createClient()
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

  const { data, error } = await query.returns<RecurringPaymentRow[]>()

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
      .returns<PaidTransactionRow[]>()

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

export async function createRecurringPayment(values: RecurringPaymentValues) {
  const supabase = createClient()
  const userId = await getCurrentUserId("Debes iniciar sesion para crear pagos recurrentes.")

  const { error } = await supabase.from("recurring_expenses").insert({
    user_id: userId,
    category_id: values.categoryId,
    amount: values.amount,
    description: values.description,
    frequency: values.frequency,
    interval_months: values.frequency === "custom_months" ? values.intervalMonths : values.frequency === "yearly" ? 12 : 1,
    payment_kind: values.paymentKind,
    next_due_on: values.nextDueOn,
    billing_day: new Date(`${values.nextDueOn}T12:00:00`).getDate(),
    notes: values.notes || null,
    is_active: true,
    account_id: values.accountId || null,
    type: values.type ?? "expense",
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateRecurringPayment(id: string, values: RecurringPaymentValues) {
  const supabase = createClient()
  const { error } = await supabase
    .from("recurring_expenses")
    .update({
      category_id: values.categoryId,
      amount: values.amount,
      description: values.description,
      frequency: values.frequency,
      interval_months: values.frequency === "custom_months" ? values.intervalMonths : values.frequency === "yearly" ? 12 : 1,
      payment_kind: values.paymentKind,
      next_due_on: values.nextDueOn,
      billing_day: new Date(`${values.nextDueOn}T12:00:00`).getDate(),
      notes: values.notes || null,
      account_id: values.accountId || null,
      type: values.type ?? "expense",
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function setRecurringPaymentActive(id: string, isActive: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteRecurringPayment(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export type PaymentHistoryEntry = {
  id: string
  occurredOn: string
  amount: number
  notes: string | null
}

export async function getRecurringPaymentHistory(paymentId: string): Promise<PaymentHistoryEntry[]> {
  const supabase = createClient()
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

export async function registerRecurringPaymentPayment(
  payment: RecurringPayment,
  values: RecurringPaymentPaymentValues
) {
  if (!payment.category) {
    throw new Error("El pago recurrente necesita una categoria para registrar el pago.")
  }

  const supabase = createClient()
  const userId = await getCurrentUserId("Debes iniciar sesion para registrar pagos.")

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: payment.category.id,
    recurring_expense_id: payment.id,
    type: payment.type === "income" ? "income" : "expense",
    amount: values.amount,
    description: payment.description,
    occurred_on: values.occurredOn,
    notes: values.notes || payment.notes,
  })

  if (error) {
    throw new Error(error.message)
  }

  const nextDueOn = getNextDueDate(
    payment.nextDueOn,
    payment.frequency,
    payment.intervalMonths
  )

  const { error: updateError } = await supabase
    .from("recurring_expenses")
    .update({
      next_due_on: nextDueOn,
      billing_day: new Date(`${nextDueOn}T12:00:00`).getDate(),
    })
    .eq("id", payment.id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (payment.accountId) {
    const rpcFn = payment.type === "income" ? "increment_account_balance" : "decrement_account_balance"
    const { error: balanceError } = await supabase.rpc(rpcFn, {
      p_account_id: payment.accountId,
      p_amount: values.amount,
    })
    if (balanceError) throw new Error(balanceError.message)
  }
}
