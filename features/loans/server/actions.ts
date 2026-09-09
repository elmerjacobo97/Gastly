"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { type LoanValues, type LoanPaymentValues } from "@/features/loans/schemas/loan-schemas"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  return { supabase, userId: user.id }
}

function revalidateLoans() {
  revalidatePath("/dashboard/loans")
}

export async function createLoan(values: LoanValues): Promise<void> {
  const { supabase, userId } = await requireUser()

  const { error } = await supabase.from("loans").insert({
    user_id: userId,
    direction: values.direction,
    person_name: values.personName,
    amount: values.amount,
    expected_on: values.expectedOn || null,
    loaned_on: values.loanedOn,
    notes: values.notes || null,
  })

  if (error) throw new Error(error.message)
  revalidateLoans()
}

export async function updateLoan(id: string, values: LoanValues): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase
    .from("loans")
    .update({
      direction: values.direction,
      person_name: values.personName,
      amount: values.amount,
      expected_on: values.expectedOn || null,
      loaned_on: values.loanedOn,
      notes: values.notes || null,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidateLoans()
}

export async function deleteLoan(id: string): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("loans").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidateLoans()
}

export async function recordLoanPayment(
  loanId: string,
  values: LoanPaymentValues
): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    amount: values.amount,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
  })
  if (error) throw new Error(error.message)
  revalidateLoans()
}
