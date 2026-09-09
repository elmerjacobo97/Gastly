import { format, startOfMonth, subMonths } from "date-fns"
import { es } from "date-fns/locale"

import { createClient } from "@/lib/supabase/server"
import { CHART_COLORS } from "@/lib/chart-utils"

export type MonthlyTotal = {
  month: string
  monthDate: string
  income: number
  expenses: number
}

export type CategoryTotal = {
  name: string
  value: number
  color: string
  fill: string
  icon: string
  categoryColor: string
}

export async function getMonthlyTotals(months = 6): Promise<MonthlyTotal[]> {
  const supabase = await createClient()
  const since = format(startOfMonth(subMonths(new Date(), months - 1)), "yyyy-MM-dd")

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, occurred_on")
    .gte("occurred_on", since)
    .order("occurred_on", { ascending: true })
    .limit(1000)

  if (error) throw new Error(error.message)

  const totals = new Map<string, { income: number; expenses: number }>()

  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    const key = format(startOfMonth(d), "yyyy-MM")
    totals.set(key, { income: 0, expenses: 0 })
  }

  for (const tx of data ?? []) {
    const key = tx.occurred_on.slice(0, 7)
    const entry = totals.get(key)
    if (!entry) continue
    if (tx.type === "income") entry.income += Number(tx.amount)
    else entry.expenses += Number(tx.amount)
  }

  return Array.from(totals.entries()).map(([key, vals]) => ({
    month: format(new Date(`${key}-01`), "MMM", { locale: es }),
    monthDate: key,
    income: vals.income,
    expenses: vals.expenses,
  }))
}

export async function getCategoryTotals(month?: Date): Promise<CategoryTotal[]> {
  const supabase = await createClient()
  const target = month ?? new Date()
  const start = format(startOfMonth(target), "yyyy-MM-dd")
  const end = format(
    new Date(target.getFullYear(), target.getMonth() + 1, 0),
    "yyyy-MM-dd"
  )

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, categories(name, color, icon)")
    .eq("type", "expense")
    .gte("occurred_on", start)
    .lte("occurred_on", end)
    .limit(500)

  if (error) throw new Error(error.message)

  const totals = new Map<string, { value: number; color: string; icon: string }>()

  for (const tx of data ?? []) {
    const rawCat = tx.categories
    const cat = Array.isArray(rawCat)
      ? (rawCat[0] as { name: string; color: string; icon: string } | undefined)
      : (rawCat as { name: string; color: string; icon: string } | null)
    const name = cat?.name ?? "Sin categoría"
    const color = cat?.color ?? "gray"
    const entry = totals.get(name) ?? { value: 0, color, icon: cat?.icon ?? "tag" }
    entry.value += Number(tx.amount)
    totals.set(name, entry)
  }

  return Array.from(totals.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([name, { value, color, icon }], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      fill: CHART_COLORS[i % CHART_COLORS.length],
      icon,
      categoryColor: color,
    }))
}
