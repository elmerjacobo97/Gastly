"use server"

import { revalidatePath } from "next/cache"
import { addMonths, format } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/features/installments/types/installment-types"
import { type InstallmentPurchaseValues } from "@/features/installments/schemas/installment-schemas"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  return { supabase, userId: user.id }
}

function revalidateInstallments() {
  revalidatePath("/dashboard/installments")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}

function buildPaymentRows(
  purchaseId: string,
  grandTotal: number,
  installmentAmount: number,
  totalInstallments: number,
  firstPaymentOn: string,
  alreadyPaid: number
) {
  const lastAmount =
    Math.round((grandTotal - installmentAmount * (totalInstallments - 1)) * 100) / 100
  const firstDate = new Date(`${firstPaymentOn}T12:00:00`)
  return Array.from({ length: totalInstallments }, (_, i) => ({
    purchase_id: purchaseId,
    payment_number: i + 1,
    due_on: format(addMonths(firstDate, i), "yyyy-MM-dd"),
    amount: i === totalInstallments - 1 ? lastAmount : installmentAmount,
    paid_externally: i < alreadyPaid,
  }))
}

export async function createInstallmentPurchase(
  values: InstallmentPurchaseValues
): Promise<void> {
  const { supabase, userId } = await requireUser()

  const installmentAmount =
    Math.round(((values.totalAmount + values.interestAmount) / values.totalInstallments) * 100) / 100

  const { data: purchase, error: purchaseError } = await supabase
    .from("installment_purchases")
    .insert({
      user_id: userId,
      category_id: values.categoryId,
      description: values.description,
      installment_amount: installmentAmount,
      interest_amount: values.interestAmount,
      total_installments: values.totalInstallments,
      first_payment_on: values.firstPaymentOn,
      notes: values.notes || null,
      account_id: values.accountId || null,
    })
    .select("id")
    .single()

  if (purchaseError) throw new Error(purchaseError.message)

  const payments = buildPaymentRows(
    purchase.id,
    values.totalAmount + values.interestAmount,
    installmentAmount,
    values.totalInstallments,
    values.firstPaymentOn,
    values.alreadyPaid ?? 0
  )

  const { error: paymentsError } = await supabase
    .from("installment_payments")
    .insert(payments)

  if (paymentsError) throw new Error(paymentsError.message)

  revalidateInstallments()
}

export async function updateInstallmentPurchase(
  id: string,
  values: InstallmentPurchaseValues,
  paidCount: number
): Promise<void> {
  const { supabase } = await requireUser()

  type UpdateData = {
    description: string
    category_id: string
    notes: string | null
    account_id: string | null
    installment_amount?: number
    interest_amount?: number
    total_installments?: number
    first_payment_on?: string
  }

  const updateData: UpdateData = {
    description: values.description,
    category_id: values.categoryId,
    notes: values.notes || null,
    account_id: values.accountId || null,
  }

  if (paidCount === 0) {
    const installmentAmount =
      Math.round(((values.totalAmount + values.interestAmount) / values.totalInstallments) * 100) / 100

    updateData.installment_amount = installmentAmount
    updateData.interest_amount = values.interestAmount
    updateData.total_installments = values.totalInstallments
    updateData.first_payment_on = values.firstPaymentOn

    const { error: delError } = await supabase
      .from("installment_payments")
      .delete()
      .eq("purchase_id", id)
    if (delError) throw new Error(delError.message)

    const payments = buildPaymentRows(
      id,
      values.totalAmount + values.interestAmount,
      installmentAmount,
      values.totalInstallments,
      values.firstPaymentOn,
      values.alreadyPaid ?? 0
    )

    const { error: insError } = await supabase.from("installment_payments").insert(payments)
    if (insError) throw new Error(insError.message)
  }

  const { error } = await supabase
    .from("installment_purchases")
    .update(updateData)
    .eq("id", id)
  if (error) throw new Error(error.message)

  revalidateInstallments()
}

export async function deleteInstallmentPurchase(id: string): Promise<void> {
  const { supabase } = await requireUser()

  const { error } = await supabase.from("installment_purchases").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidateInstallments()
}

export async function payMonthInstallments(
  pending: Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }>,
  occurredOn: string
): Promise<void> {
  const { supabase, userId } = await requireUser()

  const eligible = pending.filter(({ purchase }) => !!purchase.category)

  const txResults = await Promise.all(
    eligible.map(({ payment, purchase }) =>
      supabase
        .from("transactions")
        .insert({
          user_id: userId,
          category_id: purchase.category!.id,
          type: "expense",
          amount: payment.amount,
          description: purchase.description,
          occurred_on: occurredOn,
          notes: `Cuota ${payment.paymentNumber}/${purchase.totalInstallments}`,
        })
        .select("id")
        .single()
    )
  )

  const txError = txResults.find((r) => r.error)
  if (txError?.error) throw new Error(txError.error.message)

  const updateResults = await Promise.all(
    eligible.map(({ payment }, i) =>
      supabase
        .from("installment_payments")
        .update({ transaction_id: txResults[i].data!.id })
        .eq("id", payment.id)
    )
  )

  const updateError = updateResults.find((r) => r.error)
  if (updateError?.error) throw new Error(updateError.error.message)

  const decrementResults = await Promise.all(
    eligible.flatMap(({ payment, purchase }) =>
      purchase.accountId
        ? [
            supabase.rpc("decrement_account_balance", {
              p_account_id: purchase.accountId,
              p_amount: payment.amount,
            }),
          ]
        : []
    )
  )

  const decrementError = decrementResults.find((r) => r.error)
  if (decrementError?.error) throw new Error(decrementError.error.message)

  revalidateInstallments()
}
