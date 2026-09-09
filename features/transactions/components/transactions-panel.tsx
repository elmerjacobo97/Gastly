import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { CreditCardDebtCard } from "@/features/transactions/components/credit-card-debt-card"
import { DashboardCharts } from "@/features/transactions/components/dashboard-charts"
import { DashboardSummaryCards } from "@/features/transactions/components/dashboard-summary-cards"
import { UpcomingPaymentsCard } from "@/features/transactions/components/upcoming-payments-card"
import { getMonthInstallments } from "@/features/installments/lib/installments-api"
import { computeSummary } from "@/features/transactions/lib/transactions-api"
import {
  type CategoryTotal,
  type MonthlyTotal,
} from "@/features/transactions/server/charts-queries"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { type InstallmentPurchase } from "@/features/installments/types/installment-types"

type TransactionsPanelProps = {
  userEmail?: string
  userName?: string
  custodySummary?: React.ReactNode
  transactions: Transaction[]
  unpaidCreditCard: Transaction[]
  recurringPayments: RecurringPayment[]
  installments: InstallmentPurchase[]
  savingsPct: number
  monthlyData?: MonthlyTotal[]
  categoryData?: CategoryTotal[]
}

function isRelevantForMonth(payment: RecurringPayment, monthKey: string) {
  if (!payment.isActive) return false
  if (payment.frequency === "monthly") return true
  return payment.nextDueOn.startsWith(monthKey) || payment.paidOn?.startsWith(monthKey)
}

function getDaysUntil(date: string) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const diffMs = new Date(`${date}T12:00:00`).getTime() - new Date(`${todayStr}T12:00:00`).getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function TransactionsPanel({
  userEmail,
  userName,
  custodySummary,
  transactions,
  unpaidCreditCard,
  recurringPayments: allRecurring,
  installments,
  savingsPct,
  monthlyData,
  categoryData,
}: TransactionsPanelProps) {
  const today = new Date()
  const monthKey = format(today, "yyyy-MM")
  const monthLabel = format(today, "MMMM yyyy", { locale: es })
  const displayName = userName || userEmail?.split("@")[0] || "Usuario"

  const summary = computeSummary(transactions)

  const recurringPayments = allRecurring.filter(
    (p) => p.type === "expense" && isRelevantForMonth(p, monthKey)
  )

  const savings = Math.round((summary.income * savingsPct) / 100 * 100) / 100
  const recurringEstimated = recurringPayments.reduce((sum, payment) => {
    return sum + (payment.paidAmount ?? payment.amount)
  }, 0)
  const recurringPaid = recurringPayments.reduce((sum, payment) => {
    return sum + (payment.paidAmount ?? 0)
  }, 0)
  const availableAfterSavings = Math.max(summary.income - savings, 0)
  const availableForVariable = Math.max(availableAfterSavings - recurringEstimated, 0)
  const variableSpent = Math.max(summary.expenses - recurringPaid, 0)
  const remaining = availableForVariable - variableSpent
  const usage = availableForVariable > 0
    ? Math.round((variableSpent / availableForVariable) * 100)
    : variableSpent > 0
      ? 100
      : 0

  const monthInstallments = getMonthInstallments(installments, today)
  const recurringPendingTotal = recurringPayments
    .filter((p) => p.paidOn === null)
    .reduce((s, p) => s + p.amount, 0)
  const installmentsPendingTotal = monthInstallments
    .filter(({ payment }) => !payment.transactionId && !payment.paidExternally)
    .reduce((s, { payment }) => s + payment.amount, 0)
  const creditCardPendingTotal = unpaidCreditCard.reduce((s, t) => s + t.amount, 0)
  const totalToPay = recurringPendingTotal + installmentsPendingTotal

  const upcomingPayments = recurringPayments
    .map((payment) => ({ expense: payment, days: getDaysUntil(payment.nextDueOn) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)

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
        availableForVariable={availableForVariable}
        totalToPay={totalToPay}
        creditCardDebt={creditCardPendingTotal}
        availableAfterSavings={availableAfterSavings}
        variableSpent={variableSpent}
        usage={usage}
        remaining={remaining}
      />

      {custodySummary}

      <UpcomingPaymentsCard payments={upcomingPayments} />

      <CreditCardDebtCard transactions={unpaidCreditCard} />

      <DashboardCharts monthlyData={monthlyData} categoryData={categoryData} />
    </main>
  )
}
