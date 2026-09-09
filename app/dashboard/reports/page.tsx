import { format, startOfYear, subYears } from "date-fns"
import { redirect } from "next/navigation"

import { ReportsPanel } from "@/features/reports/components/reports-panel"
import { getMonthlyPlan } from "@/features/monthly-plan/server/queries"
import { getTransactions } from "@/features/transactions/server/queries"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Reportes · Gastly",
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const today = new Date()
  const [transactions, plan] = await Promise.all([
    getTransactions({
      from: format(startOfYear(subYears(today, 1)), "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    }),
    getMonthlyPlan(today),
  ])

  return <ReportsPanel transactions={transactions} plan={plan} />
}
