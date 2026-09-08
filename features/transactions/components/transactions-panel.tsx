"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useUserSettings } from "@/lib/finance/settings/hooks/queries"
import { useRecurringPayments } from "@/lib/finance/recurring-payments/hooks/queries"
import { type RecurringPayment } from "@/lib/finance/recurring-payments/types/recurring-payment-types"
import { CreditCardDebtCard } from "@/features/transactions/components/credit-card-debt-card"
import { DashboardCharts } from "@/features/transactions/components/dashboard-charts"
import { DashboardSummaryCards } from "@/features/transactions/components/dashboard-summary-cards"
import { UpcomingPaymentsCard } from "@/features/transactions/components/upcoming-payments-card"
import { computeSummary } from "@/lib/finance/transactions/lib/transactions-api"
import {
  useTransactions,
  useMonthlyTotals,
  useCategoryTotals,
  useUnpaidCreditCardTransactions,
} from "@/lib/finance/transactions/hooks/queries"
import { useInstallmentPurchases } from "@/lib/finance/installments/hooks/queries"
import { getMonthInstallments } from "@/lib/finance/installments/lib/installments-api"

type TransactionsPanelProps = {
  userEmail?: string
  userName?: string
  custodySummary?: React.ReactNode
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

export function TransactionsPanel({ userEmail, userName, custodySummary }: TransactionsPanelProps) {
  const today = new Date()
  const monthKey = format(today, "yyyy-MM")
  const monthLabel = format(today, "MMMM yyyy", { locale: es })
  const displayName = userName || userEmail?.split("@")[0] || "Usuario"

  const transactionsQuery = useTransactions({ month: today })
  const settingsQuery = useUserSettings()
  const recurringPaymentsQuery = useRecurringPayments(today)
  const installmentsQuery = useInstallmentPurchases()
  const unpaidCCQuery = useUnpaidCreditCardTransactions()
  const monthlyQuery = useMonthlyTotals(6)
  const categoryQuery = useCategoryTotals(today)

  const transactions = transactionsQuery.data ?? []
  const summary = computeSummary(transactions)
  const allRecurring = recurringPaymentsQuery.data ?? []

  const recurringPayments = allRecurring.filter(
    (p) => p.type === "expense" && isRelevantForMonth(p, monthKey)
  )

  const savingsPct = settingsQuery.data?.savingsPercentage ?? 20
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

  const monthInstallments = getMonthInstallments(installmentsQuery.data ?? [], today)
  const recurringPendingTotal = recurringPayments
    .filter((p) => p.paidOn === null)
    .reduce((s, p) => s + p.amount, 0)
  const installmentsPendingTotal = monthInstallments
    .filter(({ payment }) => !payment.transactionId && !payment.paidExternally)
    .reduce((s, { payment }) => s + payment.amount, 0)
  const creditCardPendingTotal = (unpaidCCQuery.data ?? []).reduce((s, t) => s + t.amount, 0)
  const totalToPay = recurringPendingTotal + installmentsPendingTotal

  const upcomingPayments = recurringPayments
    .map((payment) => ({ expense: payment, days: getDaysUntil(payment.nextDueOn) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)

  const summaryIsLoading =
    transactionsQuery.isLoading || settingsQuery.isLoading ||
    recurringPaymentsQuery.isLoading || installmentsQuery.isLoading ||
    unpaidCCQuery.isLoading

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

      {transactionsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar las transacciones</AlertTitle>
          <AlertDescription>
            {transactionsQuery.error instanceof Error
              ? transactionsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => transactionsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {settingsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar tu configuración</AlertTitle>
          <AlertDescription>
            {settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => settingsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {recurringPaymentsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar los pagos recurrentes</AlertTitle>
          <AlertDescription>
            {recurringPaymentsQuery.error instanceof Error
              ? recurringPaymentsQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => recurringPaymentsQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {monthlyQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar el histórico mensual</AlertTitle>
          <AlertDescription>
            {monthlyQuery.error instanceof Error
              ? monthlyQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => monthlyQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {categoryQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudieron cargar los gastos por categoría</AlertTitle>
          <AlertDescription>
            {categoryQuery.error instanceof Error
              ? categoryQuery.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => categoryQuery.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      <DashboardSummaryCards
        isLoading={summaryIsLoading}
        availableForVariable={availableForVariable}
        totalToPay={totalToPay}
        creditCardDebt={creditCardPendingTotal}
        availableAfterSavings={availableAfterSavings}
        variableSpent={variableSpent}
        usage={usage}
        remaining={remaining}
      />

      {custodySummary}

      <UpcomingPaymentsCard
        isLoading={recurringPaymentsQuery.isLoading}
        payments={upcomingPayments}
      />

      <CreditCardDebtCard
        isLoading={unpaidCCQuery.isLoading}
        transactions={unpaidCCQuery.data ?? []}
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
