"use server"

import { revalidatePath } from "next/cache"
import { addMonths, addYears, format } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import {
  type RecurringPaymentPaymentValues,
  type RecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Debes iniciar sesión.")
  }

  return { supabase, userId: user.id }
}

function revalidateRecurring() {
  revalidatePath("/dashboard/recurring-payments")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
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

export async function createRecurringPayment(values: RecurringPaymentValues) {
  const { supabase, userId } = await requireUser()

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

  revalidateRecurring()
}

export async function updateRecurringPayment(id: string, values: RecurringPaymentValues) {
  const { supabase } = await requireUser()

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

  revalidateRecurring()
}

export async function setRecurringPaymentActive(id: string, isActive: boolean) {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from("recurring_expenses")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateRecurring()
}

export async function deleteRecurringPayment(id: string) {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateRecurring()
}

export async function registerRecurringPaymentPayment(
  payment: RecurringPayment,
  values: RecurringPaymentPaymentValues
) {
  if (!payment.category) {
    throw new Error("El pago recurrente necesita una categoria para registrar el pago.")
  }

  const { supabase, userId } = await requireUser()

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

  revalidateRecurring()
}
