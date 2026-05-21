import { addMonths, addYears, endOfMonth, format, startOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/browser"
import {
  type FixedExpensePaymentValues,
  type FixedExpenseValues,
} from "@/features/fixed-expenses/schemas/fixed-expense-schemas"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"

type FixedExpenseRow = {
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
  categories: {
    id: string
    name: string
    color: string
  } | null
}

type PaidTransactionRow = {
  recurring_expense_id: string | null
  occurred_on: string
  amount: number | string
}

function mapFixedExpense(
  row: FixedExpenseRow,
  paidByExpense: Map<string, string>,
  paidAmountByExpense: Map<string, number>
): FixedExpense {
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
    category: row.categories,
    paidOn: paidByExpense.get(row.id) ?? null,
    paidAmount: paidAmountByExpense.get(row.id) ?? null,
  }
}

function getNextDueDate(
  currentDate: string,
  frequency: FixedExpense["frequency"],
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

export async function getFixedExpenses(month?: Date) {
  const supabase = createClient()
  const targetMonth = startOfMonth(month ?? new Date())
  const monthStart = format(targetMonth, "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(targetMonth), "yyyy-MM-dd")

  const { data, error } = await supabase
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
      categories(id, name, color)
    `
    )
    .order("is_active", { ascending: false })
    .order("next_due_on", { ascending: true })
    .returns<FixedExpenseRow[]>()

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

  return data.map((row) => mapFixedExpense(row, paidByExpense, paidAmountByExpense))
}

export async function createFixedExpense(values: FixedExpenseValues) {
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
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateFixedExpense(id: string, values: FixedExpenseValues) {
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
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function setFixedExpenseActive(id: string, isActive: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteFixedExpense(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function registerFixedExpensePayment(
  expense: FixedExpense,
  values: FixedExpensePaymentValues
) {
  if (!expense.category) {
    throw new Error("El pago recurrente necesita una categoria para registrar el pago.")
  }

  const supabase = createClient()
  const userId = await getCurrentUserId("Debes iniciar sesion para registrar pagos.")

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: expense.category.id,
    recurring_expense_id: expense.id,
    type: "expense",
    amount: values.amount,
    description: expense.description,
    occurred_on: values.occurredOn,
    notes: values.notes || expense.notes,
  })

  if (error) {
    throw new Error(error.message)
  }

  const nextDueOn = getNextDueDate(
    expense.nextDueOn,
    expense.frequency,
    expense.intervalMonths
  )

  const { error: updateError } = await supabase
    .from("recurring_expenses")
    .update({
      next_due_on: nextDueOn,
      billing_day: new Date(`${nextDueOn}T12:00:00`).getDate(),
    })
    .eq("id", expense.id)

  if (updateError) {
    throw new Error(updateError.message)
  }
}
