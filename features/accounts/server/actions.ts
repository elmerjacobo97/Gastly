"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  type AccountValues,
  type TransferValues,
} from "@/features/accounts/schemas/account-schemas"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("Debes iniciar sesión.")

  return { supabase, userId: user.id }
}

function revalidateAccounts() {
  revalidatePath("/dashboard/accounts")
  revalidatePath("/dashboard")
}

export async function createAccount(values: AccountValues): Promise<string> {
  const { supabase, userId } = await requireUser()

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: values.name,
      balance: values.balance,
      color: values.color,
      notes: values.notes || null,
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  revalidateAccounts()
  return data.id
}

export async function updateAccount(id: string, values: AccountValues): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from("accounts")
    .update({
      name: values.name,
      balance: values.balance,
      color: values.color,
      notes: values.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAccounts()
}

export async function deleteAccount(id: string): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("accounts").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateAccounts()
}

export async function createTransfer(values: TransferValues): Promise<void> {
  const { supabase, userId } = await requireUser()

  const { error } = await supabase
    .from("account_transfers")
    .insert({
      user_id: userId,
      from_account_id: values.fromAccountId,
      to_account_id: values.toAccountId,
      amount: values.amount,
      occurred_on: values.occurredOn,
      notes: values.notes || null,
    })
  if (error) throw new Error(error.message)

  const [fromAccount, toAccount] = await Promise.all([
    supabase
      .from("accounts")
      .select("balance")
      .eq("id", values.fromAccountId)
      .single(),
    supabase
      .from("accounts")
      .select("balance")
      .eq("id", values.toAccountId)
      .single(),
  ])

  if (fromAccount.data) {
    await supabase
      .from("accounts")
      .update({
        balance: Number(fromAccount.data.balance) - values.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", values.fromAccountId)
  }
  if (toAccount.data) {
    await supabase
      .from("accounts")
      .update({
        balance: Number(toAccount.data.balance) + values.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", values.toAccountId)
  }

  revalidateAccounts()
}
