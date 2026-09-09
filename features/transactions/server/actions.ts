"use server"

import { revalidatePath } from "next/cache"
import { format } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import {
  type TransactionValues,
} from "@/features/transactions/schemas/transaction-schemas"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para gestionar transacciones.")
  }

  return { supabase, userId: user.id }
}

function revalidateTransactions() {
  revalidatePath("/dashboard/transactions")
  revalidatePath("/dashboard/movements")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/budget")
  revalidatePath("/dashboard/reports")
}

export async function createTransaction(values: TransactionValues) {
  const { supabase, userId } = await requireUser()

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      { user_id: userId, name: values.categoryName, type: values.type },
      { onConflict: "user_id,type,name" }
    )
    .select("id")
    .single()

  if (categoryError) throw new Error(categoryError.message)

  const isCreditCard = values.paymentMethod === "credit_card"

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: category.id,
    type: values.type,
    amount: values.amount,
    description: values.description,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
    payment_method: values.paymentMethod ?? "cash",
    credit_card_name: isCreditCard ? (values.creditCardName || null) : null,
    credit_card_due_on: isCreditCard ? (values.creditCardDueOn || null) : null,
  })

  if (error) throw new Error(error.message)
  revalidateTransactions()
}

export async function updateTransaction(id: string, values: TransactionValues) {
  const { supabase, userId } = await requireUser()

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      { user_id: userId, name: values.categoryName, type: values.type },
      { onConflict: "user_id,type,name" }
    )
    .select("id")
    .single()

  if (categoryError) throw new Error(categoryError.message)

  const isCreditCard = values.paymentMethod === "credit_card"

  const updateData: Record<string, unknown> = {
    category_id: category.id,
    type: values.type,
    amount: values.amount,
    description: values.description,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
    payment_method: values.paymentMethod ?? "cash",
    credit_card_name: isCreditCard ? (values.creditCardName || null) : null,
    credit_card_due_on: isCreditCard ? (values.creditCardDueOn || null) : null,
  }

  if (!isCreditCard) {
    updateData.credit_card_paid_on = null
  }

  const { error } = await supabase.from("transactions").update(updateData).eq("id", id)
  if (error) throw new Error(error.message)
  revalidateTransactions()
}

export async function deleteTransaction(id: string) {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateTransactions()
}

export async function payAllCreditCardTransactions(cardName: string | null): Promise<void> {
  const { supabase } = await requireUser()

  const today = format(new Date(), "yyyy-MM-dd")
  let query = supabase
    .from("transactions")
    .update({ credit_card_paid_on: today })
    .eq("payment_method", "credit_card")
    .is("credit_card_paid_on", null)

  if (cardName !== null) {
    query = query.eq("credit_card_name", cardName)
  } else {
    query = query.is("credit_card_name", null)
  }

  const { error } = await query
  if (error) throw new Error(error.message)
  revalidateTransactions()
}
