import { format } from "date-fns"
import { redirect } from "next/navigation"

import { getAccounts } from "@/features/accounts/server/queries"
import { getCategories } from "@/features/categories/server/queries"
import { RecurringPaymentsPanel } from "@/features/recurring-payments/components/recurring-payments-panel"
import { getRecurringPaymentHistory, getRecurringPayments } from "@/features/recurring-payments/server/queries"
import { createClient } from "@/lib/supabase/server"

function parseMonth(month: string | undefined): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return new Date(`${month}-01T12:00:00`)
  }
  return new Date()
}

export default async function RecurringPaymentsPage({
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
  const [payments, accounts, categories] = await Promise.all([
    getRecurringPayments(monthDate),
    getAccounts(),
    getCategories(),
  ])
  const historyEntries = await Promise.all(
    payments.map(async (payment) => [payment.id, await getRecurringPaymentHistory(payment.id)] as const)
  )

  return (
    <RecurringPaymentsPanel
      payments={payments}
      historyByPaymentId={Object.fromEntries(historyEntries)}
      accounts={accounts}
      categories={categories}
      month={format(monthDate, "yyyy-MM")}
    />
  )
}
