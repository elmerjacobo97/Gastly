import { redirect } from "next/navigation"

import { TransactionsPanel } from "@/features/transactions/components/transactions-panel"
import { getInstallmentPurchases } from "@/features/installments/server/queries"
import { getRecurringPayments } from "@/features/recurring-payments/server/queries"
import {
  getCategoryTotals,
  getMonthlyTotals,
} from "@/features/transactions/server/charts-queries"
import {
  getTransactions,
  getUnpaidCreditCardTransactions,
} from "@/features/transactions/server/queries"
import { getUserSettings } from "@/features/settings/server/queries"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const today = new Date()

  const [
    transactions,
    unpaidCreditCard,
    allRecurring,
    installments,
    settings,
    monthlyData,
    categoryData,
  ] = await Promise.all([
    getTransactions({ month: today }),
    getUnpaidCreditCardTransactions(),
    getRecurringPayments(today, "expense"),
    getInstallmentPurchases(),
    getUserSettings(),
    getMonthlyTotals(6),
    getCategoryTotals(today),
  ])

  return (
    <TransactionsPanel
      userEmail={user.email}
      userName={user.user_metadata?.full_name as string | undefined}
      transactions={transactions}
      unpaidCreditCard={unpaidCreditCard}
      recurringPayments={allRecurring}
      installments={installments}
      savingsPct={settings.savingsPercentage}
      monthlyData={monthlyData}
      categoryData={categoryData}
    />
  )
}
