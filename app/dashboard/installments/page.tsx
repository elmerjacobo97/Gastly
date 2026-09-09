import { format } from "date-fns"
import { redirect } from "next/navigation"

import { InstallmentsPanel } from "@/features/installments/components/installments-panel"
import { getAccounts } from "@/features/accounts/server/queries"
import { getCategories } from "@/features/categories/server/queries"
import { getInstallmentPurchases } from "@/features/installments/server/queries"
import { createClient } from "@/lib/supabase/server"

function parseMonth(month: string | undefined): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return new Date(`${month}-01T12:00:00`)
  }
  return new Date()
}

export default async function InstallmentsPage({
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

  const [purchases, accounts, categories] = await Promise.all([
    getInstallmentPurchases(),
    getAccounts(),
    getCategories(),
  ])

  return (
    <InstallmentsPanel
      purchases={purchases}
      accounts={accounts}
      categories={categories}
      month={format(monthDate, "yyyy-MM")}
    />
  )
}
