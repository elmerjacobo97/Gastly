import { createAuthedClient } from "../supabase-client.js"
import { getFlagValue, hasFlag, parseMonth } from "../flags.js"
import { formatCurrency, formatPercent, writeJson, writeLine } from "../format.js"
import type { BudgetRecord } from "../types.js"

export async function runBudget(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`Usage:\n  gastly-cli budget [--month YYYY-MM] [--json]\n\nShow budget vs actual spending for the month.\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const monthStr = getFlagValue(args, "--month")
  const month = parseMonth(monthStr) ?? new Date()
  const year = month.getFullYear()
  const mo = month.getMonth() + 1
  const monthStart = `${year}-${String(mo).padStart(2, "0")}-01`
  const lastDay = new Date(year, mo, 0).getDate()
  const monthEnd = `${year}-${String(mo).padStart(2, "0")}-${lastDay}`
  const monthLabel = `${year}-${String(mo).padStart(2, "0")}`

  const { supabase } = await createAuthedClient()

  const { data: budgets, error: budgetError } = await supabase
    .from("budgets")
    .select("id, amount, month, categories!inner(id, name, color, icon)")
    .eq("month", monthStart)

  if (budgetError) throw new Error(budgetError.message)

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("type", "expense")
    .gte("occurred_on", monthStart)
    .lte("occurred_on", monthEnd)

  if (txError) throw new Error(txError.message)

  const spentByCategory = new Map<string, number>()
  for (const tx of transactions ?? []) {
    const current = spentByCategory.get(tx.category_id) ?? 0
    spentByCategory.set(tx.category_id, current + Number(tx.amount))
  }

  const records: BudgetRecord[] = (budgets ?? []).map((row) => {
    const cat = (row.categories as unknown as { id: string; name: string }[] | null)?.[0]
    return {
      id: row.id,
      categoryName: cat?.name ?? "Unknown",
      amount: Number(row.amount),
      spent: spentByCategory.get(cat?.id ?? "") ?? 0,
      month: monthLabel,
    }
  })

  if (json) {
    writeJson(records)
  } else {
    if (records.length === 0) {
      writeLine(`No budgets set for ${monthLabel}.`)
      return
    }

    writeLine(`\nBudget for ${monthLabel}:\n`)
    for (const b of records) {
      const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
      const remaining = b.amount - b.spent
      const bar = pct >= 100 ? "!!!" : pct >= 80 ? "!" : "ok"
      writeLine(
        `  ${b.categoryName.padEnd(20)} ${formatCurrency(b.spent).padStart(12)} / ${formatCurrency(b.amount).padStart(12)}  ${formatPercent(pct).padStart(6)}  ${bar}`,
      )
      if (remaining < 0) {
        writeLine(`    Over by ${formatCurrency(Math.abs(remaining))}`)
      }
    }
  }
}
