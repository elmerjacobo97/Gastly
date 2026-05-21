"use client"

import { useQuery } from "@tanstack/react-query"
import {
  CalendarClockIcon,
  CircleAlertIcon,
  WalletCardsIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { getBudgets } from "@/features/budget/lib/budget-api"
import {
  calculateSavings,
  getMonthlyPlan,
} from "@/features/monthly-plan/lib/monthly-plan-api"
import { getFixedExpenses } from "@/features/fixed-expenses/lib/fixed-expenses-api"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"
import {
  getCategoryTotals,
  getMonthlyTotals,
} from "@/features/transactions/lib/charts-api"
import { DashboardAlerts, type DashboardAlert } from "@/features/transactions/components/dashboard/dashboard-alerts"
import { DashboardCharts } from "@/features/transactions/components/dashboard/dashboard-charts"
import { DashboardSummaryCards } from "@/features/transactions/components/dashboard/dashboard-summary-cards"
import { FinancialHealthCard } from "@/features/transactions/components/dashboard/financial-health-card"
import { MonthlyPlanSummaryCard } from "@/features/transactions/components/dashboard/monthly-plan-summary-card"
import { UpcomingPaymentsCard } from "@/features/transactions/components/dashboard/upcoming-payments-card"
import {
  computeSummary,
  getTransactions,
} from "@/features/transactions/lib/transactions-api"
import { formatCurrency } from "@/lib/format"

type TransactionsPanelProps = {
  userEmail?: string
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

export function TransactionsPanel({ userEmail }: TransactionsPanelProps) {
  const today = new Date()
  const monthKey = today.toISOString().slice(0, 7)
  const monthLabel = format(today, "MMMM yyyy", { locale: es })

  const transactionsQuery = useQuery({
    queryKey: ["transactions", monthKey],
    queryFn: () => getTransactions({ month: today }),
  })
  const planQuery = useQuery({
    queryKey: ["monthly-plan", monthKey],
    queryFn: () => getMonthlyPlan(today),
  })
  const fixedExpensesQuery = useQuery({
    queryKey: ["fixed-expenses", monthKey],
    queryFn: () => getFixedExpenses(today),
  })
  const budgetsQuery = useQuery({
    queryKey: ["budgets", monthKey],
    queryFn: () => getBudgets(today),
  })
  const monthlyQuery = useQuery({
    queryKey: ["monthly-totals"],
    queryFn: () => getMonthlyTotals(6),
  })
  const categoryQuery = useQuery({
    queryKey: ["category-totals", monthKey],
    queryFn: () => getCategoryTotals(today),
  })

  const transactions = transactionsQuery.data ?? []
  const summary = computeSummary(transactions)
  const plan = planQuery.data ?? null
  const recurringPayments = (fixedExpensesQuery.data ?? []).filter((expense) =>
    isRelevantRecurringPayment(expense, monthKey)
  )
  const savings = calculateSavings(plan)
  const recurringEstimated = recurringPayments.reduce((sum, expense) => {
    return sum + (expense.paidAmount ?? expense.amount)
  }, 0)
  const recurringPaid = recurringPayments.reduce((sum, expense) => {
    return sum + (expense.paidAmount ?? 0)
  }, 0)
  const availableAfterSavings = plan
    ? Math.max(plan.expectedIncome - savings, 0)
    : summary.income
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
  const budgetAlerts = (budgetsQuery.data ?? [])
    .map((budget) => ({
      budget,
      usage: budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0,
    }))
    .filter(({ usage }) => usage >= 80)
    .sort((a, b) => b.usage - a.usage)

  const dueAlerts = recurringPayments
    .filter((expense) => !expense.paidOn && expense.isActive)
    .map((expense) => ({ expense, days: getDaysUntil(expense.nextDueOn) }))
    .filter(({ days }) => days <= 7)
    .sort((a, b) => a.days - b.days)

  const upcomingPayments = recurringPayments
    .map((expense) => ({ expense, days: getDaysUntil(expense.nextDueOn) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)

  const summaryIsLoading =
    transactionsQuery.isLoading || planQuery.isLoading || fixedExpensesQuery.isLoading

  const intelligentAlerts: DashboardAlert[] = [
    ...dueAlerts.map(({ expense, days }) => ({
      key: `due-${expense.id}`,
      icon: CalendarClockIcon,
      title: days < 0 ? `${expense.description} está vencido` : `${expense.description} vence pronto`,
      description:
        days < 0
          ? `Debió pagarse hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}.`
          : `Vence en ${days} día${days !== 1 ? "s" : ""}.`,
      variant: (days < 0 ? "destructive" : "warning") as "destructive" | "warning" | "default",
    })),
    ...budgetAlerts.map(({ budget, usage }) => ({
      key: `budget-${budget.id}`,
      icon: CircleAlertIcon,
      title: `Ya usaste ${usage}% de ${budget.category.name}`,
      description: `Gastaste ${formatCurrency(budget.spent)} de ${formatCurrency(budget.amount)} presupuestados.`,
      variant: (usage >= 100 ? "destructive" : "warning") as "destructive" | "warning" | "default",
    })),
    ...(plan && remaining < 0
      ? [
          {
            key: "remaining",
            icon: WalletCardsIcon,
            title: "Estás en rojo este mes",
            description: `Te pasaste por ${formatCurrency(Math.abs(remaining))}.`,
            variant: "destructive" as "destructive" | "warning" | "default",
          },
        ]
      : []),
  ].slice(0, 6)

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge className="w-fit capitalize" variant="secondary">
            {monthLabel}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola, {userEmail?.split("@")[0] ?? "Usuario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas de este mes.
          </p>
        </div>
      </section>

      <MonthlyPlanSummaryCard
        date={today}
        plan={plan}
        isLoading={planQuery.isLoading}
        savings={savings}
        availableAfterSavings={availableAfterSavings}
      />

      {plan && <FinancialHealthCard usage={usage} remaining={remaining} />}

      <DashboardSummaryCards
        isLoading={summaryIsLoading}
        hasPlan={!!plan}
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

      <DashboardAlerts alerts={intelligentAlerts} />

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
