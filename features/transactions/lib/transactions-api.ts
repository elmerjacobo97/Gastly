import { format, startOfMonth, endOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/browser"
import {
  type TransactionType,
  type TransactionValues,
} from "@/features/transactions/schemas/transaction-schemas"
import {
  type Category,
  type Transaction,
  type TransactionSummary,
} from "@/features/transactions/types/transaction-types"

type TransactionRow = {
  id: string
  type: TransactionType
  amount: number | string
  description: string
  occurred_on: string
  notes: string | null
  categories: CategoryRow | null
}

type CategoryRow = {
  id: string
  name: string
  type: TransactionType
  color: string
}

function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, type: row.type, color: row.color }
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    occurredOn: row.occurred_on,
    notes: row.notes,
    category: row.categories ? mapCategory(row.categories) : null,
  }
}

export async function getCategories(type?: TransactionType) {
  const supabase = createClient()
  let query = supabase
    .from("categories")
    .select("id, name, type, color")
    .order("name", { ascending: true })

  if (type) query = query.eq("type", type)

  const { data, error } = await query.returns<CategoryRow[]>()
  if (error) throw new Error(error.message)
  return data.map(mapCategory)
}

export async function getTransactions(opts?: {
  type?: TransactionType
  month?: Date
}) {
  const supabase = createClient()
  let query = supabase
    .from("transactions")
    .select(
      "id, type, amount, description, occurred_on, notes, categories(id, name, type, color)"
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100)

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
    throw new Error("Debes iniciar sesión para editar movimientos.")
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

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: category.id,
      type: values.type,
      amount: values.amount,
      description: values.description,
      occurred_on: values.occurredOn,
      notes: values.notes || null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function createTransaction(values: TransactionValues) {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para registrar movimientos.")
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

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: category.id,
    type: values.type,
    amount: values.amount,
    description: values.description,
    occurred_on: values.occurredOn,
    notes: values.notes || null,
  })

  if (error) throw new Error(error.message)
}
