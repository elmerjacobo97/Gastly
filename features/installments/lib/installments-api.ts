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
  total_installments: number
  first_payment_on: string
  notes: string | null
  categories: { id: string; name: string; color: string; icon: string } | null
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
    totalInstallments: row.total_installments,
    firstPaymentOn: row.first_payment_on,
    notes: row.notes,
    category: row.categories,
    payments,
    paidCount: paid.length,
    pendingCount: pending.length,
    totalPaid: paid.reduce((s, p) => s + p.amount, 0),
    totalPending: pending.reduce((s, p) => s + p.amount, 0),
  }
}

export async function getInstallmentPurchases(): Promise<InstallmentPurchase[]> {
  const supabase = createClient()

  const { data: purchases, error } = await supabase
    .from("installment_purchases")
    .select(
      "id, description, installment_amount, total_installments, first_payment_on, notes, categories(id, name, color, icon)"
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
    Math.round((values.totalAmount / values.totalInstallments) * 100) / 100

  const { data: purchase, error: purchaseError } = await supabase
    .from("installment_purchases")
    .insert({
      user_id: user.id,
      category_id: values.categoryId,
      description: values.description,
      installment_amount: installmentAmount,
      total_installments: values.totalInstallments,
      first_payment_on: values.firstPaymentOn,
      notes: values.notes || null,
    })
    .select("id")
    .single()

  if (purchaseError) throw new Error(purchaseError.message)

  const firstDate = new Date(`${values.firstPaymentOn}T12:00:00`)
  const payments = Array.from({ length: values.totalInstallments }, (_, i) => ({
    purchase_id: purchase.id,
    payment_number: i + 1,
    due_on: format(addMonths(firstDate, i), "yyyy-MM-dd"),
    amount: installmentAmount,
    paid_externally: i < (values.alreadyPaid ?? 0),
  }))

  const { error: paymentsError } = await supabase
    .from("installment_payments")
    .insert(payments)

  if (paymentsError) throw new Error(paymentsError.message)
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

  for (const { payment, purchase } of pending) {
    if (!purchase.category) continue

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        category_id: purchase.category.id,
        type: "expense",
        amount: payment.amount,
        description: purchase.description,
        occurred_on: occurredOn,
        notes: `Cuota ${payment.paymentNumber}/${purchase.totalInstallments}`,
      })
      .select("id")
      .single()

    if (txError) throw new Error(txError.message)

    const { error: updateError } = await supabase
      .from("installment_payments")
      .update({ transaction_id: tx.id })
      .eq("id", payment.id)

    if (updateError) throw new Error(updateError.message)
  }
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
