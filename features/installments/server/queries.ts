import { createClient } from "@/lib/supabase/server"
import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/features/installments/types/installment-types"

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

export async function getInstallmentPurchases(): Promise<InstallmentPurchase[]> {
  const supabase = await createClient()

  const { data: purchases, error } = await supabase
    .from("installment_purchases")
    .select(
      "id, description, installment_amount, interest_amount, total_installments, first_payment_on, notes, account_id, categories(id, name, color, icon), accounts!account_id(id, name, color)"
    )
    .order("created_at", { ascending: false })
    .overrideTypes<PurchaseRow[], { merge: false }>()

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
    .overrideTypes<PaymentRow[], { merge: false }>()

  if (pError) throw new Error(pError.message)

  const byPurchase = new Map<string, InstallmentPayment[]>()
  for (const row of payments ?? []) {
    const list = byPurchase.get(row.purchase_id) ?? []
    list.push(mapPayment(row))
    byPurchase.set(row.purchase_id, list)
  }

  return purchases.map((p) => mapPurchase(p, byPurchase.get(p.id) ?? []))
}
