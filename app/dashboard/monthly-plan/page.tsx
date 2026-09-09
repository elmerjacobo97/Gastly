import { format } from "date-fns"
import { redirect } from "next/navigation"

import { MonthlyPlanPanel } from "@/features/monthly-plan/components/monthly-plan-panel"
import { getCategories } from "@/features/categories/server/queries"
import { getMonthlyPlan } from "@/features/monthly-plan/server/queries"
import { getTransactions } from "@/features/transactions/server/queries"
import { createClient } from "@/lib/supabase/server"

function parseMonth(month: string | undefined): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return new Date(`${month}-01T12:00:00`)
  }
  return new Date()
}

export default async function MonthlyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { month } = await searchParams
  const monthDate = parseMonth(month)

  const [plan, transactions, categories] = await Promise.all([
    getMonthlyPlan(monthDate),
    getTransactions({ month: monthDate }),
    getCategories(),
  ])

  return (
    <MonthlyPlanPanel
      plan={plan}
      transactions={transactions}
      categories={categories}
      month={format(monthDate, "yyyy-MM")}
    />
  )
}
