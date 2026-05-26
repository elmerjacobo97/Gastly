import { addMonths, endOfMonth, format, startOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/browser"
import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/features/installments/types/installment-types"
import { type InstallmentPurchaseValues } from "@/features/installments/schemas/installment-schemas"

type PurchaseRow = {
  id: string
  description: string
  installment_amount: number | string
  interest_amount: number | string
  total_installments: number
  first_payment_on: string
  notes: string | null
  account_id: string | null
  categories: { id: string; name: string; color: string; icon: string } | null
  accounts: { id: string; name: string; color: string } | null
}

type PaymentRow = {
  id: string
  purchase_id: string
  payment_number: number
  due_on: string
  amount: number | string
  transaction_id: string | null
  paid_externally: boolean
}

function mapPayment(row: PaymentRow): InstallmentPayment {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    paymentNumber: row.payment_number,
    dueOn: row.due_on,
    amount: Number(row.amount),
    transactionId: row.transaction_id,
    paidExternally: row.paid_externally,
  }
}

function mapPurchase(row: PurchaseRow, payments: InstallmentPayment[]): InstallmentPurchase {
  const paid = payments.filter((p) => p.transactionId || p.paidExternally)
  const pending = payments.filter((p) => !p.transactionId && !p.paidExternally)
  return {
    id: row.id,
    description: row.description,
    installmentAmount: Number(row.installment_amount),
    interestAmount: Number(row.interest_amount ?? 0),
    totalInstallments: row.total_installments,
    firstPaymentOn: row.first_payment_on,
    notes: row.notes,
    category: row.categories,
    accountId: row.account_id,
    account: row.accounts ?? null,
    payments,
    paidCount: paid.length,
    pendingCount: pending.length,
    totalPaid: paid.reduce((s, p) => s + p.amount, 0),
    totalPending: pending.reduce((s, p) => s + p.amount, 0),
  }
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

export async function getInstallmentPurchases(): Promise<InstallmentPurchase[]> {
  const supabase = createClient()

  const { data: purchases, error } = await supabase
    .from("installment_purchases")
    .select(
      "id, description, installment_amount, interest_amount, total_installments, first_payment_on, notes, account_id, categories(id, name, color, icon), accounts!account_id(id, name, color)"
    )
    .order("created_at", { ascending: false })
    .returns<PurchaseRow[]>()

  if (error) throw new Error(error.message)
  if (!purchases?.length) return []

  const { data: payments, error: pError } = await supabase
    .from("installment_payments")
    .select("id, purchase_id, payment_number, due_on, amount, transaction_id, paid_externally")
    .in(
      "purchase_id",
      purchases.map((p) => p.id)
    )
    .order("payment_number", { ascending: true })
    .returns<PaymentRow[]>()

  if (pError) throw new Error(pError.message)

  const byPurchase = new Map<string, InstallmentPayment[]>()
  for (const row of payments ?? []) {
    const list = byPurchase.get(row.purchase_id) ?? []
    list.push(mapPayment(row))
    byPurchase.set(row.purchase_id, list)
  }

  return purchases.map((p) => mapPurchase(p, byPurchase.get(p.id) ?? []))
}

export async function createInstallmentPurchase(
  values: InstallmentPurchaseValues
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const installmentAmount =
    Math.round(((values.totalAmount + values.interestAmount) / values.totalInstallments) * 100) / 100

  const { data: purchase, error: purchaseError } = await supabase
    .from("installment_purchases")
    .insert({
      user_id: user.id,
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
}

export async function updateInstallmentPurchase(
  id: string,
  values: InstallmentPurchaseValues,
  paidCount: number
): Promise<void> {
  const supabase = createClient()

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
}

export async function deleteInstallmentPurchase(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("installment_purchases").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function payMonthInstallments(
  pending: Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }>,
  occurredOn: string
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const eligible = pending.filter(({ purchase }) => !!purchase.category)

  const txResults = await Promise.all(
    eligible.map(({ payment, purchase }) =>
      supabase
        .from("transactions")
        .insert({
          user_id: user.id,
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
    eligible
      .filter(({ purchase }) => !!purchase.accountId)
      .map(({ payment, purchase }) =>
        supabase.rpc("decrement_account_balance", {
          p_account_id: purchase.accountId!,
          p_amount: payment.amount,
        })
      )
  )

  const decrementError = decrementResults.find((r) => r.error)
  if (decrementError?.error) throw new Error(decrementError.error.message)
}

export function getMonthInstallments(
  purchases: InstallmentPurchase[],
  month: Date
): Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }> {
  const monthKey = format(startOfMonth(month), "yyyy-MM")
  const monthStart = format(startOfMonth(month), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(month), "yyyy-MM-dd")

  return purchases.flatMap((purchase) =>
    purchase.payments
      .filter((p) => p.dueOn >= monthStart && p.dueOn <= monthEnd)
      .map((payment) => ({ payment, purchase }))
  )
}
