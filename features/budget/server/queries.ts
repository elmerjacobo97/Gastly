import { endOfMonth, format, startOfMonth } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import { type Budget } from "@/features/budget/types/budget-types"

type BudgetRow = {
  id: string
  amount: number | string
  month: string
  categories: {
    id: string
    name: string
    color: string
    icon: string
  }
}

function mapBudget(row: BudgetRow, spent: number): Budget {
  return {
    id: row.id,
    amount: Number(row.amount),
    month: row.month,
    category: row.categories,
    spent,
  }
}

export async function getBudgets(month?: Date): Promise<Budget[]> {
  const supabase = await createClient()
  const targetMonth = startOfMonth(month ?? new Date())
  const monthStart = format(targetMonth, "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(targetMonth), "yyyy-MM-dd")

  const { data, error } = await supabase
    .from("budgets")
    .select("id, amount, month, categories!inner(id, name, color, icon)")
    .eq("month", monthStart)
    .overrideTypes<BudgetRow[], { merge: false }>()

  if (error) throw new Error(error.message)

  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("type", "expense")
    .gte("occurred_on", monthStart)
    .lte("occurred_on", monthEnd)

  if (transactionError) throw new Error(transactionError.message)

  const spentByCategory = new Map<string, number>()
  for (const transaction of transactions ?? []) {
    const spent = spentByCategory.get(transaction.category_id) ?? 0
    spentByCategory.set(transaction.category_id, spent + Number(transaction.amount))
  }

  return (data ?? []).map((row) => mapBudget(row, spentByCategory.get(row.categories.id) ?? 0))
}
