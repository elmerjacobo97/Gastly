import { format, startOfMonth, endOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/browser"
import {
  type TransactionType,
  type PaymentMethod,
  type TransactionValues,
} from "@/features/transactions/schemas/transaction-schemas"
import {
  type Category,
  type Transaction,
  type TransactionSummary,
} from "@/features/transactions/types/transaction-types"

const TRANSACTION_SELECT =
  "id, type, amount, description, occurred_on, notes, payment_method, credit_card_name, credit_card_due_on, credit_card_paid_on, categories(id, name, type, color, icon)"

type TransactionRow = {
  id: string
  type: TransactionType
  amount: number | string
  description: string
  occurred_on: string
  notes: string | null
  categories: CategoryRow | null
  payment_method: PaymentMethod
  credit_card_name: string | null
  credit_card_due_on: string | null
  credit_card_paid_on: string | null
}

type CategoryRow = {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, type: row.type, color: row.color, icon: row.icon }
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    occurredOn: row.occurred_on,
    notes: row.notes,
    recurringExpenseId: null,
    category: row.categories ? mapCategory(row.categories) : null,
    paymentMethod: row.payment_method,
    creditCardName: row.credit_card_name,
    creditCardDueOn: row.credit_card_due_on,
    creditCardPaidOn: row.credit_card_paid_on,
  }
}

export async function getTransactions(opts?: {
  type?: TransactionType
  month?: Date
}) {
  const supabase = createClient()
  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)

  if (opts?.type) query = query.eq("type", opts.type)

  if (opts?.month) {
    query = query
      .gte("occurred_on", format(startOfMonth(opts.month), "yyyy-MM-dd"))
      .lte("occurred_on", format(endOfMonth(opts.month), "yyyy-MM-dd"))
  }

  const { data, error } = await query.returns<TransactionRow[]>()
  if (error) throw new Error(error.message)
  return data.map(mapTransaction)
}

export async function getUnpaidCreditCardTransactions(): Promise<Transaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("payment_method", "credit_card")
    .is("credit_card_paid_on", null)
    .order("occurred_on", { ascending: false })
    .returns<TransactionRow[]>()
  if (error) throw new Error(error.message)
  return data.map(mapTransaction)
}

export async function payAllCreditCardTransactions(cardName: string | null): Promise<void> {
  const supabase = createClient()
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
}

export function computeSummary(transactions: Transaction[]): TransactionSummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  return {
    balance: income - expenses,
    income,
    expenses,
    budgetUsage: income > 0 ? Math.round((expenses / income) * 100) : 0,
  }
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function updateTransaction(id: string, values: TransactionValues) {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para editar transacciones.")
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      { user_id: user.id, name: values.categoryName, type: values.type },
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
}

export async function createTransaction(values: TransactionValues) {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para registrar transacciones.")
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      { user_id: user.id, name: values.categoryName, type: values.type },
      { onConflict: "user_id,type,name" }
    )
    .select("id")
    .single()

  if (categoryError) throw new Error(categoryError.message)

  const isCreditCard = values.paymentMethod === "credit_card"

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
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
}
