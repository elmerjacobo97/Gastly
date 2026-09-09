import { format } from "date-fns"
import { redirect } from "next/navigation"

import { MovementsPanel } from "@/features/transactions/components/movements-panel"
import { getCategories } from "@/features/categories/server/queries"
import { getTransactions } from "@/features/transactions/server/queries"
import { createClient } from "@/lib/supabase/server"

function parseMonth(month: string | undefined): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return new Date(`${month}-01T12:00:00`)
  }
  return new Date()
}

export default async function TransactionsPage({
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

  const [transactions, categories] = await Promise.all([
    getTransactions({ month: monthDate }),
    getCategories(),
  ])

  return (
    <MovementsPanel
      transactions={transactions}
      categories={categories}
      month={format(monthDate, "yyyy-MM")}
    />
  )
}
