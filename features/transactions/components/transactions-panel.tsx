"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { useUserSettings } from "@/features/settings/hooks/queries"
import { useFixedExpenses } from "@/features/fixed-expenses/hooks/queries"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"
import { DashboardCharts } from "@/features/transactions/components/dashboard-charts"
import { DashboardSummaryCards } from "@/features/transactions/components/dashboard-summary-cards"
import { UpcomingPaymentsCard } from "@/features/transactions/components/upcoming-payments-card"
import { computeSummary } from "@/features/transactions/lib/transactions-api"
import {
  useTransactions,
  useMonthlyTotals,
  useCategoryTotals,
} from "@/features/transactions/hooks/queries"

type TransactionsPanelProps = {
  userEmail?: string
  userName?: string
}

function isRelevantRecurringPayment(expense: FixedExpense, monthKey: string) {
  if (!expense.isActive) return false
  if (expense.frequency === "monthly") return true
  return expense.nextDueOn.startsWith(monthKey) || expense.paidOn?.startsWith(monthKey)
}

function getDaysRemainingInMonth(date: Date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return Math.max(lastDay - date.getDate() + 1, 1)
}

function getDaysUntil(date: string) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const diffMs = new Date(`${date}T12:00:00`).getTime() - new Date(`${todayStr}T12:00:00`).getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function TransactionsPanel({ userEmail, userName }: TransactionsPanelProps) {
  const today = new Date()
  const monthKey = format(today, "yyyy-MM")
  const monthLabel = format(today, "MMMM yyyy", { locale: es })
  const displayName = userName || userEmail?.split("@")[0] || "Usuario"

  const transactionsQuery = useTransactions({ month: today })
  const settingsQuery = useUserSettings()
  const fixedExpensesQuery = useFixedExpenses(today)
  const monthlyQuery = useMonthlyTotals(6)
  const categoryQuery = useCategoryTotals(today)

  const transactions = transactionsQuery.data ?? []
  const summary = computeSummary(transactions)
  const recurringPayments = (fixedExpensesQuery.data ?? []).filter((expense) =>
    isRelevantRecurringPayment(expense, monthKey)
  )
  const savingsPct = settingsQuery.data?.savingsPercentage ?? 20
  const savings = Math.round((summary.income * savingsPct) / 100 * 100) / 100
  const recurringEstimated = recurringPayments.reduce((sum, expense) => {
    return sum + (expense.paidAmount ?? expense.amount)
  }, 0)
  const recurringPaid = recurringPayments.reduce((sum, expense) => {
    return sum + (expense.paidAmount ?? 0)
  }, 0)
  const availableAfterSavings = Math.max(summary.income - savings, 0)
  const availableForVariable = Math.max(availableAfterSavings - recurringEstimated, 0)
  const variableSpent = Math.max(summary.expenses - recurringPaid, 0)
  const remaining = availableForVariable - variableSpent
  const daysRemaining = getDaysRemainingInMonth(today)
  const dailyAvailable = Math.max(remaining, 0) / daysRemaining
  const usage = availableForVariable > 0
    ? Math.round((variableSpent / availableForVariable) * 100)
    : variableSpent > 0
      ? 100
      : 0

  const upcomingPayments = recurringPayments
    .map((expense) => ({ expense, days: getDaysUntil(expense.nextDueOn) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)

  const summaryIsLoading =
    transactionsQuery.isLoading || settingsQuery.isLoading || fixedExpensesQuery.isLoading

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge className="w-fit capitalize" variant="secondary">
            {monthLabel}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas de este mes.
          </p>
        </div>
      </section>

      <DashboardSummaryCards
        isLoading={summaryIsLoading}
        hasPlan={true}
        availableForVariable={availableForVariable}
        savings={savings}
        recurringEstimated={recurringEstimated}
        recurringPaymentCount={recurringPayments.length}
        availableAfterSavings={availableAfterSavings}
        variableSpent={variableSpent}
        usage={usage}
        dailyAvailable={dailyAvailable}
        remaining={remaining}
        daysRemaining={daysRemaining}
      />

      <UpcomingPaymentsCard
        isLoading={fixedExpensesQuery.isLoading}
        payments={upcomingPayments}
      />

      <DashboardCharts
        monthlyData={monthlyQuery.data}
        monthlyIsLoading={monthlyQuery.isLoading}
        categoryData={categoryQuery.data}
        categoryIsLoading={categoryQuery.isLoading}
      />
    </main>
  )
}
