import { format } from "date-fns"
import { redirect } from "next/navigation"

import { BudgetPanel } from "@/features/budget/components/budget-panel"
import { getBudgets } from "@/features/budget/server/queries"
import { getCategories } from "@/features/categories/server/queries"
import { getMonthlyPlan } from "@/features/monthly-plan/server/queries"
import { getRecurringPayments } from "@/features/recurring-payments/server/queries"
import { getTransactions } from "@/features/transactions/server/queries"
import { createClient } from "@/lib/supabase/server"

function parseMonth(month: string | undefined): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return new Date(`${month}-01T12:00:00`)
  }
  return new Date()
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { month } = await searchParams
  const monthDate = parseMonth(month)
  const [budgets, plan, fixedExpenses, transactions, categories] = await Promise.all([
    getBudgets(monthDate),
    getMonthlyPlan(monthDate),
    getRecurringPayments(monthDate, "expense"),
    getTransactions({ month: monthDate }),
    getCategories("expense"),
  ])

  return (
    <BudgetPanel
      budgets={budgets}
      plan={plan}
      fixedExpenses={fixedExpenses}
      transactions={transactions}
      categories={categories}
      month={format(monthDate, "yyyy-MM")}
    />
  )
}
